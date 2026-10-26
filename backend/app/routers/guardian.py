import json
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.dependencies import get_current_user_id
from backend.app.models import AuditEvent, GuardianApprovalRequest, UserProfile
from backend.app.schemas import GuardianApprovalResponse, GuardianDecisionRequest
from backend.app.services.alert_broadcaster import alert_broadcaster
from backend.app.services.family_guardian import (
    contacts_matching_user, deciding_contact_for_user, refresh_expiry, serialize_request, utcnow,
)

logger = logging.getLogger("satark_saathi.guardian")

router = APIRouter(prefix="/guardian", tags=["Family Shield Guardian Approvals"])


@router.get("/approvals", response_model=List[GuardianApprovalResponse])
def list_approvals(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Returns approval requests the user created, plus requests they are currently allowed to decide
    as an accepted, consented guardian. Nothing else is visible.
    """
    owner_ids = {c.user_id for c in contacts_matching_user(db, current_user_id)}
    candidates = db.query(GuardianApprovalRequest).filter(
        (GuardianApprovalRequest.requester_user_id == current_user_id)
        | (GuardianApprovalRequest.requester_user_id.in_(list(owner_ids) or [-1]))
    ).order_by(GuardianApprovalRequest.id.desc()).limit(50).all()

    changed = False
    visible = []
    for req in candidates:
        changed = refresh_expiry(req) or changed
        if req.requester_user_id == current_user_id or deciding_contact_for_user(db, req, current_user_id):
            visible.append(req)
    if changed:
        db.commit()
    return [GuardianApprovalResponse(**serialize_request(db, r, current_user_id)) for r in visible]


@router.post("/approvals/{request_ref}/decision", response_model=GuardianApprovalResponse)
async def decide_approval(
    request_ref: str,
    req: GuardianDecisionRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    approval = db.query(GuardianApprovalRequest).filter(GuardianApprovalRequest.request_ref == request_ref).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found.")

    contact = deciding_contact_for_user(db, approval, current_user_id)
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only an accepted, consented guardian of the requester can decide this request.",
        )

    if refresh_expiry(approval):
        db.commit()
    if approval.status != "PENDING":
        raise HTTPException(status_code=409, detail=f"This request is already {approval.status}.")

    approval.status = "APPROVED" if req.decision == "APPROVE" else "DECLINED"
    approval.decided_at = utcnow()
    approval.decided_by_user_id = current_user_id
    approval.decided_by_contact_id = contact.id
    approval.decision_note = (req.note or "").strip() or None

    guardian = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    guardian_name = guardian.full_name if guardian else f"User {current_user_id}"
    db.add(AuditEvent(
        user_id=approval.requester_user_id,
        event_type=f"GUARDIAN_APPROVAL_{approval.status}",
        entity_type="simulation",
        entity_id=approval.simulation_id,
        description=f"Guardian {guardian_name} {approval.status.lower()} request {approval.request_ref}.",
        metadata_json=json.dumps({"request_ref": approval.request_ref, "decided_by_user_id": current_user_id}),
    ))
    db.commit()
    db.refresh(approval)

    try:
        await alert_broadcaster.broadcast_alert({
            "type": "GUARDIAN_APPROVAL_DECIDED",
            "request_ref": approval.request_ref,
            "simulation_id": approval.simulation_id,
            "status": approval.status,
            "threat_title": f"Guardian {approval.status.lower()} your payment",
            "risk_level": "HIGH" if approval.status == "DECLINED" else "MEDIUM",
            "message_content": f"{guardian_name} {approval.status.lower()} the ₹{approval.amount:,.0f} payment to {approval.payee}.",
        }, target_user_ids={approval.requester_user_id})
    except Exception as e:
        logger.warning(f"Approval decision broadcast failed (decision still stored): {e}")

    return GuardianApprovalResponse(**serialize_request(db, approval, current_user_id))
