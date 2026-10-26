"""
Phase 6 — safety feature tests:
transaction risk intelligence, false-positive scenario evaluation, adaptive multilingual check-in
(anti-coaching), two-sided Family Shield consent + two-contact cap, guardian approvals,
duress phrase discretion, SDK / mock UPI boundary, PDF complaint pack and honest IBM status.
"""

import json
import re
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.evaluation.payment_scenarios import evaluate_payment_scenarios
from backend.app.main import app
from backend.app.models import (
    AuditEvent, FamilyAlert, GuardianApprovalRequest, SafetyPreference, TransactionRecord, TrustedContact,
)
from backend.app.services import safety_checkin as checkin
from backend.app.services.duress import contains_phrase, hash_phrase, validate_phrase
from backend.app.services.transaction_risk import (
    CALL_STATE_DEMO, CALL_STATE_USER, HistoryItem, PaymentContext, assess_payment,
)

client = TestClient(app)
U1 = {"X-User-Id": "1"}
U2 = {"X-User-Id": "2"}
NOW = datetime(2026, 3, 1, 12, 0, tzinfo=timezone.utc)
HISTORY = [HistoryItem("kirana.store@icici", a, NOW - timedelta(days=d)) for a, d in
           [(600, 2), (700, 5), (650, 9), (800, 12), (900, 20), (750, 30)]]


def _simulate(headers=U1, **overrides):
    payload = {"vpa_or_account": "kirana.store@icici", "requested_amount": 500.0, "is_new_recipient": False}
    payload.update(overrides)
    res = client.post("/api/payment/simulate", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    return res.json()


def _run_checkin(sim_id, answer_map, language="en", headers=U1):
    """Answers questions in server order using answer_map[qid] (default 'no' / first option / '')."""
    answers, last = [], None
    for _ in range(12):
        res = client.post(f"/api/payment/simulations/{sim_id}/checkin",
                          json={"language": language, "answers": answers}, headers=headers)
        assert res.status_code == 200, res.text
        last = res.json()
        if last["status"] == "COMPLETED":
            return last, answers
        q = last["next_question"]
        default = "" if q["kind"] == "free_text" else ("no" if any(o["value"] == "no" for o in q["options"]) else q["options"][0]["value"])
        answers.append({"question_id": q["id"], "value": answer_map.get(q["id"], default)})
    raise AssertionError("check-in did not finish")


# ---------------------------------------------------------------- transaction risk

def test_every_signal_is_explained_with_a_source():
    result = assess_payment(PaymentContext("cbi.desk@ybl", 50000, authority_claimed=True, call_state=CALL_STATE_DEMO), HISTORY, NOW)
    assert result.policy_tier == "RED"
    for s in result.signals:
        assert s.explanation and s.source and s.label
    sources = {s.code: s.source for s in result.signals}
    assert sources["ACTIVE_CALL"] == "DEMO_SIMULATED_DEVICE_SIGNAL"
    assert "not real device detection" in next(s.explanation for s in result.signals if s.code == "ACTIVE_CALL")


def test_history_driven_new_payee_deviation_and_velocity():
    r = assess_payment(PaymentContext("new.payee@ybl", 20000), HISTORY, NOW)
    codes = {s.code for s in r.signals if s.points}
    assert {"NEW_PAYEE", "AMOUNT_DEVIATION"} <= codes
    assert r.history_summary["p90_amount"] > 0

    recent = HISTORY + [HistoryItem("a@ybl", 3000, NOW - timedelta(minutes=5)), HistoryItem("b@ybl", 3000, NOW - timedelta(minutes=12))]
    v = assess_payment(PaymentContext("c@ybl", 500), recent, NOW)
    assert any(s.code == "RAPID_VELOCITY" for s in v.signals)


def test_known_payee_small_payment_is_not_interrupted():
    r = assess_payment(PaymentContext("kirana.store@icici", 700, self_reported_new_recipient=True), HISTORY, NOW)
    assert r.policy_tier == "GREEN"
    call = assess_payment(PaymentContext("kirana.store@icici", 700, call_state=CALL_STATE_USER), HISTORY, NOW)
    assert call.policy_tier == "GREEN"


def test_amount_alone_never_produces_a_scam_label():
    r = assess_payment(PaymentContext("hospital.new@icici", 90000), HISTORY, NOW)
    assert r.risk_score >= 70
    assert r.policy_tier == "AMBER"
    assert r.guardian_approval_recommended is True


def test_false_positive_scenario_thresholds():
    report = evaluate_payment_scenarios()
    assert report["routine_benign_interruption_rate"] <= 0.10
    assert report["benign_red_rate"] == 0.0
    assert report["scam_not_green_rate"] >= 0.9
    assert report["coercion_scam_red_rate"] == 1.0


def test_simulate_api_returns_explained_signals_and_call_state():
    data = _simulate(vpa_or_account="cbi.verify@ybl", requested_amount=30000, authority_claimed=True,
                     call_state="DEMO_SIMULATED_ACTIVE_CALL")
    assert data["policy_tier"] == "RED"
    assert data["call_state"] == "DEMO_SIMULATED_ACTIVE_CALL"
    assert all({"code", "label", "points", "explanation", "source"} <= set(s) for s in data["risk_signals"])
    bad = client.post("/api/payment/simulate", json={"vpa_or_account": "x@ybl", "requested_amount": 10, "call_state": "AUTO_DETECTED"}, headers=U1)
    assert bad.status_code == 422


# ---------------------------------------------------------------- check-in

def test_checkin_short_path_for_benign_payment():
    sim = _simulate()
    result, answers = _run_checkin(sim["simulation_id"], {"Q_WHO": "business"})
    assert [a["question_id"] for a in answers] == ["Q_CALL", "Q_WHO", "Q_OWN_WORDS"]
    assert result["result"]["final_tier"] == "GREEN"
    assert result["result"]["recommended_action"] == "PROCEED_WITH_CARE"
    assert result["engine"] == "RULE_BASED_GUIDED_CHECKIN"


def test_checkin_reassuring_answers_cannot_clear_high_risk_payment():
    sim = _simulate(vpa_or_account="police.fine@ybl", requested_amount=9000, authority_claimed=True, secrecy_demanded=True)
    assert sim["policy_tier"] == "RED"
    result, answers = _run_checkin(sim["simulation_id"], {"Q_WHO": "authority", "Q_VERIFIED": "yes"})
    assert len(answers) >= 6  # adaptive: more questions when objective risk is high
    r = result["result"]
    assert r["final_tier"] == "RED"
    assert r["recommended_action"] == "DO_NOT_PAY"


def test_checkin_coached_answers_on_red_payment_stay_red_and_are_flagged():
    sim = _simulate(vpa_or_account="cbi.cell@ybl", requested_amount=40000, authority_claimed=True, secrecy_demanded=True,
                    call_state="DEMO_SIMULATED_ACTIVE_CALL")
    result, _ = _run_checkin(sim["simulation_id"], {"Q_CALL": "no", "Q_WHO": "self", "Q_VERIFIED": "yes"})
    r = result["result"]
    codes = {x["code"] for x in r["reasons"]}
    assert r["final_tier"] == "RED"
    assert r["answers_could_not_clear"] is True
    assert "ANSWERS_CONTRADICT_SIGNALS" in codes
    assert "PAYMENT_DETAILS_HIGH_RISK" in codes


def test_checkin_contradiction_raises_green_payment():
    sim = _simulate(call_state="DEMO_SIMULATED_ACTIVE_CALL")
    result, _ = _run_checkin(sim["simulation_id"], {"Q_CALL": "no", "Q_WHO": "business"})
    assert result["result"]["final_tier"] == "AMBER"


def test_checkin_rejects_out_of_order_or_invalid_answers():
    sim = _simulate()
    sid = sim["simulation_id"]
    skip = client.post(f"/api/payment/simulations/{sid}/checkin", json={"answers": [{"question_id": "Q_OWN_WORDS", "value": ""}]}, headers=U1)
    assert skip.status_code == 422
    bad = client.post(f"/api/payment/simulations/{sid}/checkin", json={"answers": [{"question_id": "Q_CALL", "value": "maybe"}]}, headers=U1)
    assert bad.status_code == 422
    other = client.post(f"/api/payment/simulations/{sid}/checkin", json={"answers": []}, headers=U2)
    assert other.status_code == 403


@pytest.mark.parametrize("lang,script", [("hi", r"[\u0900-\u097F]"), ("mr", r"[\u0900-\u097F]"), ("kn", r"[\u0C80-\u0CFF]")])
def test_checkin_languages(lang, script):
    sim = _simulate()
    res = client.post(f"/api/payment/simulations/{sim['simulation_id']}/checkin", json={"language": lang, "answers": []}, headers=U1)
    q = res.json()["next_question"]
    assert res.json()["language"] == lang
    assert re.search(script, q["prompt"])
    assert all(re.search(script, o["label"]) for o in q["options"])


def test_all_checkin_strings_exist_in_all_languages():
    for q in checkin.QUESTIONS.values():
        assert set(q["prompt"]) == set(checkin.SUPPORTED_LANGUAGES)
        for _, labels in q["options"]:
            assert set(labels) == set(checkin.SUPPORTED_LANGUAGES)
    for table in (checkin.REASON_LABELS, checkin.ACTION_MESSAGES):
        for labels in table.values():
            assert set(labels) == set(checkin.SUPPORTED_LANGUAGES)
            assert all(v.strip() for v in labels.values())


# ---------------------------------------------------------------- Family Shield consent & cap

def test_two_contact_cap_is_enforced_by_backend():
    assert len(client.get("/api/contacts", headers=U1).json()) == 2
    res = client.post("/api/contacts", json={"name": "Third", "relationship": "Friend", "phone_number": "+91 90000 00001"}, headers=U1)
    assert res.status_code == 409


def test_cannot_add_self_as_contact():
    _clear(2)
    res = client.post("/api/contacts", json={"name": "Me", "relationship": "Self", "phone_number": "+91 98101 23456"}, headers=U2)
    assert res.status_code == 400


def _clear(user_id):
    db = SessionLocal()
    try:
        for c in db.query(TrustedContact).filter(TrustedContact.user_id == user_id).all():
            db.delete(c)
        db.commit()
    finally:
        db.close()


def test_in_app_invitation_acceptance_and_identity_change_resets_consent():
    _clear(2)
    # User 2 (Aarav) invites Rajesh (user 1) by phone number.
    c = client.post("/api/contacts", json={"name": "Rajesh", "relationship": "Father", "phone_number": "+91 98765 43210", "consent_granted": True}, headers=U2).json()
    assert c["contact_consent_status"] == "PENDING"

    invitations = client.get("/api/contacts/invitations", headers=U1).json()
    assert any(i["contact_id"] == c["id"] for i in invitations)

    # The owner cannot accept on the contact's behalf.
    assert client.post(f"/api/contacts/invitations/{c['id']}/respond", json={"decision": "ACCEPT"}, headers=U2).status_code == 403

    ok = client.post(f"/api/contacts/invitations/{c['id']}/respond", json={"decision": "ACCEPT"}, headers=U1)
    assert ok.status_code == 200 and ok.json()["contact_consent_status"] == "ACCEPTED"

    changed = client.put(f"/api/contacts/{c['id']}", json={"phone_number": "+91 91111 22222"}, headers=U2).json()
    assert changed["contact_consent_status"] == "PENDING"
    _clear(2)


def test_invite_codes_are_single_use_and_hashed():
    _clear(2)
    c = client.post("/api/contacts", json={"name": "Neighbour", "relationship": "Friend", "phone_number": "+91 93333 44444"}, headers=U2).json()
    code = client.post(f"/api/contacts/{c['id']}/invite", headers=U2).json()["demo_invite_code"]
    db = SessionLocal()
    try:
        stored = db.query(TrustedContact).filter(TrustedContact.id == c["id"]).first()
        assert stored.invite_code_hash and code not in stored.invite_code_hash
    finally:
        db.close()
    assert client.post("/api/contacts/invitations/respond-with-code", json={"invite_code": code, "decision": "DECLINE"}).status_code == 200
    assert client.post("/api/contacts/invitations/respond-with-code", json={"invite_code": code, "decision": "ACCEPT"}).status_code == 404
    _clear(2)


# ---------------------------------------------------------------- guardian approval & SDK

def test_guardian_approval_workflow_and_authorization():
    sim = _simulate(vpa_or_account="unknown.trader@ybl", requested_amount=30000, pressure_present=True)
    sid = sim["simulation_id"]
    created = client.post(f"/api/payment/simulations/{sid}/guardian-approval", headers=U1)
    assert created.status_code == 201
    ref = created.json()["request_ref"]
    assert created.json()["status"] == "PENDING"

    # SDK blocks completion while pending.
    assert client.get(f"/api/sdk/v1/transactions/{sid}/decision", headers=U1).json()["decision"] == "GUARDIAN_APPROVAL_REQUIRED"
    assert client.post(f"/api/sdk/v1/transactions/{sid}/complete", headers=U1).status_code == 409

    # Requester cannot approve their own request.
    assert client.post(f"/api/guardian/approvals/{ref}/decision", json={"decision": "APPROVE"}, headers=U1).status_code == 403

    # Aarav (user 2) is an accepted, consented guardian of user 1.
    guardian_view = client.get("/api/guardian/approvals", headers=U2).json()
    mine = next(r for r in guardian_view if r["request_ref"] == ref)
    assert mine["viewer_role"] == "GUARDIAN" and mine["reason_codes"]

    approved = client.post(f"/api/guardian/approvals/{ref}/decision", json={"decision": "APPROVE", "note": "Called him"}, headers=U2)
    assert approved.status_code == 200 and approved.json()["status"] == "APPROVED"
    assert client.post(f"/api/guardian/approvals/{ref}/decision", json={"decision": "DECLINE"}, headers=U2).status_code == 409

    decision = client.get(f"/api/sdk/v1/transactions/{sid}/decision", headers=U1).json()
    assert decision["decision"] == "ALLOW" and decision["can_complete"] is True


def test_guardian_approval_expires():
    sim = _simulate(vpa_or_account="another.trader@ybl", requested_amount=26000, pressure_present=True)
    ref = client.post(f"/api/payment/simulations/{sim['simulation_id']}/guardian-approval", headers=U1).json()["request_ref"]
    db = SessionLocal()
    try:
        req = db.query(GuardianApprovalRequest).filter(GuardianApprovalRequest.request_ref == ref).first()
        req.expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        db.commit()
    finally:
        db.close()
    res = client.post(f"/api/guardian/approvals/{ref}/decision", json={"decision": "APPROVE"}, headers=U2)
    assert res.status_code == 409


def test_sdk_mock_payment_flow_records_history_and_blocks_red():
    _clear(2)
    green = client.post("/api/sdk/v1/pre-transaction-check", json={"payee_vpa": "corner.shop@ybl", "amount": 120}, headers=U2).json()
    assert green["decision"] == "ALLOW"
    assert "not integrated with PhonePe" in green["integration_notice"]
    done = client.post(f"/api/sdk/v1/transactions/{green['simulation_id']}/complete", headers=U2)
    assert done.status_code == 200 and done.json()["is_mock"] is True
    assert client.post(f"/api/sdk/v1/transactions/{green['simulation_id']}/complete", headers=U2).status_code == 409
    assert any(e["simulation_id"] == green["simulation_id"] for e in client.get("/api/sdk/v1/ledger", headers=U2).json())

    risky = client.post("/api/sdk/v1/pre-transaction-check", json={
        "payee_vpa": "cbi.bail.desk@ybl", "amount": 45000, "note": "bail for arrest warrant",
        "call_state": "DEMO_SIMULATED_ACTIVE_CALL"}, headers=U2).json()
    assert risky["decision"] == "CHECKIN_REQUIRED" and risky["can_complete"] is False
    _run_checkin(risky["simulation_id"], {"Q_CALL": "yes", "Q_WHO": "authority"}, headers=U2)
    after = client.get(f"/api/sdk/v1/transactions/{risky['simulation_id']}/decision", headers=U2).json()
    assert after["decision"] == "BLOCK_RECOMMENDED"
    assert client.post(f"/api/sdk/v1/transactions/{risky['simulation_id']}/complete", headers=U2).status_code == 409


# ---------------------------------------------------------------- duress phrase

def test_duress_phrase_hashing_and_matching():
    assert validate_phrase("blue") is not None
    digest, wc = hash_phrase("Blue umbrella, Tuesday!")
    assert "umbrella" not in digest and wc == 3
    assert contains_phrase("it is for my blue umbrella tuesday gift", digest, wc)
    assert not contains_phrase("it is for my blue umbrella gift", digest, wc)
    hindi, hwc = hash_phrase("नीला छाता मंगलवार")
    assert contains_phrase("यह नीला छाता मंगलवार के लिए है", hindi, hwc)


def test_duress_phrase_triggers_discreet_guardian_escalation():
    phrase = "marigold teacup evening"
    put = client.put("/api/safety/duress", json={"phrase": phrase, "consent_acknowledged": True}, headers=U1)
    assert put.status_code == 200 and put.json()["enabled"] is True
    assert phrase not in put.text
    assert client.put("/api/safety/duress", json={"phrase": "another phrase here", "consent_acknowledged": False}, headers=U1).status_code == 400

    try:
        sim = _simulate(vpa_or_account="kirana.store@icici", requested_amount=700)
        result, _ = _run_checkin(sim["simulation_id"], {"Q_WHO": "business", "Q_OWN_WORDS": f"Groceries and a {phrase} treat"})
        body = json.dumps(result).lower()
        assert result["result"]["recommended_action"] == "WAIT_FOR_GUARDIAN"
        assert "duress" not in body and phrase not in body

        # Owner cannot see the discreet alert; the guardian can, without the phrase.
        owner_alerts = client.get("/api/alerts", headers=U1).json()
        assert not any("safety check" in a["threat_title"].lower() for a in owner_alerts)
        guardian_alerts = client.get("/api/alerts", headers=U2).json()
        discreet = [a for a in guardian_alerts if "safety check" in a["threat_title"].lower()]
        assert discreet and all(phrase not in json.dumps(a).lower() and "duress" not in json.dumps(a).lower() for a in discreet)

        approvals = client.get("/api/guardian/approvals", headers=U2).json()
        req = next(r for r in approvals if r["simulation_id"] == sim["simulation_id"])
        assert req["guardian_guidance"] and "duress" not in json.dumps(req).lower()
        owner_view = client.get(f"/api/payment/simulations/{sim['simulation_id']}/guardian-approval", headers=U1).json()
        assert owner_view["guardian_guidance"] is None and owner_view["reason_codes"] == []

        db = SessionLocal()
        try:
            pref = db.query(SafetyPreference).filter(SafetyPreference.user_id == 1).first()
            assert phrase not in (pref.duress_phrase_hash or "")
            for e in db.query(AuditEvent).all():
                assert phrase not in (e.description or "").lower() and phrase not in (e.metadata_json or "").lower()
        finally:
            db.close()
    finally:
        off = client.delete("/api/safety/duress", headers=U1)
        assert off.json()["enabled"] is False


# ---------------------------------------------------------------- PDF pack & IBM truth

def test_golden_hour_pdf_pack_export():
    wizard = client.post("/api/recovery/wizard", json={
        "scam_type": "Digital Arrest", "description": "Caller posing as CBI demanded bail on a video call.",
        "financial_loss": 20000, "bank_name": "SBI", "timeline_events": ["10:02 call received", "10:20 paid"],
    }, headers=U1)
    draft_id = wizard.json()["id"]
    pdf = client.get(f"/api/recovery/drafts/{draft_id}/export?format=pdf", headers=U1)
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content.startswith(b"%PDF") and len(pdf.content) > 2000
    assert client.get(f"/api/recovery/drafts/{draft_id}/export?format=pdf", headers=U2).status_code == 404


def test_missing_information_checklist_does_not_invent_values():
    from backend.app.services.pdf_pack import build_missing_checklist
    items = dict((name, ok) for name, ok, _ in build_missing_checklist({"amount": 100, "description": "x"}))
    assert items["Transaction reference / UTR"] is False
    assert items["Amount lost or at risk"] is True


def test_ibm_status_is_honest(monkeypatch):
    status = client.get("/api/integrations/status").json()
    by_id = {i["id"]: i for i in status["integrations"]}
    for key in ("ibm_watsonx_orchestrate", "ibm_granite_guardian", "ibm_safer_payments"):
        assert by_id[key]["status"] == "NOT_INTEGRATED"
    monkeypatch.setattr(settings, "watsonx_apikey", "bob-demo-key")
    monkeypatch.setattr(settings, "watsonx_project_id", "")
    assert client.get("/api/settings").json()["watsonx_configured"] is False
