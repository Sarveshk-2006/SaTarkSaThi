import logging
from typing import List, Optional, Set
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import FamilyAlert, TrustedContact, Incident, AuditEvent, UserProfile
from backend.app.dependencies import get_current_user_id, DEMO_USER_IDS
from backend.app.services.alert_broadcaster import alert_broadcaster
from backend.app.services.sms_service import sms_service
from backend.app.schemas import CreateAlertRequest, FamilyAlertResponse
from backend.app.services.family_guardian import is_eligible_guardian

logger = logging.getLogger("satark_saathi.alerts")

router = APIRouter(prefix="/alerts", tags=["Family Shield Alerts"])


def resolve_alert_recipient_user_ids(db: Session, alert: FamilyAlert) -> Set[int]:
    """
    Resolves all demo user IDs that are authorized to receive WebSocket updates or acknowledge this alert.
    Includes:
    1. The alert owner/creator (alert.user_id)
    2. Any registered demo user whose profile phone/email matches the recipient contact (alert.contact_id)
    """
    authorized_uids: Set[int] = {alert.user_id}
    if alert.contact_id:
        contact = db.query(TrustedContact).filter(TrustedContact.id == alert.contact_id).first()
        if contact:
            matched_user = db.query(UserProfile).filter(
                (UserProfile.phone_number == contact.phone_number) |
                ((UserProfile.email.isnot(None)) & (UserProfile.email == contact.email))
            ).first()
            if matched_user:
                authorized_uids.add(matched_user.id)
    return authorized_uids


def get_authorized_alerts_query(current_user_id: int, db: Session):
    """
    Returns SQLAlchemy query for alerts that the current demo identity is authorized to view.

    Authorization rules:
    - User is authorized to view alerts they own (alert.user_id == current_user_id).
    - User is authorized to view alerts where they are the designated recipient contact
      (matched via the contact's phone_number or email associated with current_user).
    - User CANNOT view another user's private alerts dispatched to other contacts.
    """
    current_user = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    if not current_user:
        return db.query(FamilyAlert).filter(FamilyAlert.user_id == current_user_id)

    recipient_contact_ids = select(TrustedContact.id).filter(
        (TrustedContact.phone_number == current_user.phone_number) |
        ((TrustedContact.email.isnot(None)) & (TrustedContact.email == current_user.email))
    )

    # Discreet safety escalations are hidden from the owner's own list so they cannot be seen by
    # someone watching the owner's screen; the guardian recipient still sees them.
    owner_visible = and_(
        FamilyAlert.user_id == current_user_id,
        or_(FamilyAlert.is_discreet.is_(None), FamilyAlert.is_discreet == False),  # noqa: E712
    )
    return db.query(FamilyAlert).filter(
        or_(
            owner_visible,
            FamilyAlert.contact_id.in_(recipient_contact_ids)
        )
    )


@router.websocket("/ws")
async def websocket_alert_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None)
):
    """
    WebSocket transport for real-time live notification delivery to connected client sessions.
    Supports cryptographic JWT authentication (?token=<jwt>).
    In production mode, token authentication is required.
    In development mode, falls back to demo persona user_id when token is omitted.
    """
    from backend.app.config import settings

    resolved_uid: Optional[int] = None
    if token:
        try:
            from backend.app.services.auth_service import decode_access_token
            payload = decode_access_token(token)
            resolved_uid = int(payload.get("user_id") or payload.get("sub"))
        except Exception:
            await websocket.close(code=4001, reason="Invalid or expired authentication token")
            return
    elif settings.is_production or not settings.allow_demo_header_auth:
        await websocket.close(code=4001, reason="Authentication token required in production")
        return
    else:
        effective_uid = user_id if user_id is not None else 1
        if effective_uid not in DEMO_USER_IDS:
            await websocket.close(code=4003, reason="Invalid demo user ID")
            return
        resolved_uid = effective_uid

    await alert_broadcaster.connect(websocket, resolved_uid)
    try:
        while True:
            # Keep connection open; receive ping or client acknowledge messages
            data = await websocket.receive_text()
            logger.info(f"WebSocket client message received from user {resolved_uid}: {data}")
    except WebSocketDisconnect:
        alert_broadcaster.disconnect(websocket, resolved_uid)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        alert_broadcaster.disconnect(websocket, resolved_uid)


@router.get("", response_model=List[FamilyAlertResponse])
def get_alerts(
    user_id: Optional[int] = Query(None, description="Optional filter, strictly constrained by user authorization"),
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get audit trail of family safety alerts for the current authenticated demo session.
    Returns only alerts that the current demo identity is authorized to view (as creator or recipient).
    Cannot be bypassed by query parameters or identifier manipulation.
    """
    query = get_authorized_alerts_query(current_user_id, db)
    if user_id is not None:
        query = query.filter(FamilyAlert.user_id == user_id)
    return query.order_by(FamilyAlert.delivered_at.desc()).all()

@router.post("/dispatch", response_model=List[FamilyAlertResponse], status_code=status.HTTP_201_CREATED)
async def dispatch_alert(
    req: CreateAlertRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Dispatches alerts to selected Family Shield contacts with consent and threshold verification.
    Broadcasts live WebSockets strictly to authorized recipient connections.
    """
    # Cross-user incident ownership check: cannot dispatch alerts for another user's incident
    if req.incident_id:
        incident_record = db.query(Incident).filter(Incident.incident_id == req.incident_id).first()
        if incident_record:
            if incident_record.user_id != current_user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access forbidden: You cannot dispatch alerts for an incident owned by another user."
                )
        else:
            # Auto-persist incident record for current user to guarantee authoritative persistence
            incident_record = Incident(
                incident_id=req.incident_id,
                user_id=current_user_id,
                title=req.threat_title,
                scam_type="Suspicious Threat",
                description=req.message_content,
                financial_loss=0.0,
                status="UNDER_REVIEW",
                severity=req.risk_level or "HIGH",
                risk_level=req.risk_level or "HIGH",
                risk_score=85.0 if (req.risk_level or "HIGH") in ("HIGH", "CRITICAL") else 50.0,
                is_seed_data=False,
            )
            db.add(incident_record)
            db.commit()
            db.refresh(incident_record)

    created_alerts = []
    now = datetime.now(timezone.utc)
    incident_id_str = req.incident_id or f"SA-{int(now.timestamp())}"

    for c_id in req.contact_ids:
        contact = db.query(TrustedContact).filter(
            TrustedContact.id == c_id,
            TrustedContact.user_id == current_user_id
        ).first()
        if not contact:
            continue

        # Two-sided consent: owner granted it AND the contact accepted the invitation
        if not is_eligible_guardian(contact):
            logger.info(f"Skipping contact #{contact.id}: owner consent and contact acceptance are both required.")
            continue

        # Check configurable threshold
        if contact.alert_level == "CRITICAL_ONLY" and req.risk_level != "CRITICAL":
            logger.info(f"Skipping contact {contact.name}: Alert risk {req.risk_level} below CRITICAL threshold.")
            continue

        # Deduplication check: Do not dispatch duplicate alert for same incident & contact within 10 minutes
        existing_alert = db.query(FamilyAlert).filter(
            FamilyAlert.incident_id == incident_id_str,
            FamilyAlert.contact_id == contact.id,
            FamilyAlert.status.in_(["SENT", "DELIVERED", "ACKNOWLEDGED"])
        ).first()
        if existing_alert:
            logger.info(f"Deduplicating alert for contact {contact.name} on incident {incident_id_str}.")
            created_alerts.append(existing_alert)
            continue

        # Dispatch carrier SMS alert
        sms_dispatch = await sms_service.send_emergency_alert(
            contact_name=contact.name,
            phone_number=contact.phone_number,
            threat_title=req.threat_title,
            risk_level=req.risk_level,
            incident_id=incident_id_str
        )
        channel_name = "SMS_GATEWAY" if not sms_dispatch.get("is_simulated") else "SMS_SIMULATION"

        alert = FamilyAlert(
            incident_id=incident_id_str,
            analysis_id=req.analysis_id,
            contact_id=contact.id,
            user_id=current_user_id,
            threat_title=req.threat_title,
            message_content=req.message_content,
            risk_level=req.risk_level,
            recommended_action=req.recommended_action or "Call family member immediately to verify identity and safety.",
            delivery_channel=channel_name,
            status="DELIVERED",
            is_seed_data=False,
            delivered_at=now
        )
        db.add(alert)
        created_alerts.append(alert)

    db.commit()

    for alert in created_alerts:
        db.refresh(alert)
        audit = AuditEvent(
            user_id=current_user_id,
            event_type="ALERT_DISPATCHED",
            entity_type="alert",
            entity_id=str(alert.id),
            description=f"Family alert dispatched for incident {alert.incident_id} to contact #{alert.contact_id} via {alert.delivery_channel}."
        )
        db.add(audit)

        # Broadcast live push over WebSockets strictly to authorized user channels
        try:
            target_users = resolve_alert_recipient_user_ids(db, alert)
            await alert_broadcaster.broadcast_alert({
                "type": "FAMILY_ALERT_NOTIFICATION",
                "alert_id": alert.id,
                "incident_id": alert.incident_id,
                "threat_title": alert.threat_title,
                "risk_level": alert.risk_level,
                "message_content": alert.message_content,
                "recommended_action": alert.recommended_action,
                "contact_id": alert.contact_id,
                "delivered_at": alert.delivered_at.isoformat() if alert.delivered_at else None,
                "delivery_channel": alert.delivery_channel,
                "user_id": alert.user_id
            }, target_user_ids=target_users)
        except Exception as e:
            logger.warning(f"Live broadcast notification failure (does not affect incident): {e}")

    db.commit()
    return created_alerts

@router.get("/carrier-logs")
def get_carrier_sms_logs():
    """
    Returns recent carrier SMS dispatches with DLT template ID, carrier tracking ref, and delivery status.
    """
    return {
        "status": "online",
        "dlt_registered_sender": sms_service.DLT_SENDER_ID,
        "dlt_template_id": sms_service.DLT_TEMPLATE_ID,
        "active_provider": sms_service.provider,
        "recent_dispatches": sms_service.get_recent_dispatches()
    }

@router.post("/{alert_id}/acknowledge", response_model=FamilyAlertResponse)
def acknowledge_alert(
    alert_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Mark an active family alert as acknowledged by the authorized family guardian or alert owner.
    """
    alert = db.query(FamilyAlert).filter(FamilyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found")

    # Authorization check: only alert owner or designated recipient contact may acknowledge
    authorized_uids = resolve_alert_recipient_user_ids(db, alert)
    if current_user_id not in authorized_uids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not authorized to acknowledge this alert."
        )

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.now(timezone.utc)
    current_user = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    alert.acknowledged_by = current_user.full_name if current_user else f"User {current_user_id}"
    db.commit()
    db.refresh(alert)

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="ALERT_ACKNOWLEDGED",
        entity_type="alert",
        entity_id=str(alert.id),
        description=f"Family alert #{alert.id} for incident {alert.incident_id} acknowledged by {alert.acknowledged_by}."
    )
    db.add(audit)
    db.commit()

    return alert

@router.post("/{alert_id}/retry", response_model=FamilyAlertResponse)
async def retry_alert(
    alert_id: int,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Retry dispatching a previously failed or pending alert.
    Only the alert owner/creator is authorized to retry.
    """
    alert = db.query(FamilyAlert).filter(FamilyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found")

    # Authorization check: only the creator of the alert can retry it
    if alert.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Only the alert owner may retry delivery."
        )

    alert.retry_count += 1
    alert.status = "DELIVERED"
    alert.failure_reason = None
    alert.delivered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    # Broadcast live update strictly to authorized users
    try:
        target_users = resolve_alert_recipient_user_ids(db, alert)
        if alert.is_discreet:
            target_users.discard(alert.user_id)
        await alert_broadcaster.broadcast_alert({
            "type": "FAMILY_ALERT_RETRY",
            "alert_id": alert.id,
            "incident_id": alert.incident_id,
            "threat_title": alert.threat_title,
            "risk_level": alert.risk_level,
            "message_content": alert.message_content,
            "recommended_action": alert.recommended_action,
            "retry_count": alert.retry_count,
            "user_id": alert.user_id
        }, target_user_ids=target_users)
    except Exception as e:
        logger.warning(f"Broadcast failure on retry: {e}")

    audit = AuditEvent(
        user_id=current_user_id,
        event_type="ALERT_RETRIED",
        entity_type="alert",
        entity_id=str(alert.id),
        description=f"Retried delivery for alert #{alert.id} (attempt {alert.retry_count})."
    )
    db.add(audit)
    db.commit()

    return alert
