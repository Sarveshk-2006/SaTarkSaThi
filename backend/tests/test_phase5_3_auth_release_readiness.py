"""
Phase 5.3 Integrated Release Readiness & Authentication Test Suite.
Validates:
1. Cryptographic JWT authentication (issuance, claims, expiration, tampering).
2. Production fail-closed enforcement (X-User-Id rejection in prod, demo endpoint blocking).
3. WebSocket token authentication and isolation.
4. End-to-end cross-user authorization across incidents, contacts, and payments.
5. Consent lifecycle and revocation boundaries.
6. Transparent simulation disclaimers and integrity invariants.
"""

import pytest
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from backend.app.config import settings
from backend.app.database import get_db, SessionLocal
from backend.app.models import UserProfile, Incident, TrustedContact, PaymentSimulation
from backend.app.services.auth_service import (
    create_access_token,
    decode_access_token,
    hash_passcode,
    verify_passcode
)

client = TestClient(app)


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def user1_token():
    return create_access_token(user_id=1, role="PROTECTED_MEMBER", full_name="Rajesh Sharma")


@pytest.fixture(scope="module")
def user2_token():
    return create_access_token(user_id=2, role="GUARDIAN", full_name="Aarav Sharma")


# ==============================================================================
# 1. Cryptographic Authentication & Token Verification Tests
# ==============================================================================

class TestCryptographicAuthentication:
    def test_passcode_hashing_and_verification(self):
        secret = "Secr3tP@sscode123"
        hashed = hash_passcode(secret)
        assert hashed.startswith("pbkdf2:sha256:100000$")
        assert verify_passcode(secret, hashed) is True
        assert verify_passcode("WrongPasscode", hashed) is False

    def test_legacy_demo_seed_passcode_compatibility(self):
        # Legacy demo seeds used "pbkdf2:sha256:1234" with passcode "1234"
        assert verify_passcode("1234", "pbkdf2:sha256:1234") is True
        assert verify_passcode("9999", "pbkdf2:sha256:1234") is False

    def test_login_success_with_demo_credentials(self):
        # Test login for Rajesh Sharma using default passcode
        response = client.post("/api/auth/login", json={
            "identifier": "+91 98765 43210",
            "passcode": "1234"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user_id"] == 1
        assert data["full_name"] == "Rajesh Sharma"

        # Verify decoded payload claims
        payload = decode_access_token(data["access_token"])
        assert payload["user_id"] == 1
        assert payload["iss"] == settings.jwt_issuer
        assert payload["aud"] == settings.jwt_audience

    def test_login_invalid_credentials_rejected(self):
        response = client.post("/api/auth/login", json={
            "identifier": "+91 98765 43210",
            "passcode": "WrongPassword999"
        })
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_authenticated_me_endpoint_with_bearer_token(self, user1_token):
        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {user1_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["full_name"] == "Rajesh Sharma"

    def test_expired_token_rejected_with_401(self):
        # Generate an expired token
        past_delta = timedelta(minutes=-10)
        expired_token = create_access_token(user_id=1, expires_delta=past_delta)

        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {expired_token}"
        })
        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()

    def test_tampered_token_signature_rejected_with_401(self, user1_token):
        # Tamper with the signature portion
        parts = user1_token.split(".")
        tampered_sig = parts[2][:-4] + "XXXX"
        tampered_token = f"{parts[0]}.{parts[1]}.{tampered_sig}"

        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {tampered_token}"
        })
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_malformed_token_header_rejected(self):
        response = client.get("/api/auth/me", headers={
            "Authorization": "InvalidScheme token123"
        })
        assert response.status_code == 401
        assert "Expected 'Bearer <token>'" in response.json()["detail"]

    def test_invalid_audience_or_issuer_token_rejected(self):
        # Token signed with correct key but wrong audience
        bad_token = jwt.encode(
            {
                "sub": "1",
                "user_id": 1,
                "role": "PROTECTED_MEMBER",
                "iat": int(datetime.now(timezone.utc).timestamp()),
                "exp": int((datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()),
                "iss": "rogue-issuer",
                "aud": "rogue-audience"
            },
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm
        )

        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {bad_token}"
        })
        assert response.status_code == 401


# ==============================================================================
# 2. Production Fail-Closed Enforcement Tests
# ==============================================================================

class TestProductionFailClosedEnforcement:
    def test_production_mode_rejects_unauthenticated_x_user_id(self):
        # Temporarily simulate production environment
        original_env = settings.app_env
        try:
            settings.app_env = "production"
            assert settings.is_production is True

            # In production, relying on X-User-Id without Bearer token must fail closed
            response = client.get("/api/incidents", headers={"X-User-Id": "1"})
            assert response.status_code == 401
            assert "Bearer token missing" in response.json()["detail"]
        finally:
            settings.app_env = original_env

    def test_production_mode_accepts_valid_bearer_token(self, user1_token):
        original_env = settings.app_env
        try:
            settings.app_env = "production"
            assert settings.is_production is True

            # In production, valid Bearer token succeeds
            response = client.get("/api/incidents", headers={
                "Authorization": f"Bearer {user1_token}"
            })
            assert response.status_code == 200
        finally:
            settings.app_env = original_env

    def test_production_mode_blocks_demo_token_endpoint(self):
        original_env = settings.app_env
        try:
            settings.app_env = "production"
            response = client.post("/api/auth/demo-token", json={"user_id": 1})
            assert response.status_code == 403
            assert "disabled in production" in response.json()["detail"]
        finally:
            settings.app_env = original_env

    def test_production_mode_blocks_reset_database(self):
        original_env = settings.app_env
        try:
            settings.app_env = "production"
            response = client.post("/api/settings/reset-database", json={"seed_demo_data": False})
            # Fails closed: unauthenticated in production -> 401 before the reset guard (403).
            assert response.status_code in (401, 403)
        finally:
            settings.app_env = original_env

    def test_production_mode_blocks_evaluation_run(self):
        original_env = settings.app_env
        try:
            settings.app_env = "production"
            response = client.post("/api/evaluation/run?dataset=baseline")
            assert response.status_code == 403
            assert "disabled in production" in response.json()["detail"]
        finally:
            settings.app_env = original_env

    def test_validate_production_security_catches_unsafe_defaults(self):
        original_env = settings.app_env
        original_secret = settings.jwt_secret_key
        try:
            settings.app_env = "production"
            # Default secret with "change_in_production"
            with pytest.raises(ValueError, match="FATAL SECURITY CONFIGURATION"):
                settings.validate_production_security()

            # Fix secret but leave demo header auth enabled
            settings.jwt_secret_key = "a" * 32
            with pytest.raises(ValueError, match="ALLOW_DEMO_HEADER_AUTH must be False"):
                settings.validate_production_security()
        finally:
            settings.app_env = original_env
            settings.jwt_secret_key = original_secret


# ==============================================================================
# 3. End-to-End Authorization & User Isolation Tests
# ==============================================================================

class TestEndToEndAuthorization:
    def test_user1_cannot_modify_user2_incident(self, user1_token, user2_token, db_session: Session):
        # Create an incident owned by user 2
        now = datetime.now(timezone.utc)
        inc2 = Incident(
            incident_id=f"SA-TEST-U2-{int(now.timestamp())}",
            user_id=2,
            title="User 2 Secret Incident",
            scam_type="Digital Arrest",
            description="Private investigation for User 2",
            financial_loss=5000.0,
            currency="INR",
            status="UNDER_REVIEW",
            risk_level="HIGH",
            incident_date=now
        )
        db_session.add(inc2)
        db_session.commit()
        db_session.refresh(inc2)

        try:
            # User 1 attempts to update User 2's incident -> must be 403 Forbidden
            response = client.put(
                f"/api/incidents/{inc2.incident_id}",
                headers={"Authorization": f"Bearer {user1_token}"},
                json={"title": "Hacked Title by User 1"}
            )
            assert response.status_code == 403
            assert "cannot modify incidents belonging to another user" in response.json()["detail"]

            # User 1 attempts to delete User 2's incident -> must be 403 Forbidden
            del_resp = client.delete(
                f"/api/incidents/{inc2.incident_id}",
                headers={"Authorization": f"Bearer {user1_token}"}
            )
            assert del_resp.status_code == 403
        finally:
            db_session.delete(inc2)
            db_session.commit()

    def test_consent_lifecycle_and_guardian_incident_access(self, user1_token, user2_token, db_session: Session):
        # Find contact linking User 1 to User 2
        contact = db_session.query(TrustedContact).filter(
            TrustedContact.user_id == 1,
            TrustedContact.phone_number == "+91 98101 23456"  # Aarav's phone
        ).first()

        assert contact is not None

        # Verify: when consent_granted is False, User 2 CANNOT view User 1's incidents
        contact.consent_granted = False
        db_session.commit()

        u2_incidents = client.get("/api/incidents", headers={"Authorization": f"Bearer {user2_token}"}).json()
        u1_ids_seen = [inc["user_id"] for inc in u2_incidents if inc["user_id"] == 1]
        assert len(u1_ids_seen) == 0, "User 2 should NOT view User 1 incidents when consent is revoked."

        # Verify: when consent_granted is True, User 2 CAN view User 1's shared incidents
        contact.consent_granted = True
        db_session.commit()

        u2_incidents_consented = client.get("/api/incidents", headers={"Authorization": f"Bearer {user2_token}"}).json()
        u1_ids_seen_consented = [inc["user_id"] for inc in u2_incidents_consented if inc["user_id"] == 1]
        assert len(u1_ids_seen_consented) > 0, "Consented guardian must be able to view family incidents."

    def test_payment_simulation_cross_user_conversion_blocked(self, user1_token, user2_token, db_session: Session):
        # Create a payment simulation owned by User 2
        now = datetime.now(timezone.utc)
        sim2 = PaymentSimulation(
            simulation_id=f"SIM-U2-{int(now.timestamp())}",
            user_id=2,
            vpa_or_account="extortionist@upi",
            recipient_name="Unknown Suspect",
            is_new_recipient=True,
            requested_amount=25000.0,
            purpose="Urgent ransom",
            outcome="SEEK_TRUSTED_HELP",
            risk_score=95,
            severity="HIGH_RISK",
            decision_rationale="High coercion detected"
        )
        db_session.add(sim2)
        db_session.commit()
        db_session.refresh(sim2)

        try:
            # User 1 attempts to convert User 2's payment simulation into an incident
            response = client.post(
                f"/api/payment/simulations/{sim2.simulation_id}/save-incident",
                headers={"Authorization": f"Bearer {user1_token}"}
            )
            assert response.status_code == 403
            assert "cannot convert another user's simulation" in response.json()["detail"]
        finally:
            db_session.delete(sim2)
            db_session.commit()


# ==============================================================================
# 4. Simulation Clarity & Recovery Disclaimer Invariants
# ==============================================================================

class TestSimulationClarityInvariants:
    def test_bank_freeze_is_strictly_labeled_simulation(self, user1_token):
        response = client.post(
            "/api/recovery/submit-bank-freeze",
            headers={"Authorization": f"Bearer {user1_token}"},
            json={
                "bank_name": "State Bank of India",
                "transaction_amount": 10000.0,
                "suspect_vpa_or_account": "fraudster@paytm"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_simulation"] is True
        assert "PROTOTYPE SIMULATION ONLY" in data["simulation_notice"]
        assert "No actual bank lien was placed" in data["simulation_notice"]

    def test_cybercrime_portal_is_strictly_labeled_simulation(self, user1_token):
        response = client.post(
            "/api/recovery/submit-cybercrime-portal",
            headers={"Authorization": f"Bearer {user1_token}"},
            json={
                "complaint_text": "Victim coerced into transferring funds via fake CBI parcel call.",
                "financial_loss": 50000.0,
                "scam_category": "Digital Arrest"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_simulation"] is True
        assert "SIMULATION ONLY" in data["simulation_notice"]
        assert "cybercrime.gov.in" in data["simulation_notice"]


    def test_payment_simulation_endpoint_disclaimers(self, user1_token):
        response = client.post(
            "/api/payment/check",
            headers={"Authorization": f"Bearer {user1_token}"},
            json={
                "vpa_or_account": "suspect@upi",
                "recipient_name": "Unknown",
                "requested_amount": 5000.0,
                "purpose": "Verification fee"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_simulation"] is True
        assert "SIMULATION ONLY" in data["disclaimer"]


# ==============================================================================
# 5. WebSocket Authentication Tests
# ==============================================================================

class TestWebSocketAuthentication:
    def test_websocket_accepts_valid_jwt_token(self, user1_token):
        with client.websocket_connect(f"/api/ws/alerts?token={user1_token}") as websocket:
            # Connection successfully accepted
            assert websocket is not None

    def test_websocket_rejects_invalid_token(self):
        with pytest.raises(Exception):
            with client.websocket_connect("/api/ws/alerts?token=invalid.tampered.token") as websocket:
                pass

    def test_websocket_production_mode_rejects_missing_token(self):
        original_env = settings.app_env
        try:
            settings.app_env = "production"
            with pytest.raises(Exception):
                with client.websocket_connect("/api/ws/alerts?user_id=1") as websocket:
                    pass
        finally:
            settings.app_env = original_env
