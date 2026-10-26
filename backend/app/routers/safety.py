from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.dependencies import get_current_user_id
from backend.app.models import AuditEvent, SafetyPreference
from backend.app.schemas import DuressSettingsResponse, DuressSettingsUpdate
from backend.app.services.duress import hash_phrase, validate_phrase
from backend.app.services.family_guardian import eligible_guardian_contacts, utcnow

router = APIRouter(prefix="/safety", tags=["Safety Preferences"])


def _response(db: Session, user_id: int, pref) -> DuressSettingsResponse:
    return DuressSettingsResponse(
        enabled=bool(pref and pref.duress_enabled),
        configured_at=pref.duress_consent_at if pref and pref.duress_enabled else None,
        eligible_guardian_count=len(eligible_guardian_contacts(db, user_id)),
    )


@router.get("/duress", response_model=DuressSettingsResponse)
def get_duress_settings(current_user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """Returns only whether the feature is on. The phrase itself is never stored or returned."""
    pref = db.query(SafetyPreference).filter(SafetyPreference.user_id == current_user_id).first()
    return _response(db, current_user_id, pref)


@router.put("/duress", response_model=DuressSettingsResponse)
def set_duress_phrase(
    req: DuressSettingsUpdate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    if not req.consent_acknowledged:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please confirm that your accepted guardians may be contacted discreetly when the phrase is used.",
        )
    error = validate_phrase(req.phrase)
    if error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error)

    digest, word_count = hash_phrase(req.phrase)
    pref = db.query(SafetyPreference).filter(SafetyPreference.user_id == current_user_id).first()
    if not pref:
        pref = SafetyPreference(user_id=current_user_id)
        db.add(pref)
    pref.duress_enabled = True
    pref.duress_phrase_hash = digest
    pref.duress_word_count = word_count
    pref.duress_consent_at = utcnow()
    db.add(AuditEvent(
        user_id=current_user_id,
        event_type="DURESS_PHRASE_CONFIGURED",
        entity_type="safety",
        entity_id=str(current_user_id),
        description="Discreet safety phrase enabled with user consent (only a salted hash is stored).",
    ))
    db.commit()
    db.refresh(pref)
    return _response(db, current_user_id, pref)


@router.delete("/duress", response_model=DuressSettingsResponse)
def disable_duress_phrase(current_user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    pref = db.query(SafetyPreference).filter(SafetyPreference.user_id == current_user_id).first()
    if pref:
        pref.duress_enabled = False
        pref.duress_phrase_hash = None
        pref.duress_word_count = None
        pref.duress_consent_at = None
        db.add(AuditEvent(
            user_id=current_user_id,
            event_type="DURESS_PHRASE_DISABLED",
            entity_type="safety",
            entity_id=str(current_user_id),
            description="Discreet safety phrase disabled and its hash deleted.",
        ))
        db.commit()
    return _response(db, current_user_id, pref)
