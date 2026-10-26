import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models import Incident, FamilyAlert, TrustedContact, PaymentSimulation, RecoveryDraft

client = TestClient(app)

def test_high_risk_incident_triggers_family_alert():
    """Test: High-risk incident triggers the configured family alert automatically."""
    # Ensure User 1 has a primary verified contact with consent
    headers = {"X-User-Id": "1"}
    incident_payload = {
        "title": "Suspected Digital Arrest Call from Cyber Police",
        "scam_type": "Digital Arrest / Impersonation",
        "description": "Caller claimed to be DCP Cyber Crime and demanded ₹50,000 to drop drug trafficking charge.",
        "financial_loss": 50000.0,
        "currency": "INR",
        "bank_name": "State Bank of India",
        "transaction_ref": "UPI/202610/987123",
        "suspect_contact": "+91 98201 98201",
        "severity": "HIGH_RISK",
        "risk_level": "CRITICAL"
    }
    response = client.post("/api/incidents", json=incident_payload, headers=headers)
    assert response.status_code == 201
    inc_data = response.json()
    assert inc_data["incident_id"].startswith("SA-")
    assert inc_data["risk_level"] == "CRITICAL"

    # Verify that a FamilyAlert was automatically created for this incident
    alerts_resp = client.get("/api/alerts", headers=headers)
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()
    matching_alerts = [a for a in alerts if a["incident_id"] == inc_data["incident_id"]]
    assert len(matching_alerts) >= 1
    assert matching_alerts[0]["risk_level"] == "CRITICAL"
    assert "Digital Arrest" in matching_alerts[0]["threat_title"]


def test_duplicate_alerts_handled_safely():
    """Test: Duplicate alerts are handled safely and deduplicated without crashing."""
    headers = {"X-User-Id": "1"}
    # Fetch active contacts
    contacts_resp = client.get("/api/contacts", headers=headers)
    contacts = contacts_resp.json()
    assert len(contacts) > 0
    c_id = contacts[0]["id"]

    alert_payload = {
        "contact_ids": [c_id],
        "threat_title": "Urgent Threat Alert",
        "message_content": "Suspicious SMS detected.",
        "incident_id": "SA-TEST-DEDUP-001",
        "risk_level": "HIGH",
        "delivery_channel": "IN_APP_SIMULATION"
    }

    # First dispatch
    resp1 = client.post("/api/alerts/dispatch", json=alert_payload, headers=headers)
    assert resp1.status_code == 201
    alerts1 = resp1.json()
    assert len(alerts1) == 1
    first_alert_id = alerts1[0]["id"]

    # Immediate second dispatch with same incident_id and contact_id
    resp2 = client.post("/api/alerts/dispatch", json=alert_payload, headers=headers)
    assert resp2.status_code == 201
    alerts2 = resp2.json()
    # Deduplicated: returns existing alert record instead of creating duplicates
    assert len(alerts2) == 1
    assert alerts2[0]["id"] == first_alert_id


def test_missing_utr_is_allowed():
    """Test: Missing UTR is allowed in Golden Hour recovery wizard and incident creation."""
    headers = {"X-User-Id": "1"}
    wizard_payload = {
        "scam_type": "Electricity Bill Threat",
        "description": "Received threatening SMS and transferred money via link; did not get UTR reference.",
        "communication_channel": "SMS",
        "financial_loss": 8500.0,
        "transaction_ref": None,  # Explicitly omitted / null UTR
        "bank_name": "State Bank of India",
        "transfer_status": "COMPLETED",
        "timeline_events": ["10:00 AM received SMS", "10:15 AM clicked link"],
        "evidence_attachments": []
    }

    response = client.post("/api/recovery/wizard", json=wizard_payload, headers=headers)
    assert response.status_code == 201
    draft_data = response.json()
    assert draft_data["financial_loss"] == 8500.0
    assert draft_data["transaction_reference"] is None
    assert draft_data["missing_fields_notice"] is not None
    assert "UTR" in draft_data["missing_fields_notice"]


def test_complaint_fields_are_not_fabricated():
    """Test: Complaint drafts do not fabricate missing transaction references, dates, or details."""
    headers = {"X-User-Id": "1"}
    wizard_payload = {
        "scam_type": "Lottery Fraud",
        "description": "Scammer promised ₹25 Lakh lottery and asked for fee payment.",
        "financial_loss": 5000.0,
        "transaction_ref": "",  # Empty string
        "bank_name": "HDFC Bank",
        "transfer_status": "COMPLETED",
        "suspect_contact": None
    }

    response = client.post("/api/recovery/wizard", json=wizard_payload, headers=headers)
    assert response.status_code == 201
    draft_data = response.json()

    portal_text = draft_data["portal_complaint_text"]
    bank_text = draft_data["bank_complaint_text"]

    # Must explicitly state that UTR was not supplied rather than making up a fake UTR
    assert "NOT SUPPLIED" in portal_text or "PENDING" in portal_text
    assert "NOT SUPPLIED" in bank_text or "PENDING" in bank_text
    # Prominently directs to 1930 and cybercrime.gov.in
    assert "1930" in portal_text
    assert "cybercrime.gov.in" in portal_text


def test_invalid_amounts_are_rejected():
    """Test: Invalid payment simulation amounts (<= 0) are strictly rejected with 422."""
    headers = {"X-User-Id": "1"}

    # Zero amount
    resp_zero = client.post("/api/payment/simulate", json={
        "vpa_or_account": "merchant@okhdfc",
        "requested_amount": 0.0,
        "is_new_recipient": True
    }, headers=headers)
    assert resp_zero.status_code == 422

    # Negative amount
    resp_neg = client.post("/api/payment/simulate", json={
        "vpa_or_account": "merchant@okhdfc",
        "requested_amount": -500.0,
        "is_new_recipient": True
    }, headers=headers)
    assert resp_neg.status_code == 422


def test_users_cannot_access_another_users_incidents():
    """Test: Ownership enforcement prevents User 1 from accessing User 99's or User 2's private incidents."""
    import uuid
    unique_id = f"SA-OTHER-USER-{uuid.uuid4().hex[:8].upper()}"
    db = SessionLocal()
    try:
        # Insert directly via SQLAlchemy to simulate a record owned by a non-demo user
        other_incident = Incident(
            incident_id=unique_id,
            user_id=99,
            title="Private Incident of User 99",
            scam_type="Job Task Fraud",
            description="Victim lost money on telegram prepaid tasks.",
            financial_loss=12000.0,
            status="UNDER_REVIEW",
            severity="HIGH_RISK"
        )
        db.add(other_incident)

        # Also create a private incident belonging to demo User 2
        user2_inc_id = f"SA-USER2-PRIV-{uuid.uuid4().hex[:8].upper()}"
        user2_incident = Incident(
            incident_id=user2_inc_id,
            user_id=2,
            title="Private Incident of User 2",
            scam_type="Personal Loan Fraud",
            description="Private case of user 2.",
            financial_loss=5000.0,
            status="UNDER_REVIEW",
            severity="MEDIUM"
        )
        db.add(user2_incident)
        db.commit()
    finally:
        db.close()

    # User 1 tries to access User 99's incident — must get 403
    resp = client.get(f"/api/incidents/{unique_id}", headers={"X-User-Id": "1"})
    assert resp.status_code == 403
    assert "forbidden" in resp.json()["detail"].lower()

    # User 1 tries to access User 2's incident — must get 403
    resp2 = client.get(f"/api/incidents/{user2_inc_id}", headers={"X-User-Id": "1"})
    assert resp2.status_code == 403
    assert "forbidden" in resp2.json()["detail"].lower()


def test_notification_failures_do_not_destroy_incident_record():
    """Test: Notification/alert dispatch errors or retries do not delete the underlying incident."""
    headers = {"X-User-Id": "1"}
    # Create incident with invalid contact ID in alert dispatch
    inc_resp = client.post("/api/incidents", json={
        "title": "Crypto Investment Scam Test",
        "scam_type": "Crypto Ponzi",
        "description": "Telegram group promised 200% return.",
        "financial_loss": 30000.0,
        "severity": "HIGH_RISK",
        "risk_level": "HIGH"
    }, headers=headers)
    assert inc_resp.status_code == 201
    incident_id = inc_resp.json()["incident_id"]

    # Even if we attempt to dispatch to a non-existent contact ID 99999
    alert_resp = client.post("/api/alerts/dispatch", json={
        "contact_ids": [99999],
        "threat_title": "Fake alert",
        "message_content": "Testing failure tolerance",
        "incident_id": incident_id,
        "risk_level": "HIGH"
    }, headers=headers)
    assert alert_resp.status_code == 201  # Successfully completes without crashing

    # Incident MUST still exist in database
    get_resp = client.get(f"/api/incidents/{incident_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["incident_id"] == incident_id


def test_simulation_records_never_represented_as_real_bank_transactions():
    """Test: Payment simulations are explicitly marked with sandbox disclaimers and is_simulation=True."""
    headers = {"X-User-Id": "1"}
    sim_payload = {
        "vpa_or_account": "cbi-court-fine@ybl",
        "recipient_name": "CBI Officer Deshmukh",
        "is_new_recipient": True,
        "requested_amount": 15000.0,
        "purpose": "Digital arrest clearance deposit",
        "pressure_present": True,
        "authority_claimed": True,
        "secrecy_demanded": True,
        "guaranteed_returns": False
    }

    response = client.post("/api/payment/simulate", json=sim_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()

    # Must be categorized as high risk coercion
    assert data["outcome"] == "SEEK_TRUSTED_HELP"
    assert data["is_simulation"] is True
    assert "SIMULATION ONLY: no real money has been moved or blocked." in data["disclaimer"]
    assert data["simulation_id"].startswith("SIM-")
    assert len(data["evidence_factors"]) >= 2
    assert len(data["verification_steps"]) >= 2
