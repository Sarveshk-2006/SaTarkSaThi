import asyncio
import hashlib
import hmac
import json
import logging

import httpx
import pytest
from fastapi.testclient import TestClient

from backend.app.config import settings
from backend.app.main import app
from backend.app.services import bob_analyzer
from backend.app.services.security_ops import rate_limiter, redact, RedactingFilter

client = TestClient(app)
U1 = {"X-User-Id": "1"}
U2 = {"X-User-Id": "2"}

SCAM = "CBI officer here. Your Aadhaar is linked to money laundering. Pay Rs 50000 now via UPI or you will be arrested. Do not tell family."


@pytest.fixture
def bob_env(monkeypatch):
    monkeypatch.setattr(settings, "bob_api_key", "test-key-not-real")
    monkeypatch.setattr(settings, "bob_api_endpoint", "https://bob.example.invalid/v1/chat/completions")
    monkeypatch.setattr(settings, "bob_model_id", "test-model")
    monkeypatch.setattr(settings, "bob_max_retries", 2)
    yield


def _mock_client(monkeypatch, handler):
    real = httpx.AsyncClient
    calls = {"n": 0}

    def counting(request):
        calls["n"] += 1
        return handler(request)

    monkeypatch.setattr(bob_analyzer.httpx, "AsyncClient",
                        lambda *a, **k: real(transport=httpx.MockTransport(counting)))
    real_sleep = asyncio.sleep
    monkeypatch.setattr(bob_analyzer.asyncio, "sleep", lambda *_: real_sleep(0))
    return calls


# ── Admin / roles ────────────────────────────────────────────────────────────

def test_admin_only_routes_reject_non_admin():
    assert client.put("/api/settings/system", json={}, headers=U2).status_code == 403
    assert client.post("/api/integrations/bob/verify", headers=U2).status_code == 403
    assert client.get("/api/admin/users", headers=U2).status_code == 403
    assert client.get("/api/admin/audit-events", headers=U2).status_code == 403


def test_invalid_provider_rejected():
    assert client.put("/api/settings/system", json={"analysis_provider": "nope"}, headers=U1).status_code == 400


def test_admin_creates_operator_who_can_login_and_be_deactivated():
    phone = "+91 90000 11122"
    r = client.post("/api/admin/users", headers=U1, json={
        "full_name": "Ops Person", "phone_number": phone, "passcode": "op-pass-123", "access_role": "OPERATOR"})
    assert r.status_code in (201, 409)
    users = client.get("/api/admin/users", headers=U1).json()
    op = next(u for u in users if u["full_name"] == "Ops Person")
    assert op["access_role"] == "OPERATOR" and "90000" not in op["phone_masked"]

    tok = client.post("/api/auth/login", json={"identifier": phone, "passcode": "op-pass-123"}).json()["access_token"]
    auth = {"Authorization": "Bearer " + tok}
    assert client.get("/api/admin/audit-events", headers=auth).status_code == 200
    assert client.get("/api/admin/users", headers=auth).status_code == 403

    assert client.patch(f"/api/admin/users/{op['id']}", headers=U1, json={"is_active": False}).status_code == 200
    assert client.get("/api/admin/audit-events", headers=auth).status_code == 401
    client.patch(f"/api/admin/users/{op['id']}", headers=U1, json={"is_active": True})


def test_admin_cannot_demote_or_deactivate_self():
    assert client.patch("/api/admin/users/1", headers=U1, json={"access_role": "USER"}).status_code == 400
    assert client.patch("/api/admin/users/1", headers=U1, json={"is_active": False}).status_code == 400


def test_retention_purge_admin_only():
    assert client.post("/api/admin/retention/purge", headers=U2).status_code == 403
    r = client.post("/api/admin/retention/purge", headers=U1)
    assert r.status_code == 200 and "redacted_analyses" in r.json()


# ── Rate limiting & redaction ────────────────────────────────────────────────

def test_login_rate_limited(monkeypatch):
    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(settings, "rate_limit_login_per_minute", 3)
    rate_limiter.reset()
    codes = [client.post("/api/auth/login", json={"identifier": "x@y.z", "passcode": "bad"}).status_code for _ in range(5)]
    rate_limiter.reset()
    assert codes[:3] == [401, 401, 401] and codes[3] == 429


def test_redaction_removes_secrets():
    jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abc123def456"
    out = redact(f"Authorization: Bearer abc.def.ghi apikey=SECRET123 token {jwt} otp is 482913")
    assert "SECRET123" not in out and "abc.def.ghi" not in out and jwt not in out and "482913" not in out

    rec = logging.LogRecord("t", logging.INFO, __file__, 1, "key %s", ("api_key=XYZ987",), None)
    RedactingFilter().filter(rec)
    assert "XYZ987" not in rec.getMessage()


# ── IBM Bob adapter ──────────────────────────────────────────────────────────

def test_bob_not_configured_falls_back_to_local(monkeypatch):
    monkeypatch.setattr(settings, "bob_api_key", "")
    res = asyncio.run(bob_analyzer.BobScamAnalyzer().analyze_text(SCAM))
    assert res.ai_provider == "none" and "not configured" in res.limitations[0].lower()


def test_bob_auth_failure_is_not_retried(bob_env, monkeypatch):
    calls = _mock_client(monkeypatch, lambda req: httpx.Response(401, json={"error": "no"}))
    text, status_cat, _ = asyncio.run(bob_analyzer.call_bob("hi"))
    assert text is None and status_cat == "AUTHENTICATION_FAILED" and calls["n"] == 1


def test_bob_rate_limit_retries_then_reports(bob_env, monkeypatch):
    calls = _mock_client(monkeypatch, lambda req: httpx.Response(429))
    _, status_cat, _ = asyncio.run(bob_analyzer.call_bob("hi"))
    assert status_cat == "RATE_LIMITED" and calls["n"] == 3


def test_bob_low_ai_score_cannot_lower_local_floor(bob_env, monkeypatch):
    ai_json = {"verdict": "Looks fine", "risk_score": 5, "risk_level": "LOW", "confidence": "HIGH",
               "summary": "Benign.", "detected_signals": [], "recommended_actions": [], "should_alert_family": False}

    def handler(req):
        assert req.headers["Authorization"].startswith("Bearer ")
        body = json.loads(req.content)
        assert body["messages"][0]["role"] == "system" and "UNTRUSTED" in body["messages"][0]["content"]
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps(ai_json)}}]})

    _mock_client(monkeypatch, handler)
    res = asyncio.run(bob_analyzer.BobScamAnalyzer().analyze_text(SCAM))
    assert res.ai_provider == "ibm_bob"
    assert res.risk_score >= 60 and res.should_alert_family
    assert any("safety floor" in l.lower() for l in res.limitations)


def test_bob_verify_invalid_response(bob_env, monkeypatch):
    _mock_client(monkeypatch, lambda req: httpx.Response(200, json={"unexpected": True}))
    r = client.post("/api/integrations/bob/verify", headers=U1)
    assert r.status_code == 200 and r.json()["status"] == "INVALID_RESPONSE"
    assert "test-key-not-real" not in r.text


# ── WhatsApp webhook ─────────────────────────────────────────────────────────

def test_whatsapp_blocked_when_unconfigured(monkeypatch):
    monkeypatch.setattr(settings, "whatsapp_verify_token", "")
    assert client.post("/api/whatsapp/webhook", content=b"{}").status_code == 503


def test_whatsapp_signature_and_dedup(monkeypatch):
    monkeypatch.setattr(settings, "whatsapp_verify_token", "vt-123")
    monkeypatch.setattr(settings, "whatsapp_app_secret", "app-secret")
    monkeypatch.setattr(settings, "whatsapp_access_token", "")
    assert client.get("/api/whatsapp/webhook", params={"hub.mode": "subscribe", "hub.verify_token": "vt-123",
                                                        "hub.challenge": "42"}).text == "42"
    assert client.get("/api/whatsapp/webhook", params={"hub.mode": "subscribe", "hub.verify_token": "bad",
                                                        "hub.challenge": "42"}).status_code == 403

    body = json.dumps({"entry": [{"changes": [{"value": {"messages": [
        {"id": "wamid.TEST1", "from": "919800000000", "type": "text", "text": {"body": SCAM}}]}}]}]}).encode()
    assert client.post("/api/whatsapp/webhook", content=body,
                       headers={"X-Hub-Signature-256": "sha256=deadbeef"}).status_code == 401
    sig = "sha256=" + hmac.new(b"app-secret", body, hashlib.sha256).hexdigest()
    first = client.post("/api/whatsapp/webhook", content=body, headers={"X-Hub-Signature-256": sig}).json()
    second = client.post("/api/whatsapp/webhook", content=body, headers={"X-Hub-Signature-256": sig}).json()
    assert first["queued"] == 1 and second["queued"] == 0


def test_whatsapp_simulate_reply():
    r = client.post("/api/whatsapp/simulate", headers=U1, json={"text": SCAM})
    assert r.status_code == 200 and r.json()["simulated"] and "1930" in r.json()["reply"]
