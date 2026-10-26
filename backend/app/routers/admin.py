"""
Administration: operator accounts, access roles, activation, audit log and evidence retention.

Access model (enforced here, never by the frontend):
  USER      - own data only (family/guardian access comes from two-sided TrustedContact consent).
  OPERATOR  - read-only audit log and integration status; no personal message content.
  ADMIN     - everything above, plus user/role management, system settings, integration verification,
              retention purge and (development only) database reset.
"""

import json
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.dependencies import (
    DEMO_USER_IDS,
    get_access_role,
    get_current_user_id,
    require_admin,
    require_operator,
)
from backend.app.models import AuditEvent, UserProfile
from backend.app.services.auth_service import hash_passcode
from backend.app.services.security_ops import purge_expired_evidence

router = APIRouter(prefix="/admin", tags=["Administration"])

ACCESS_ROLES = ("USER", "OPERATOR", "ADMIN")


class AdminUserOut(BaseModel):
    id: int
    full_name: str
    phone_masked: str
    email: Optional[str] = None
    family_role: Optional[str] = None
    access_role: str
    is_active: bool
    is_bootstrap_admin: bool


class CreateUserIn(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., min_length=8, max_length=20)
    email: Optional[str] = Field(default=None, max_length=120)
    passcode: str = Field(..., min_length=6, max_length=64)
    access_role: str = "OPERATOR"


class UpdateUserIn(BaseModel):
    access_role: Optional[str] = None
    is_active: Optional[bool] = None


def _mask(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    return f"******{digits[-4:]}" if len(digits) >= 4 else "****"


def _out(u: UserProfile) -> AdminUserOut:
    return AdminUserOut(
        id=u.id,
        full_name=u.full_name,
        phone_masked=_mask(u.phone_number),
        email=u.email,
        family_role=u.role,
        access_role=get_access_role(u.id),
        is_active=u.is_active is not False,
        is_bootstrap_admin=u.id in settings.admin_user_id_set,
    )


def _audit(db: Session, actor_id: int, event_type: str, entity_id: str, description: str, meta: dict):
    db.add(AuditEvent(
        user_id=actor_id,
        event_type=event_type,
        entity_type="user",
        entity_id=entity_id,
        description=description,
        metadata_json=json.dumps(meta),
    ))


@router.get("/me")
def my_access(current_user_id: int = Depends(get_current_user_id)):
    role = get_access_role(current_user_id)
    return {"user_id": current_user_id, "access_role": role, "is_admin": role == "ADMIN",
            "is_operator": role in ("OPERATOR", "ADMIN")}


@router.get("/users", response_model=List[AdminUserOut])
def list_users(_admin: int = Depends(require_admin), db: Session = Depends(get_db)):
    return [_out(u) for u in db.query(UserProfile).order_by(UserProfile.id).all()]


@router.post("/users", response_model=AdminUserOut, status_code=201)
def create_user(body: CreateUserIn, admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    role = body.access_role.upper()
    if role not in ACCESS_ROLES:
        raise HTTPException(status_code=400, detail=f"access_role must be one of {ACCESS_ROLES}.")
    phone = body.phone_number.strip()
    exists = db.query(UserProfile).filter(
        (UserProfile.phone_number == phone) | ((UserProfile.email.isnot(None)) & (UserProfile.email == body.email))
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="A user with this phone number or email already exists.")
    user = UserProfile(
        full_name=body.full_name.strip(),
        phone_number=phone,
        email=body.email,
        role="PROTECTED_MEMBER",
        access_role=role,
        is_active=True,
        passcode_hash=hash_passcode(body.passcode),
    )
    db.add(user)
    db.flush()
    _audit(db, admin_id, "ADMIN_USER_CREATED", str(user.id),
           f"Administrator created account #{user.id} with access role {role}.", {"access_role": role})
    db.commit()
    db.refresh(user)
    return _out(user)


@router.patch("/users/{user_id}", response_model=AdminUserOut)
def update_user(user_id: int, body: UpdateUserIn, admin_id: int = Depends(require_admin),
                db: Session = Depends(get_db)):
    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    changes = {}
    if body.access_role is not None:
        role = body.access_role.upper()
        if role not in ACCESS_ROLES:
            raise HTTPException(status_code=400, detail=f"access_role must be one of {ACCESS_ROLES}.")
        if user_id == admin_id and role != "ADMIN":
            raise HTTPException(status_code=400, detail="You cannot remove your own administrator role.")
        if user_id in settings.admin_user_id_set and role != "ADMIN":
            raise HTTPException(status_code=400, detail="Bootstrap admins are set by ADMIN_USER_IDS on the server.")
        changes["access_role"] = [user.access_role, role]
        user.access_role = role
    if body.is_active is not None:
        if user_id == admin_id or user_id in DEMO_USER_IDS:
            raise HTTPException(status_code=400, detail="This account cannot be deactivated (self or demo persona).")
        changes["is_active"] = [user.is_active is not False, body.is_active]
        user.is_active = body.is_active
    if not changes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No changes supplied.")
    _audit(db, admin_id, "ADMIN_USER_UPDATED", str(user_id),
           f"Administrator updated account #{user_id}: {', '.join(changes)}.", changes)
    db.commit()
    db.refresh(user)
    return _out(user)


@router.get("/audit-events")
def audit_events(limit: int = 100, _op: int = Depends(require_operator), db: Session = Depends(get_db)):
    limit = max(1, min(limit, 500))
    rows = db.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit).all()
    # Metadata is omitted: operators see what happened, not personal message content.
    return [
        {"id": r.id, "user_id": r.user_id, "event_type": r.event_type, "entity_type": r.entity_type,
         "entity_id": r.entity_id, "description": r.description,
         "timestamp": r.timestamp.isoformat() if r.timestamp else None}
        for r in rows
    ]


@router.post("/retention/purge")
def run_retention_purge(admin_id: int = Depends(require_admin), db: Session = Depends(get_db)):
    result = purge_expired_evidence(db)
    db.add(AuditEvent(user_id=admin_id, event_type="RETENTION_PURGE", entity_type="system",
                      description=f"Retention purge redacted {result['redacted_analyses']} analyses.",
                      metadata_json=json.dumps(result)))
    db.commit()
    return result
