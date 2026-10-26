import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import UserProfile, AuditEvent
from backend.app.schemas import (
    TokenResponse,
    LoginRequest,
    DemoTokenRequest,
    UserProfileResponse
)
from backend.app.services.auth_service import (
    authenticate_user,
    create_access_token
)
from backend.app.dependencies import get_current_user_id

logger = logging.getLogger("satark_saathi.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a user via phone number/email and passcode.
    Issues a cryptographically signed JWT with expiration and audience claims.
    """
    user = authenticate_user(db, request.identifier, request.passcode)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your phone number/email and passcode.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        user_id=user.id,
        role=user.role,
        full_name=user.full_name
    )

    # Log audit event
    audit = AuditEvent(
        user_id=user.id,
        event_type="USER_LOGIN_SUCCESS",
        entity_type="user",
        entity_id=str(user.id),
        description=f"User {user.full_name} ({user.id}) logged in successfully via cryptographic auth."
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user_id=user.id,
        role=user.role,
        full_name=user.full_name
    )


@router.post("/demo-token", response_model=TokenResponse)
def issue_demo_token(request: DemoTokenRequest, db: Session = Depends(get_db)):
    """
    Issues a signed JWT for pre-seeded demonstration personas.

    FAIL-CLOSED RELEASE GATE:
    Strictly forbidden in production environments or when demo authentication is disabled.
    """
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Production security policy: Demo token issuance is disabled in production environments."
        )

    if not settings.allow_demo_header_auth:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo identity issuance is disabled by server configuration."
        )

    if request.user_id not in (1, 2):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid demo persona ID. Valid demonstration IDs: 1 (Rajesh Sharma) or 2 (Aarav Sharma)."
        )

    user = db.query(UserProfile).filter(UserProfile.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo user profile not found in database.")

    token = create_access_token(
        user_id=user.id,
        role=user.role,
        full_name=user.full_name
    )

    logger.info(f"Issued signed demo JWT token for user {user.id} ({user.full_name}).")

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.jwt_access_token_expire_minutes * 60,
        user_id=user.id,
        role=user.role,
        full_name=user.full_name
    )


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Returns the profile of the currently authenticated user.
    """
    user = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user


@router.post("/logout")
def logout(current_user_id: int = Depends(get_current_user_id)):
    """
    Advisory logout endpoint. Instructs client to discard the JWT token.
    """
    return {
        "status": "success",
        "message": "User session ended. Please clear client-side token credentials."
    }
