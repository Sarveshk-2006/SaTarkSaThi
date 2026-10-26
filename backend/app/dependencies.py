import logging
from typing import Optional, Set
from fastapi import Header, HTTPException, status

from backend.app.config import settings
from backend.app.services.auth_service import decode_access_token

logger = logging.getLogger("satark_saathi.dependencies")

# The two pre-seeded demonstration user identities.
# Aarav Sharma (ID 2) is Rajesh Sharma's (ID 1) guardian/family member.
DEMO_USER_IDS = {1, 2}

_DEMO_DISCLAIMER = (
    "DEMO IDENTITY BOUNDARY: X-User-Id is not production authentication. "
    "It identifies which pre-seeded demonstration persona is active. "
    "Only IDs 1 (Rajesh Sharma) and 2 (Aarav Sharma) are valid."
)


def get_current_user_id(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> int:
    """
    Extracts and authenticates user identity.

    1. Cryptographic Bearer Token (Production & Secure Path):
       If `Authorization: Bearer <token>` is present, the token is cryptographically
       verified against JWT secret, signature, expiration, issuer, and audience claims.
       This is the authoritative, production-ready authentication boundary.

    2. Fallback Demo Persona Header (Development/Testing Only):
       If no Authorization header is provided:
       - In PRODUCTION (`ENVIRONMENT=production` or `allow_demo_header_auth=False`),
         this FAILS CLOSED immediately with HTTP 401 Unauthorized.
       - In DEVELOPMENT/STAGING, if `allow_demo_header_auth=True`, falls back to
         the `X-User-Id` demonstration persona header (defaulting to "1") for pre-seeded
         demo workflows.
    """
    # 1. Bearer Token Authentication
    if authorization:
        parts = authorization.strip().split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Authorization header format. Expected 'Bearer <token>'.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token = parts[1].strip()
        payload = decode_access_token(token)
        try:
            user_id = int(payload.get("user_id") or payload.get("sub"))
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token claims: missing or non-integer user identifier.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id

    # 2. Production Fail-Closed Enforcement
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Production authentication required. Bearer token missing in Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not settings.allow_demo_header_auth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Demo persona header authentication is disabled by server configuration.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Development / Demo Persona Fallback
    effective_header = x_user_id if x_user_id is not None else "1"
    try:
        user_id = int(effective_header)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid X-User-Id header: must be an integer.",
        )

    if user_id not in DEMO_USER_IDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                f"Unknown demo user ID {user_id}. "
                "Accepted values: 1 (Rajesh Sharma) or 2 (Aarav Sharma). "
                + _DEMO_DISCLAIMER
            ),
        )

    logger.debug(f"Authenticated via dev-only demo persona header for user_id={user_id}")
    return user_id


def get_authorized_incident_user_ids(current_user_id: int, db) -> Set[int]:
    """
    Returns the set of user IDs whose incidents the current user is authorized to view.
    Always includes current_user_id (own records).
    Dynamically includes any user who has added current_user as an active, consented TrustedContact.
    """
    authorized_uids: Set[int] = {current_user_id}
    from backend.app.models import UserProfile, TrustedContact
    current_user = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    if current_user:
        contacts = db.query(TrustedContact).filter(
            (TrustedContact.phone_number == current_user.phone_number) |
            ((TrustedContact.email.isnot(None)) & (TrustedContact.email == current_user.email)),
            TrustedContact.is_active == True,
            TrustedContact.consent_granted == True,
            TrustedContact.contact_consent_status == "ACCEPTED"
        ).all()
        for c in contacts:
            authorized_uids.add(c.user_id)

    return authorized_uids
