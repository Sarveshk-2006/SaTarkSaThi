"""
Phase 3 Integration & End-to-End User Journey Tests
Validates:
1. Scan to Incident History (P0 - Phase 3.1)
   - High-risk / qualifying scans persist authoritative Incident records linked to ScamAnalysis
   - Low-risk (GREEN) scans stay in ScamAnalysis only without creating emergency Incidents
   - 15-minute deduplication prevents duplicate incidents on retried scans
2. Scanner -> Family Shield -> Incident Handoff (P0 - Phase 3.2)
   - Dispatched alert carries authoritative incident ID
   - Dynamic guardian authorization via active consented TrustedContact (not hardcoded user 2)
   - Cross-user authorization check (unauthorized user receives 403)
   - Nonexistent incident lookup returns 404
3. Golden Hour Recovery Persistence (P0 - Phase 3.3)
   - GET /recovery/cases/{incident_id} retrieves authoritative case context (loss, contact, timeline)
   - Restores draft and wizard progress on reload
   - Rejects unauthorized read with 403 and nonexistent case with 404
4. Honest Sandbox & Simulation Labels (P0 - Phase 3.4)
   - Bank freeze & cybercrime portal filings return explicit simulation notices and flags
   - No false claims of live interbank liens or government submissions
5. Payment Checkpoint Consistency (P1 - Phase 3.5)
   - Risk scoring aligned with policy tiers (RED, AMBER, GREEN)
   - POST /payment/simulations/{id}/save-incident creates authoritative incident
   - Deduplication prevents duplicate incident creation on repeated save
6. Family Shield Consent & Boundaries (P1 - Phase 3.6)
   - New contacts default to consent_granted=False
   - Alerts to unconsented contacts are withheld
   - Granting consent activates alert delivery
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models import ScamAnalysis, Incident, TrustedContact, FamilyAlert, PaymentSimulation, RecoveryDraft

client = TestClient(app)


@pytest.fixture(scope="function")
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_journey_1_scan_to_incident_history_high_risk():
    """
    Test 1: Submit a high-risk scam message.
    Verify:
    - Result has risk_level HIGH or CRITICAL and policy_tier RED
    - Authoritative incident_id (SA-XXXXXX) is generated and returned
    - Incident record exists in DB linked to ScamAnalysis
    - Incident appears in Incident History (GET /incidents)
    """
    headers = {"X-User-Id": "1"}
    high_risk_payload = {
        "text": "URGENT CBI ARREST NOTICE: You are charged under PMLA Money Laundering. Stay in isolated room on Skype video call. Pay 50000 bail immediately to clearing account.",
        "channel": "SMS"
    }

    res = client.post("/api/v1/analyze", json=high_risk_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["risk_level"] in ("HIGH", "CRITICAL")
    assert data["policy_tier"] == "RED"
    incident_id = data["incident_id"]
    assert incident_id is not None
    assert incident_id.startswith("SA-")

    # Verify Incident appears in GET /api/incidents
    inc_res = client.get(f"/api/incidents/{incident_id}", headers=headers)
    assert inc_res.status_code == 200
    inc_data = inc_res.json()
    assert inc_data["incident_id"] == incident_id
    assert inc_data["user_id"] == 1
    assert inc_data["risk_level"] in ("HIGH", "CRITICAL")
    assert inc_data["analysis_id"] is not None


def test_journey_1_low_risk_does_not_create_emergency_incident():
    """
    Verify low-risk safe scan does NOT create an emergency Incident record in the database.
    """
    headers = {"X-User-Id": "1"}
    safe_payload = {
        "text": "Your package has been delivered to your front porch by India Post. Thank you for using our service.",
        "channel": "SMS"
    }

    res = client.post("/api/v1/analyze", json=safe_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()

    assert data["risk_level"] in ("LOW", "MEDIUM")
    assert data["policy_tier"] == "GREEN"
    # Should receive a SCAN- ID instead of an authoritative SA- emergency incident ID
    assert data["incident_id"].startswith("SCAN-")

    # Confirm it does NOT exist as an emergency incident
    check_res = client.get(f"/api/incidents/{data['incident_id']}", headers=headers)
    assert check_res.status_code == 404


def test_journey_1_scan_deduplication():
    """
    Verify re-scanning the exact same high-risk message within 15 minutes
    reuses the authoritative incident rather than creating duplicates.
    """
    headers = {"X-User-Id": "1"}
    payload = {
        "text": "URGENT CBI ARREST NOTICE: You are charged under PMLA Money Laundering. Stay in isolated room on Skype video call. Pay 50000 bail immediately to clearing account.",
        "channel": "SMS"
    }

    res1 = client.post("/api/v1/analyze", json=payload, headers=headers)
    assert res1.status_code == 200
    id1 = res1.json()["incident_id"]
    assert id1.startswith("SA-")

    res2 = client.post("/api/v1/analyze", json=payload, headers=headers)
    assert res2.status_code == 200
    id2 = res2.json()["incident_id"]

    assert id1 == id2, "Duplicate incident created on rapid retry!"


def test_journey_2_scan_to_family_alert_to_guardian_view():
    """
    Test 2: Scanner -> Family Alert -> Guardian incident viewing.
    Verify:
    - User 1 dispatches an alert with their authoritative incident ID to guardian (User 2 / Aarav)
    - User 2 (guardian) can view the incident through dynamic relationship authorization
    - User 2's private incident cannot be viewed by User 1 (403 Forbidden)
    """
    headers_u1 = {"X-User-Id": "1"}
    headers_u2 = {"X-User-Id": "2"}

    # 1. User 1 scans threat
    scan_res = client.post("/api/v1/analyze", json={
        "text": "URGENT CBI ARREST NOTICE: You are charged under PMLA Money Laundering. Stay in isolated room on Skype video call. Pay 50000 bail immediately to clearing account.",
        "channel": "SMS"
    }, headers=headers_u1)
    incident_id = scan_res.json()["incident_id"]

    # 2. Get User 1's trusted contact for Aarav (User 2)
    contacts_res = client.get("/api/contacts", headers=headers_u1)
    contacts = contacts_res.json()
    aarav_contact = next((c for c in contacts if "Aarav" in c["name"]), None)
    assert aarav_contact is not None

    # 3. User 1 dispatches alert to Aarav
    dispatch_res = client.post("/api/alerts/dispatch", json={
        "contact_ids": [aarav_contact["id"]],
        "threat_title": "Critical CBI Threat Detected",
        "message_content": "Rajesh received a simulated arrest threat.",
        "incident_id": incident_id,
        "risk_level": "CRITICAL"
    }, headers=headers_u1)
    assert dispatch_res.status_code == 201

    # 4. User 2 (Aarav, guardian) opens the incident -> 200 OK
    guardian_view_res = client.get(f"/api/incidents/{incident_id}", headers=headers_u2)
    assert guardian_view_res.status_code == 200
    assert guardian_view_res.json()["incident_id"] == incident_id

    # 5. User 2 creates a private incident that is not shared with User 1
    u2_scan = client.post("/api/v1/analyze", json={
        "text": "URGENT CBI ARREST NOTICE: You are charged under PMLA Money Laundering. Stay in isolated room on Skype video call. Pay 50000 bail immediately to clearing account.",
        "channel": "SMS"
    }, headers=headers_u2)
    u2_incident_id = u2_scan.json()["incident_id"]
    assert u2_incident_id.startswith("SA-")

    # User 1 tries to view User 2's private incident -> 403 Forbidden
    unauth_view_res = client.get(f"/api/incidents/{u2_incident_id}", headers=headers_u1)
    assert unauth_view_res.status_code == 403


def test_journey_3_golden_hour_recovery_persistence():
    """
    Test 3: Refresh to Golden Hour.
    Verify:
    - GET /recovery/cases/{incident_id} retrieves full case context
    - Submitting wizard creates a RecoveryDraft linked to the incident
    - Subsequent fetch returns the draft and preserved data without losing state
    """
    headers = {"X-User-Id": "1"}

    # 1. Create a high-risk incident via scanner
    scan_res = client.post("/api/v1/analyze", json={
        "text": "URGENT CBI ARREST NOTICE: You are charged under PMLA Money Laundering. Stay in isolated room on Skype video call. Pay 50000 bail immediately to clearing account.",
        "channel": "SMS"
    }, headers=headers)
    incident_id = scan_res.json()["incident_id"]
    assert incident_id.startswith("SA-")

    # 2. Query recovery case context
    case_res = client.get(f"/api/recovery/cases/{incident_id}", headers=headers)
    assert case_res.status_code == 200
    case_data = case_res.json()
    assert case_data["incident_id"] == incident_id

    # 3. Execute recovery wizard
    wizard_payload = {
        "incident_id": incident_id,
        "scam_type": "SIM Disconnection Extortion",
        "communication_channel": "SMS",
        "description": "Caller claimed to be CBI investigator and demanded bail.",
        "financial_loss": 50000.0,
        "bank_name": "State Bank of India",
        "transfer_status": "COMPLETED",
        "suspect_contact": "+91 98765 43210",
        "timeline_events": ["Received SMS", "Threatened with immediate arrest"]
    }
    draft_res = client.post("/api/recovery/wizard", json=wizard_payload, headers=headers)
    assert draft_res.status_code == 201
    draft_id = draft_res.json()["id"]

    # 4. Simulate page refresh by fetching recovery case context again
    refreshed_case_res = client.get(f"/api/recovery/cases/{incident_id}", headers=headers)
    assert refreshed_case_res.status_code == 200
    refreshed_data = refreshed_case_res.json()
    assert refreshed_data["latest_draft"] is not None
    assert refreshed_data["latest_draft"]["id"] == draft_id
    assert refreshed_data["financial_loss"] == 50000.0


def test_journey_4_payment_checkpoint_save_incident_and_recovery():
    """
    Test 4: Payment Checkpoint -> Save Incident -> Escalation to Recovery.
    Verify:
    - Payment simulation aligns with risk_policy (policy_tier returned)
    - User can explicitly save the simulation as an authoritative Incident
    - Duplicate save returns the existing incident without creating duplicates
    - Recovery case endpoint can load the payment incident
    """
    headers = {"X-User-Id": "1"}

    # 1. Run coerced payment simulation
    sim_res = client.post("/api/payment/simulate", json={
        "vpa_or_account": "cbi.escrow@fakeupi",
        "recipient_name": "CBI Officer",
        "is_new_recipient": True,
        "requested_amount": 35000.0,
        "purpose": "Bail bond settlement",
        "pressure_present": True,
        "authority_claimed": True,
        "secrecy_demanded": True,
        "guaranteed_returns": False
    }, headers=headers)
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["policy_tier"] == "RED"
    assert sim_data["outcome"] == "SEEK_TRUSTED_HELP"
    sim_id = sim_data["simulation_id"]

    # 2. Explicitly save as Incident Dossier
    save_res = client.post(f"/api/payment/simulations/{sim_id}/save-incident", headers=headers)
    assert save_res.status_code == 201
    save_data = save_res.json()
    assert save_data["status"] == "UNDER_REVIEW"
    incident_id = save_data["incident_id"]
    assert incident_id.startswith("SA-")
    assert save_data["financial_loss"] == 35000.0

    # 3. Repeated save -> Idempotent, reuses existing incident
    repeat_save = client.post(f"/api/payment/simulations/{sim_id}/save-incident", headers=headers)
    assert repeat_save.status_code in (200, 201)
    assert repeat_save.json()["incident_id"] == incident_id

    # 4. Verify recovery case can load the saved payment incident
    rec_res = client.get(f"/api/recovery/cases/{incident_id}", headers=headers)
    assert rec_res.status_code == 200
    assert rec_res.json()["financial_loss"] == 35000.0


def test_journey_5_honest_simulation_disclaimers():
    """
    Test 5: Honest Sandbox and Simulation Disclaimers.
    Verify:
    - Bank freeze response has is_simulation=True and simulation_notice
    - Freeze reference contains -SIM-
    - Cybercrime portal response has is_simulation=True and simulation_notice
    - Ack number contains -SIM-
    - No claims of actual banking liens or live police filings
    """
    headers = {"X-User-Id": "1"}

    freeze_res = client.post("/api/recovery/submit-bank-freeze", json={
        "bank_name": "State Bank of India",
        "account_number_last4": "1234",
        "transaction_amount": 20000.0,
        "suspect_vpa_or_account": "fraud@fakeupi"
    }, headers=headers)
    assert freeze_res.status_code == 200
    f_data = freeze_res.json()
    assert f_data["is_simulation"] is True
    assert "SIM" in f_data["freeze_reference"]
    assert "PROTOTYPE SIMULATION" in f_data["simulation_notice"]

    portal_res = client.post("/api/recovery/submit-cybercrime-portal", json={
        "complaint_text": "Extortion complaint statement for testing.",
        "scam_category": "Extortion",
        "financial_loss": 20000.0
    }, headers=headers)
    assert portal_res.status_code == 200
    p_data = portal_res.json()
    assert p_data["is_simulation"] is True
    assert "SIM" in p_data["portal_ack_number"]
    assert "SANDBOX SIMULATION" in p_data["simulation_notice"] or "PROTOTYPE" in p_data["simulation_notice"]


def test_journey_6_family_shield_consent_defaults_and_activation():
    """
    Test 6: Family Shield Consent Defaults and Control.
    Verify:
    - Creating contact without consent_granted explicitly sets consent_granted=False
    - Alert dispatch skips contact with withheld consent
    - Owner consent plus the contact's own acceptance enables dispatch
    """
    db = SessionLocal()
    try:
        for c in db.query(TrustedContact).filter(TrustedContact.user_id == 2).all():
            db.delete(c)
        db.commit()
    finally:
        db.close()
    headers = {"X-User-Id": "2"}

    # 1. Create contact with consent_granted=False
    c_res = client.post("/api/contacts", json={
        "name": "Vikram Patel",
        "relationship": "Advisor",
        "phone_number": "+91 99000 11223",
        "alert_level": "HIGH_RISK_ONLY",
        "consent_granted": False
    }, headers=headers)
    assert c_res.status_code == 201
    contact = c_res.json()
    assert contact["consent_granted"] is False
    c_id = contact["id"]

    # 2. Try dispatching alert -> Contact is skipped because consent is withheld
    d_res = client.post("/api/alerts/dispatch", json={
        "contact_ids": [c_id],
        "threat_title": "Test Threat",
        "message_content": "Testing consent enforcement",
        "risk_level": "HIGH"
    }, headers=headers)
    assert d_res.status_code == 201
    assert len(d_res.json()) == 0, "Alert was dispatched to contact without consent!"

    # 3. Grant consent
    up_res = client.put(f"/api/contacts/{c_id}", json={
        "consent_granted": True
    }, headers=headers)
    assert up_res.status_code == 200
    assert up_res.json()["consent_granted"] is True

    # The invited contact accepts with a one-time code (two-sided consent)
    invite = client.post(f"/api/contacts/{c_id}/invite", headers=headers)
    code = invite.json()["demo_invite_code"]
    accept = client.post("/api/contacts/invitations/respond-with-code", json={"invite_code": code, "decision": "ACCEPT"})
    assert accept.status_code == 200

    # 4. Dispatch alert again -> Succeeded
    d_res2 = client.post("/api/alerts/dispatch", json={
        "contact_ids": [c_id],
        "threat_title": "Test Threat 2",
        "message_content": "Testing consent after activation",
        "risk_level": "HIGH"
    }, headers=headers)
    assert d_res2.status_code == 201
    assert len(d_res2.json()) == 1


def test_journey_7_authorization_boundaries_and_nonexistent_cases():
    """
    Test 7: Security Boundaries and Nonexistent Cases.
    Verify:
    - GET /recovery/cases/{nonexistent_id} returns 404
    - Unknown demo user (User 3) receives 401 Unauthorized
    - User 1 cannot read User 2's private recovery case (403 Forbidden)
    - User 1 cannot dispatch an alert citing User 2's private incident (403 Forbidden)
    """
    headers_u1 = {"X-User-Id": "1"}
    headers_u2 = {"X-User-Id": "2"}
    headers_u3 = {"X-User-Id": "3"}

    # 1. Nonexistent case returns 404
    res_404 = client.get("/api/recovery/cases/SA-NONEXISTENT-9999", headers=headers_u1)
    assert res_404.status_code == 404

    # 2. Unknown demo user receives 401 Unauthorized
    res_401 = client.get("/api/recovery/cases/SA-NONEXISTENT-9999", headers=headers_u3)
    assert res_401.status_code == 401

    # 3. User 2 creates a private high-risk incident
    u2_scan = client.post("/api/v1/analyze", json={
        "text": "URGENT CBI ARREST NOTICE: You are charged under PMLA Money Laundering. Stay in isolated room on Skype video call. Pay 50000 bail immediately to clearing account.",
        "channel": "SMS"
    }, headers=headers_u2)
    u2_incident = u2_scan.json()["incident_id"]
    assert u2_incident.startswith("SA-")

    # 4. User 1 (not authorized for User 2's records) tries to read User 2's recovery case -> 403
    unauth_rec = client.get(f"/api/recovery/cases/{u2_incident}", headers=headers_u1)
    assert unauth_rec.status_code == 403

    # 5. User 1 tries to dispatch an alert for User 2's incident -> 403
    contacts_u1 = client.get("/api/contacts", headers=headers_u1).json()
    c_id = contacts_u1[0]["id"]
    unauth_alert = client.post("/api/alerts/dispatch", json={
        "contact_ids": [c_id],
        "threat_title": "Forged alert attempting to steal incident",
        "message_content": "Forged alert content",
        "incident_id": u2_incident
    }, headers=headers_u1)
    assert unauth_alert.status_code == 403
