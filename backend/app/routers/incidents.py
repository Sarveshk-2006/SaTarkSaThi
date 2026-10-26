import random
import logging
from typing import List, Optional, Set
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database import get_db
from backend.app.models import Incident, RecoveryDraft, FamilyAlert, TrustedContact, AuditEvent, UserProfile
from backend.app.dependencies import get_current_user_id, get_authorized_incident_user_ids
from backend.app.schemas import (
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    AuditEventResponse
)
from backend.app.routers.recovery import generate_recovery_draft_legacy
from backend.app.services.alert_broadcaster import alert_broadcaster

logger = logging.getLogger("satark_saathi.incidents")

router = APIRouter(prefix="/incidents", tags=["Incident History & Management"])


@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    search: Optional[str] = Query(None, description="Search by Incident ID, title, or description"),
    scam_type: Optional[str] = Query(None, description="Filter by scam category"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    date_from: Optional[datetime] = Query(None, description="Filter incidents starting from date"),
    date_to: Optional[datetime] = Query(None, description="Filter incidents up to date"),
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List, search, and filter incidents with strict dynamic relationship-based ownership checks.
    Consented guardians can view linked family member incidents based on active consent.
    """
    query = db.query(Incident)

    # Dynamic ownership and guardian access check
    authorized_uids = get_authorized_incident_user_ids(current_user_id, db)
    query = query.filter(Incident.user_id.in_(authorized_uids))

    # Search filter
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Incident.incident_id.ilike(term),
                Incident.title.ilike(term),
                Incident.description.ilike(term),
                Incident.scam_type.ilike(term),
                Incident.transaction_ref.ilike(term)
            )
        )

    # Category filter
    if scam_type and scam_type.strip():
        query = query.filter(Incident.scam_type == scam_type.strip())

    # Risk level filter
    if risk_level and risk_level.strip():
        query = query.filter(Incident.risk_level == risk_level.strip())

    # Status filter
    if status and status.strip():
        query = query.filter(Incident.status == status.strip())

    # Date range filters
    if date_from:
        query = query.filter(Incident.created_at >= date_from)
    if date_to:
        query = query.filter(Incident.created_at <= date_to)

    return query.order_by(Incident.created_at.desc()).all()

@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    inc_in: IncidentCreate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Log a new scam incident. Automatically checks for high risk and creates
    qualifying Family Alerts for primary verified contacts.
    """
    incident_id_str = f"SA-{random.randint(100000, 999999)}"
    now = datetime.now(timezone.utc)

    incident = Incident(
        incident_id=incident_id_str,
        user_id=current_user_id,
        analysis_id=inc_in.analysis_id,
        title=inc_in.title,
        scam_type=inc_in.scam_type,
        description=inc_in.description,
        financial_loss=inc_in.financial_loss,
        currency=inc_in.currency,
        bank_name=inc_in.bank_name,
        transaction_ref=inc_in.transaction_ref,
        suspect_contact=inc_in.suspect_contact,
        severity=inc_in.severity,
        risk_level=inc_in.risk_level,
        status="UNDER_REVIEW",
        is_seed_data=False,
        incident_date=now
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Automatic alert creation when a qualifying high-risk incident is detected
    if inc_in.risk_level in ("HIGH", "CRITICAL") or inc_in.severity == "HIGH_RISK":
        primary_contacts = db.query(TrustedContact).filter(
            TrustedContact.user_id == current_user_id,
            TrustedContact.is_active == True,
            TrustedContact.consent_granted == True
        ).all()

        for contact in primary_contacts:
            # Check alert threshold
            if contact.alert_level == "CRITICAL_ONLY" and inc_in.risk_level != "CRITICAL":
                continue

            # Safe deduplication
            existing = db.query(FamilyAlert).filter(
                FamilyAlert.incident_id == incident.incident_id,
                FamilyAlert.contact_id == contact.id
            ).first()
            if existing:
                continue

            alert = FamilyAlert(
                incident_id=incident.incident_id,
                analysis_id=inc_in.analysis_id,
                contact_id=contact.id,
                user_id=current_user_id,
                threat_title=f"High-Risk Incident Alert: {incident.title}",
                message_content=(
                    f"Satark Saathi Alert: High-risk incident ({incident.scam_type}) detected. "
                    f"Reported amount at risk: ₹{incident.financial_loss:,.2f}. Reason: {incident.description[:100]}... "
                    f"Recommended Action: Call family member immediately."
                ),
                risk_level=inc_in.risk_level,
                recommended_action="Call family member immediately to check their safety and prevent fund transfer.",
                delivery_channel="IN_APP_SIMULATION",
                status="DELIVERED",
                delivered_at=now
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)

            # Broadcast live notification strictly to authorized user sessions
            try:
                target_uids = {incident.user_id}
                matched_user = db.query(UserProfile).filter(
                    (UserProfile.phone_number == contact.phone_number) |
                    ((UserProfile.email.isnot(None)) & (UserProfile.email == contact.email))
                ).first()
                if matched_user:
                    target_uids.add(matched_user.id)

                await alert_broadcaster.broadcast_alert({
                    "type": "FAMILY_ALERT_NOTIFICATION",
                    "alert_id": alert.id,
                    "incident_id": incident.incident_id,
                    "threat_title": alert.threat_title,
                    "risk_level": alert.risk_level,
                    "message_content": alert.message_content,
                    "recommended_action": alert.recommended_action,
                    "contact_id": alert.contact_id,
                    "delivered_at": alert.delivered_at.isoformat() if alert.delivered_at else None,
                    "delivery_channel": "IN_APP_SIMULATION",
                    "user_id": alert.user_id
                }, target_user_ids=target_uids)
            except Exception as e:
                logger.warning(f"Notification broadcast failure: {e}")

    # Generate recovery draft safely
    try:
        generate_recovery_draft_legacy(incident.id, current_user_id, db)
    except Exception:
        pass

    db.refresh(incident)

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="INCIDENT_CREATED",
        entity_type="incident",
        entity_id=incident.incident_id,
        description=f"Created incident #{incident.incident_id}: '{incident.title}' (Loss: ₹{incident.financial_loss:,.2f})."
    )
    db.add(audit)
    db.commit()

    return incident

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_detail(
    incident_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get full incident details with ownership verification.
    Accepts either string SA-XXXXXX or numeric ID.
    """
    query = db.query(Incident)
    if incident_id.isdigit():
        query = query.filter(Incident.id == int(incident_id))
    else:
        query = query.filter(Incident.incident_id == incident_id)

    incident = query.first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found")

    # Ownership / guardian relationship authorization check
    authorized_uids = get_authorized_incident_user_ids(current_user_id, db)
    if incident.user_id not in authorized_uids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not have permission to view this incident record."
        )

    return incident

@router.get("/{incident_id}/audit", response_model=List[AuditEventResponse])
def get_incident_audit_events(
    incident_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Returns exportable chronological audit log for this incident.
    """
    # Verify access to the incident first
    get_incident_detail(incident_id, current_user_id, db)

    return db.query(AuditEvent)\
        .filter(AuditEvent.entity_id == incident_id)\
        .order_by(AuditEvent.timestamp.desc())\
        .all()

@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: str,
    inc_update: IncidentUpdate,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update incident status or details with strict owner check.
    """
    query = db.query(Incident)
    if incident_id.isdigit():
        query = query.filter(Incident.id == int(incident_id))
    else:
        query = query.filter(Incident.incident_id == incident_id)

    incident = query.first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot modify incidents belonging to another user."
        )

    update_dict = inc_update.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(incident, key, value)

    incident.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(incident)

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="INCIDENT_UPDATED",
        entity_type="incident",
        entity_id=incident.incident_id,
        description=f"Updated incident #{incident.incident_id} status to '{incident.status}'."
    )
    db.add(audit)
    db.commit()

    return incident

@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(
    incident_id: str,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete incident with ownership verification.
    """
    query = db.query(Incident)
    if incident_id.isdigit():
        query = query.filter(Incident.id == int(incident_id))
    else:
        query = query.filter(Incident.incident_id == incident_id)

    incident = query.first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot delete incidents belonging to another user."
        )

    db.delete(incident)
    db.commit()
    return None
