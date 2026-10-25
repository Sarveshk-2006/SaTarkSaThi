import pytest
import uuid
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models import FamilyAlert, TrustedContact, Incident, UserProfile
from backend.app.services.alert_broadcaster import alert_broadcaster

client = TestClient(app)


# ==============================================================================
# 1. Family Shield Alert Authorization Tests
# ==============================================================================

def test_alert_authorization_user1_cannot_view_user2_private_alerts():
    """
    Verify that User 1 cannot view User 2's private alerts.
    User 2 owns an alert sent to another third party; User 1 querying /api/alerts
    must not receive User 2's alert.
    """
    db = SessionLocal()
    try:
        # Create a contact owned by User 2
        u2_contact = TrustedContact(
            user_id=2,
            name="User 2 Personal Lawyer",
            relationship="Lawyer",
            phone_number="+91 99999 11111",
            email="lawyer2@example.com",
            alert_level="ALL",
            is_active=True,
            consent_granted=True
        )
        db.add(u2_contact)
        db.commit()
        db.refresh(u2_contact)

        # Create a private alert owned by User 2
        u2_alert = FamilyAlert(
            incident_id=f"SA-U2-{uuid.uuid4().hex[:6].upper()}",
            contact_id=u2_contact.id,
            user_id=2,
            threat_title="User 2 Confidential Alert",
            message_content="Confidential scam notification for User 2.",
            risk_level="HIGH",
            delivery_channel="IN_APP_SIMULATION",
            status="DELIVERED"
        )
        db.add(u2_alert)
        db.commit()
        db.refresh(u2_alert)
        target_alert_id = u2_alert.id
    finally:
        db.close()

    # User 1 queries /api/alerts
    resp = client.get("/api/alerts", headers={"X-User-Id": "1"})
    assert resp.status_code == 200
    alert_ids = [a["id"] for a in resp.json()]
    assert target_alert_id not in alert_ids, "Security defect: User 1 can see User 2's private alert!"

    # User 2 queries /api/alerts — User 2 should see it
    resp_u2 = client.get("/api/alerts", headers={"X-User-Id": "2"})
    assert resp_u2.status_code == 200
    u2_alert_ids = [a["id"] for a in resp_u2.json()]
    assert target_alert_id in u2_alert_ids


def test_alert_authorization_user2_cannot_view_user1_alerts_to_other_contacts():
    """
    Verify that User 2 (guardian) cannot view alerts dispatched by User 1 to OTHER contacts
    where User 2 is not the recipient (e.g. alerts sent to Priya Sharma).
    """
    db = SessionLocal()
    try:
        # Find Priya Sharma (User 1's daughter, contact_id != Aarav's contact_id)
        priya = db.query(TrustedContact).filter(
            TrustedContact.user_id == 1,
            TrustedContact.name.ilike("%Priya%")
        ).first()
        if not priya:
            priya = TrustedContact(
                user_id=1,
                name="Priya Sharma",
                relationship="Daughter",
                phone_number="+91 98202 34567",
                email="priya.sharma@example.com",
                alert_level="HIGH_RISK_ONLY",
                is_active=True,
                consent_granted=True
            )
            db.add(priya)
            db.commit()
            db.refresh(priya)

        priya_alert = FamilyAlert(
            incident_id=f"SA-PRIYA-{uuid.uuid4().hex[:6].upper()}",
            contact_id=priya.id,
            user_id=1,
            threat_title="Alert for Priya Only",
            message_content="Private communication sent exclusively to Priya.",
            risk_level="HIGH",
            delivery_channel="IN_APP_SIMULATION",
            status="DELIVERED"
        )
        db.add(priya_alert)
        db.commit()
        db.refresh(priya_alert)
        priya_alert_id = priya_alert.id
    finally:
        db.close()

    # User 2 queries /api/alerts — must NOT see Priya's alert
    resp_u2 = client.get("/api/alerts", headers={"X-User-Id": "2"})
    assert resp_u2.status_code == 200
    u2_alert_ids = [a["id"] for a in resp_u2.json()]
    assert priya_alert_id not in u2_alert_ids, "Security defect: User 2 can view an alert dispatched to Priya!"

    # User 1 (the owner) MUST see it
    resp_u1 = client.get("/api/alerts", headers={"X-User-Id": "1"})
    assert resp_u1.status_code == 200
    u1_alert_ids = [a["id"] for a in resp_u1.json()]
    assert priya_alert_id in u1_alert_ids


def test_alert_authorization_cannot_be_bypassed_by_query_parameters():
    """
    Verify that query parameters like ?user_id=2 or ?user_id=1 cannot bypass authorization.
    """
    # User 1 attempts ?user_id=2
    resp = client.get("/api/alerts?user_id=2", headers={"X-User-Id": "1"})
    assert resp.status_code == 200
    # Returned alerts must not contain any alerts where user_id=2 (since User 1 is not authorized)
    for alert in resp.json():
        assert alert["user_id"] == 1


def test_alert_acknowledgement_authorization():
    """
    Verify that a user cannot acknowledge an alert they are neither the owner nor recipient of.
    """
    db = SessionLocal()
    try:
        # Create an alert owned by User 2
        u2_contact = db.query(TrustedContact).filter(TrustedContact.user_id == 2).first()
        if not u2_contact:
            u2_contact = TrustedContact(
                user_id=2,
                name="User 2 Colleague",
                relationship="Friend",
                phone_number="+91 91111 22222",
                is_active=True,
                consent_granted=True
            )
            db.add(u2_contact)
            db.commit()
            db.refresh(u2_contact)

        u2_alert = FamilyAlert(
            incident_id=f"SA-ACK-{uuid.uuid4().hex[:6].upper()}",
            contact_id=u2_contact.id,
            user_id=2,
            threat_title="User 2 Private Unacknowledged Alert",
            message_content="Unacknowledged alert.",
            risk_level="HIGH",
            delivery_channel="IN_APP_SIMULATION",
            status="DELIVERED"
        )
        db.add(u2_alert)
        db.commit()
        db.refresh(u2_alert)
        u2_alert_id = u2_alert.id
    finally:
        db.close()

    # User 1 tries to acknowledge User 2's alert -> 403 Forbidden
    resp = client.post(f"/api/alerts/{u2_alert_id}/acknowledge", headers={"X-User-Id": "1"})
    assert resp.status_code == 403
    assert "forbidden" in resp.json()["detail"].lower()

    # User 2 acknowledges own alert -> 200 OK
    resp_u2 = client.post(f"/api/alerts/{u2_alert_id}/acknowledge", headers={"X-User-Id": "2"})
    assert resp_u2.status_code == 200
    assert resp_u2.json()["status"] == "ACKNOWLEDGED"


def test_alert_retry_authorization():
    """
    Verify that only the alert owner/creator can retry delivery (cross-user retry yields 403).
    """
    db = SessionLocal()
    try:
        u1_contact = db.query(TrustedContact).filter(TrustedContact.user_id == 1).first()
        u1_alert = FamilyAlert(
            incident_id=f"SA-RETRY-{uuid.uuid4().hex[:6].upper()}",
            contact_id=u1_contact.id,
            user_id=1,
            threat_title="User 1 Failed Alert",
            message_content="Testing retry.",
            risk_level="HIGH",
            delivery_channel="IN_APP_SIMULATION",
            status="FAILED"
        )
        db.add(u1_alert)
        db.commit()
        db.refresh(u1_alert)
        u1_alert_id = u1_alert.id
    finally:
        db.close()

    # User 2 attempts to retry User 1's alert -> 403 Forbidden
    resp = client.post(f"/api/alerts/{u1_alert_id}/retry", headers={"X-User-Id": "2"})
    assert resp.status_code == 403
    assert "forbidden" in resp.json()["detail"].lower()

    # User 1 retries own alert -> 200 OK
    resp_u1 = client.post(f"/api/alerts/{u1_alert_id}/retry", headers={"X-User-Id": "1"})
    assert resp_u1.status_code == 200
    assert resp_u1.json()["status"] == "DELIVERED"


def test_cross_user_incident_dispatch_rejected():
    """
    Verify that a user cannot dispatch alerts referencing an incident belonging to another user.
    """
    headers_u1 = {"X-User-Id": "1"}
    headers_u2 = {"X-User-Id": "2"}

    # User 2 creates an incident
    inc_resp = client.post("/api/incidents", json={
        "title": "User 2 Incident",
        "scam_type": "Loan Scam",
        "description": "User 2 incident description.",
        "financial_loss": 1000.0,
        "severity": "HIGH_RISK",
        "risk_level": "HIGH"
    }, headers=headers_u2)
    assert inc_resp.status_code == 201
    user2_inc_id = inc_resp.json()["incident_id"]

    # User 1 attempts to dispatch alert referencing User 2's incident -> 403
    contacts_resp = client.get("/api/contacts", headers=headers_u1)
    u1_contact_id = contacts_resp.json()[0]["id"]

    dispatch_resp = client.post("/api/alerts/dispatch", json={
        "contact_ids": [u1_contact_id],
        "threat_title": "Forged alert",
        "message_content": "Attempting cross-user incident hijack",
        "incident_id": user2_inc_id,
        "risk_level": "HIGH"
    }, headers=headers_u1)
    assert dispatch_resp.status_code == 403
    assert "forbidden" in dispatch_resp.json()["detail"].lower()


# ==============================================================================
# 2. WebSocket Isolation Tests
# ==============================================================================

def test_websocket_invalid_demo_identity_rejected():
    """
    Verify that WebSocket connections with invalid demo identities (e.g. 99, 0)
    are immediately closed with code 4003.
    """
    # Test on /api/ws/alerts
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/api/ws/alerts?user_id=99") as ws:
            ws.receive_text()
    assert exc.value.code == 4003

    # Test on /api/alerts/ws
    with pytest.raises(WebSocketDisconnect) as exc2:
        with client.websocket_connect("/api/alerts/ws?user_id=99") as ws2:
            ws2.receive_text()
    assert exc2.value.code == 4003


def test_websocket_channel_isolation():
    """
    Verify per-user channel isolation:
    - User 1's socket receives alert dispatched for User 1.
    - User 2's socket does NOT receive an alert intended solely for User 1 (sent to a non-User-2 contact).
    """
    db = SessionLocal()
    try:
        # Priya Sharma is User 1's daughter (not User 2 / Aarav)
        priya = db.query(TrustedContact).filter(
            TrustedContact.user_id == 1,
            TrustedContact.name.ilike("%Priya%")
        ).first()
        assert priya is not None
        priya_id = priya.id
    finally:
        db.close()

    # Open simultaneous WebSocket connections for User 1 and User 2
    with client.websocket_connect("/api/ws/alerts?user_id=1") as ws1:
        with client.websocket_connect("/api/ws/alerts?user_id=2") as ws2:
            # Dispatch alert exclusively to Priya (User 1's daughter)
            unique_incident = f"SA-ISO-{uuid.uuid4().hex[:6].upper()}"
            dispatch_resp = client.post("/api/alerts/dispatch", json={
                "contact_ids": [priya_id],
                "threat_title": "Isolated Threat Alert for Priya",
                "message_content": "Priya-only alert notification",
                "incident_id": unique_incident,
                "risk_level": "HIGH"
            }, headers={"X-User-Id": "1"})
            assert dispatch_resp.status_code == 201

            # User 1's socket MUST receive the notification
            msg1 = ws1.receive_json()
            assert msg1["type"] == "FAMILY_ALERT_NOTIFICATION"
            assert msg1["incident_id"] == unique_incident

            # Now broadcast an alert targeted to User 2 (e.g. Aarav)
            # Find Aarav Sharma contact ID
            db = SessionLocal()
            try:
                aarav_contact = db.query(TrustedContact).filter(
                    TrustedContact.user_id == 1,
                    TrustedContact.name.ilike("%Aarav%")
                ).first()
                assert aarav_contact is not None
                aarav_id = aarav_contact.id
            finally:
                db.close()

            dispatch_resp2 = client.post("/api/alerts/dispatch", json={
                "contact_ids": [aarav_id],
                "threat_title": "Threat Alert for Aarav (User 2)",
                "message_content": "Aarav notification",
                "incident_id": f"SA-AARAV-{uuid.uuid4().hex[:6].upper()}",
                "risk_level": "HIGH"
            }, headers={"X-User-Id": "1"})
            assert dispatch_resp2.status_code == 201

            # User 2 MUST receive this alert because Aarav is User 2
            msg2 = ws2.receive_json()
            assert msg2["type"] == "FAMILY_ALERT_NOTIFICATION"
            assert "Aarav" in msg2["threat_title"]


def test_websocket_disconnect_cleans_up_stale_subscriptions():
    """
    Verify that disconnecting a WebSocket connection removes the client cleanly
    without leaving stale subscriptions in AlertBroadcaster.
    """
    initial_user1_conns = len(alert_broadcaster.get_user_connections(1))

    # Connect client
    with client.websocket_connect("/api/ws/alerts?user_id=1") as ws:
        active_during = len(alert_broadcaster.get_user_connections(1))
        assert active_during == initial_user1_conns + 1

    # After exiting context, socket is closed and broadcaster must have disconnected it
    active_after = len(alert_broadcaster.get_user_connections(1))
    assert active_after == initial_user1_conns


# ==============================================================================
# 3. Consent Behavior & Regression Tests
# ==============================================================================

def _clear_contacts(user_id: int):
    """Family Shield allows two contacts per user, so contact-creation tests start from a clean slate."""
    db = SessionLocal()
    try:
        for c in db.query(TrustedContact).filter(TrustedContact.user_id == user_id).all():
            db.delete(c)
        db.commit()
    finally:
        db.close()


def test_contact_creation_defaults_to_no_consent():
    """
    Confirm that creating a new contact does NOT grant consent automatically.
    consent_granted must default to False and the contact's own acceptance starts as PENDING.
    """
    _clear_contacts(2)
    headers = {"X-User-Id": "2"}
    contact_payload = {
        "name": "Dr. Ramesh Verma",
        "relationship": "Friend",
        "phone_number": "+91 98450 12345",
        "alert_level": "ALL",
        "is_active": True
    }
    resp = client.post("/api/contacts", json=contact_payload, headers=headers)
    assert resp.status_code == 201
    contact = resp.json()
    assert contact["consent_granted"] is False, "Defect: contact creation granted consent automatically!"
    assert contact["contact_consent_status"] == "PENDING"
    contact_id = contact["id"]

    # Verify that alert dispatch skips this contact due to withheld consent
    alert_resp = client.post("/api/alerts/dispatch", json={
        "contact_ids": [contact_id],
        "threat_title": "Consent Test Threat",
        "message_content": "Should not dispatch",
        "incident_id": f"SA-CONSENT-{uuid.uuid4().hex[:6].upper()}",
        "risk_level": "HIGH"
    }, headers=headers)
    assert alert_resp.status_code == 201
    dispatched = alert_resp.json()
    # No alert was created because consent was not granted
    assert len(dispatched) == 0
    _clear_contacts(2)


def test_consent_lifecycle_grant_and_revocation():
    """
    Trace full two-sided consent lifecycle:
    1. Contact created (consent_granted=False, contact PENDING)
    2. Alert dispatch skipped
    3. Owner grants consent -> still skipped, because the contact has not accepted
    4. Contact accepts with a one-time invitation code -> dispatch succeeds
    5. Owner revokes consent -> dispatch skipped again
    """
    _clear_contacts(2)
    headers = {"X-User-Id": "2"}
    # 1. Create contact without consent
    create_resp = client.post("/api/contacts", json={
        "name": "Sunil Mehta",
        "relationship": "Lawyer",
        "phone_number": "+91 97111 22334",
        "alert_level": "ALL",
        "is_active": True
    }, headers=headers)
    assert create_resp.status_code == 201
    c_id = create_resp.json()["id"]
    assert create_resp.json()["consent_granted"] is False

    # 2. Dispatch skipped
    resp1 = client.post("/api/alerts/dispatch", json={
        "contact_ids": [c_id],
        "threat_title": "Test 1",
        "message_content": "Msg",
        "risk_level": "HIGH"
    }, headers=headers)
    assert len(resp1.json()) == 0

    # 3. Explicitly grant owner consent; the contact has not accepted yet
    pending_resp = client.put(f"/api/contacts/{c_id}", json={"consent_granted": True}, headers=headers)
    assert pending_resp.status_code == 200
    one_sided = client.post("/api/alerts/dispatch", json={
        "contact_ids": [c_id],
        "threat_title": "One-sided consent",
        "message_content": "Must be skipped until the contact accepts",
        "risk_level": "HIGH"
    }, headers=headers)
    assert len(one_sided.json()) == 0, "Alert sent without the contact's own acceptance!"

    # 4. Contact accepts with the invitation code
    invite = client.post(f"/api/contacts/{c_id}/invite", headers=headers)
    assert invite.status_code == 200
    accept = client.post("/api/contacts/invitations/respond-with-code", json={
        "invite_code": invite.json()["demo_invite_code"], "decision": "ACCEPT"
    })
    assert accept.status_code == 200
    assert accept.json()["contact_consent_status"] == "ACCEPTED"

    update_resp = client.put(f"/api/contacts/{c_id}", json={
        "consent_granted": True
    }, headers=headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["consent_granted"] is True

    # 4. Dispatch succeeds
    resp2 = client.post("/api/alerts/dispatch", json={
        "contact_ids": [c_id],
        "threat_title": "Consent Granted Alert",
        "message_content": "Delivered successfully",
        "risk_level": "HIGH"
    }, headers=headers)
    assert len(resp2.json()) == 1
    assert resp2.json()[0]["contact_id"] == c_id

    # 5. Revoke consent
    revoke_resp = client.put(f"/api/contacts/{c_id}", json={
        "consent_granted": False
    }, headers=headers)
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["consent_granted"] is False

    # 6. Dispatch skipped again
    resp3 = client.post("/api/alerts/dispatch", json={
        "contact_ids": [c_id],
        "threat_title": "After Revocation Alert",
        "message_content": "Must be skipped",
        "risk_level": "HIGH"
    }, headers=headers)
    assert len(resp3.json()) == 0
    _clear_contacts(2)
