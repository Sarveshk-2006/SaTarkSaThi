import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models import UserProfile

logger = logging.getLogger("satark_saathi.auth")

PBKDF2_ITERATIONS = 100_000


def hash_passcode(passcode: str, salt: Optional[str] = None) -> str:
    """
    Hashes a plain passcode using PBKDF2-HMAC-SHA256 with a cryptographically
    random 16-byte salt and 100,000 iterations.
    Format: pbkdf2:sha256:100000$<salt_hex>$<derived_key_hex>
    """
    if salt is None:
        salt = secrets.token_hex(16)
    salt_bytes = salt.encode("utf-8")
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        passcode.encode("utf-8"),
        salt_bytes,
        PBKDF2_ITERATIONS
    )
    return f"pbkdf2:sha256:{PBKDF2_ITERATIONS}${salt}${derived.hex()}"


def verify_passcode(plain_passcode: str, hashed_passcode: Optional[str]) -> bool:
    """
    Verifies a plain passcode against a stored hash using constant-time comparison.
    Supports both standard format and legacy demo seed passcode format.
    """
    if not hashed_passcode:
        return False

    # Backwards-compatibility for initial pre-seeded demo records ("pbkdf2:sha256:1234")
    if hashed_passcode == "pbkdf2:sha256:1234":
        return hmac.compare_digest(plain_passcode, "1234")

    try:
        parts = hashed_passcode.split("$")
        if len(parts) == 3:
            algo_info, salt, stored_hash = parts
            _, _, iterations_str = algo_info.split(":")
            iterations = int(iterations_str)
            computed = hashlib.pbkdf2_hmac(
                "sha256",
                plain_passcode.encode("utf-8"),
                salt.encode("utf-8"),
                iterations
            ).hex()
            return hmac.compare_digest(computed, stored_hash)
    except Exception as e:
        logger.warning(f"Error verifying passcode format: {e}")
        return False

    return False


def create_access_token(
    user_id: int,
    role: str = "PROTECTED_MEMBER",
    full_name: Optional[str] = None,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Creates a signed JWT access token with standard RFC 7519 claims:
    - sub: Subject (user_id as string)
    - user_id: Integer user ID
    - role: User authorization role
    - name: Full name
    - iat: Issued at (UTC timestamp)
    - exp: Expiration (UTC timestamp)
    - iss: Issuer identifier
    - aud: Audience identifier
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.jwt_access_token_expire_minutes)

    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "user_id": user_id,
        "role": role,
        "name": full_name or f"User {user_id}",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }

    token = jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm
    )
    return token


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and cryptographically validates a JWT access token.
    Enforces signature, expiration, issuer, and audience.
    Raises HTTPException(401) on any validation failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
            options={"require": ["exp", "iss", "aud", "sub"]}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"The token has expired\""},
        )
    except jwt.InvalidIssuerError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token issuer is invalid.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token audience is invalid.",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
        )


def authenticate_user(db: Session, identifier: str, passcode: str) -> Optional[UserProfile]:
    """
    Authenticates a user against UserProfile table by phone number or email,
    verifying their passcode.
    """
    clean_id = identifier.strip()
    user = db.query(UserProfile).filter(
        (UserProfile.phone_number == clean_id) |
        (UserProfile.email == clean_id)
    ).first()

    if not user:
        return None

    if user.is_active is False:
        return None

    if not verify_passcode(passcode, user.passcode_hash):
        return None

    return user
