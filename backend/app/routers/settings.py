from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from backend.app.database import get_db, Base, engine
from backend.app.config import settings
from backend.app.dependencies import get_current_user_id, require_admin
from backend.app.models import (
    UserProfile,
    TrustedContact,
    ScamAnalysis,
    ScamEvidence,
    FamilyAlert,
    Incident,
    RecoveryDraft,
    PaymentCheck,
    AuditEvent,
    GuardianApprovalRequest,
    TransactionRecord,
    SafetyPreference,
)
from backend.app.schemas import (
    UserProfileResponse,
    UserProfileUpdate,
    SystemSettingsResponse,
    SystemSettingsUpdate
)
from backend.app.seed_data import seed_default_data

router = APIRouter(prefix="/settings", tags=["Settings & Profile"])

class ResetDbRequest(BaseModel):
    seed_demo_data: bool = True

@router.get("", response_model=SystemSettingsResponse)
def get_system_settings():
    return SystemSettingsResponse(
        app_name=settings.app_name,
        app_env=settings.app_env,
        analysis_provider=settings.analysis_provider,
        watsonx_configured=settings.watsonx_configured,
        enable_demo_seed=settings.enable_demo_seed
    )

@router.put("/system", response_model=SystemSettingsResponse)
def update_system_settings(
    update_in: SystemSettingsUpdate,
    _admin_id: int = Depends(require_admin),
):
    if update_in.analysis_provider:
        from backend.app.services.factory import SUPPORTED_PROVIDERS
        if update_in.analysis_provider not in SUPPORTED_PROVIDERS:
            raise HTTPException(status_code=400, detail=f"analysis_provider must be one of {SUPPORTED_PROVIDERS}.")
        settings.analysis_provider = update_in.analysis_provider
    if update_in.watsonx_apikey is not None:
        settings.watsonx_apikey = update_in.watsonx_apikey
    if update_in.watsonx_project_id is not None:
        settings.watsonx_project_id = update_in.watsonx_project_id

    return SystemSettingsResponse(
        app_name=settings.app_name,
        app_env=settings.app_env,
        analysis_provider=settings.analysis_provider,
        watsonx_configured=settings.watsonx_configured,
        enable_demo_seed=settings.enable_demo_seed
    )

@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    if not profile:
        profile = UserProfile(id=current_user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    profile_in: UserProfileUpdate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    if not profile:
        profile = UserProfile(id=current_user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    update_dict = profile_in.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(profile, k, v)

    db.commit()
    db.refresh(profile)
    return profile

@router.post("/reset-database")
def reset_database(
    req: ResetDbRequest,
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
):
    """
    Resets the database tables. If seed_demo_data is True, loads realistic seed data.
    If False, leaves all tables empty to demonstrate a brand-new user experience.
    Requires an administrator AND ALLOW_DATABASE_RESET=true; never allowed in production.
    """
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Production security policy: Database reset is strictly forbidden in production environments."
        )
    if not settings.allow_database_reset:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database reset is disabled on this server (ALLOW_DATABASE_RESET=false)."
        )

    require_admin(authorization=authorization, x_user_id=x_user_id)

    db.query(RecoveryDraft).delete()
    db.query(Incident).delete()
    db.query(FamilyAlert).delete()
    db.query(ScamEvidence).delete()
    db.query(ScamAnalysis).delete()
    db.query(GuardianApprovalRequest).delete()
    db.query(TransactionRecord).delete()
    db.query(SafetyPreference).delete()
    db.query(PaymentCheck).delete()
    db.query(AuditEvent).delete()
    db.query(TrustedContact).delete()
    db.query(UserProfile).delete()
    db.commit()

    if req.seed_demo_data:
        seed_default_data(db, force=True)
        message = "Database reset and seeded with realistic demo data."
    else:
        # Create single clean profile with no scans, contacts, or incidents
        clean_profile = UserProfile(
            full_name="New User",
            phone_number="+91 98000 00000",
            email="user@example.in",
            preferred_language="English",
            city="New Delhi",
            bank_name="State Bank of India",
            notifications_enabled=True
        )
        db.add(clean_profile)
        db.commit()
        message = "Database reset to completely empty state for new user testing."

    return {
        "status": "success",
        "message": message,
        "seeded": req.seed_demo_data
    }
