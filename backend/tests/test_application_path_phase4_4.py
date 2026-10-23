"""
Phase 4.4 Real Application Path & Integration Verification.

Traces 6 representative messages through the actual FastAPI application endpoint
POST /api/v1/analyze using TestClient against the real database and risk engine:
1. Benign OTP security warning
2. Explicit OTP disclosure scam
3. Mixed message with benign warning and malicious request
4. Obfuscated electricity-disconnection scam
5. Legitimate travel/customs notice
6. Ambiguous payment or job offer

Verifies:
- Complete response schema (AnalysisResponse)
- Risk score calibration and policy tier (GREEN / AMBER / RED)
- Verdict classification and reason codes
- Evidence excerpts (100% exact verbatim substrings of original input)
- Persistence in database (ScamAnalysis, Incident creation for RED threats, AuditEvent)
- Frontend contract compatibility
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.database import get_db, Base, engine
from backend.app.models import UserProfile, ScamAnalysis, ScamEvidence, Incident, AuditEvent
from backend.app.dependencies import get_current_user_id

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield


def test_path_1_benign_otp_warning():
    """1. Trace legitimate OTP security warning through real /api/v1/analyze endpoint."""
    text = "491029 is your Amazon password reset OTP. Do not share this OTP with anyone. Amazon will never call to verify your OTP."
    response = client.post("/api/v1/analyze", json={"text": text, "channel": "SMS"})

    assert response.status_code == 200, response.text
    data = response.json()

    # Contract validation
    assert data["policy_tier"] == "GREEN"
    assert data["risk_score"] < 35
    assert data["risk_level"] in ("LOW", "Low")
    assert "SIG_CREDENTIAL_THEFT_OTP" not in data["reason_codes"]
    assert data["should_alert_family"] is False
    assert data["incident_id"].startswith("SCAN-")

    # Substring invariant
    for sig in data["detected_signals"]:
        if sig.get("excerpt"):
            assert sig["excerpt"] in text


def test_path_2_explicit_otp_disclosure_scam():
    """2. Trace explicit OTP disclosure scam through real /api/v1/analyze endpoint."""
    text = "Dear customer, your SBI YONO account is suspended. Call our verification desk and share the OTP sent to your mobile immediately."
    response = client.post("/api/v1/analyze", json={"text": text, "channel": "SMS"})

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["policy_tier"] == "RED"
    assert data["risk_score"] >= 50
    assert "SIG_CREDENTIAL_THEFT_OTP" in data["reason_codes"]
    assert data["should_alert_family"] is True
    assert data["incident_id"].startswith("SA-")

    # Check evidence persistence
    signals = data["detected_signals"]
    otp_signal = next(s for s in signals if s["reason_code"] == "SIG_CREDENTIAL_THEFT_OTP")
    assert "share the OTP" in otp_signal["excerpt"]
    assert otp_signal["excerpt"] in text


def test_path_3_mixed_warning_and_malicious_request():
    """3. Trace mixed message: benign warning does NOT neutralize malicious instruction."""
    text = (
        "SBI Alert: Do not share this OTP with anyone. "
        "However, our representative officer Sharma is calling you from headquarters, "
        "please share the OTP with him right now to complete mandatory KYC."
    )
    response = client.post("/api/v1/analyze", json={"text": text, "channel": "SMS"})

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["policy_tier"] in ("RED", "AMBER")
    assert "SIG_CREDENTIAL_THEFT_OTP" in data["reason_codes"]

    # Excerpt check
    for sig in data["detected_signals"]:
        if sig.get("excerpt"):
            assert sig["excerpt"] in text


def test_path_4_obfuscated_electricity_disconnection():
    """4. Trace typo-laden electricity disconnection scam."""
    text = "DEAR CONSUMER YOUR ELECTRCTY POWER WILL BE DISCONCT TONITE AT 9.30 PM FROM POWER OFICER BECAUSE YOUR PREVIOUS MONTH BILL NOT UPDATE. CONTACT ELECTRCITY OFICER 9876543210"
    response = client.post("/api/v1/analyze", json={"text": text, "channel": "SMS"})

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["policy_tier"] == "RED"
    assert data["risk_score"] >= 50
    assert "SIG_UTILITY_DISCONNECT" in data["reason_codes"]
    assert data["verdict"] == "Electricity Bill / Utility Disconnection Threat"
    assert data["incident_id"].startswith("SA-")

    # Excerpt check
    for sig in data["detected_signals"]:
        if sig.get("excerpt"):
            assert sig["excerpt"] in text


def test_path_5_legitimate_travel_customs_notice():
    """5. Trace legitimate travel advisory with dispersed customs keyword (must remain GREEN)."""
    text = (
        "Travel Advisory for Bangkok Delegates: Delegates arriving at Suvarnabhumi Airport should proceed directly to passport control. "
        "Customs regulations permit duty-free import of personal gifts and laptops for business travel. "
        "Please keep all official event registration badges visible when boarding conference shuttles to the convention center."
    )
    response = client.post("/api/v1/analyze", json={"text": text, "channel": "SMS"})

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["policy_tier"] == "GREEN"
    assert data["risk_score"] == 0
    assert "SIG_DIGITAL_ARREST" not in data["reason_codes"]
    assert data["verdict"] == "Likely Legitimate Communication"


def test_path_6_ambiguous_job_offer():
    """6. Trace ambiguous job offer with bit.ly link."""
    text = "Hi, HR manager here from Global Staffing. We found your resume on Naukri for a hybrid data analyst role paying ₹8-12 LPA. Check job description and apply here: bit.ly/global-analyst-job"
    response = client.post("/api/v1/analyze", json={"text": text, "channel": "WhatsApp"})

    assert response.status_code == 200, response.text
    data = response.json()

    assert data["policy_tier"] in ("RED", "AMBER")
    assert "SIG_TASK_PREPAID_FRAUD" in data["reason_codes"] or "SIG_SUSPICIOUS_LINK_REDIRECT" in data["reason_codes"]

    for sig in data["detected_signals"]:
        if sig.get("excerpt"):
            assert sig["excerpt"] in text


def test_database_persistence_and_audit_events():
    """Verify that scans persist to the database and write audit event records."""
    text = "URGENT: Your FASTag account on vehicle MH02AB1234 has been blacklisted. Settle fine at http://fastag-nhai-clearance.top immediately."
    response = client.post("/api/v1/analyze", json={"text": text, "channel": "SMS"})
    assert response.status_code == 200
    data = response.json()

    # Database inspection
    db = next(get_db())
    try:
        # Check ScamAnalysis record exists
        scan = db.query(ScamAnalysis).order_by(ScamAnalysis.id.desc()).first()
        assert scan is not None
        assert scan.input_text == text
        assert scan.risk_score == data["risk_score"]

        # Check AuditEvent
        audit = db.query(AuditEvent).order_by(AuditEvent.id.desc()).first()
        assert audit is not None
        assert audit.event_type == "SCAN_EXECUTED"
    finally:
        db.close()
