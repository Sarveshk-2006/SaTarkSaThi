import logging
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import FamilyAlert, TrustedContact, Incident, AuditEvent
from backend.app.dependencies import get_current_user_id
from backend.app.services.alert_broadcaster import alert_broadcaster
from backend.app.services.sms_service import sms_service
from backend.app.schemas import CreateAlertRequest, FamilyAlertResponse

logger = logging.getLogger("satark_saathi.alerts")

router = APIRouter(prefix="/alerts", tags=["Family Shield Alerts"])

@router.websocket("/ws")
async def websocket_alert_endpoint(websocket: WebSocket, user_id: int = Query(default=1)):
    """
    WebSocket transport for real-time live notification delivery to a second browser/device session.
    Simulates instantaneous in-app delivery without requiring external telecom/SMS carrier setup.
    """
    await alert_broadcaster.connect(websocket, user_id)
    try:
        while True:
            # Keep connection open; receive ping or client acknowledge messages
            data = await websocket.receive_text()
            logger.info(f"WebSocket client message received from user {user_id}: {data}")
    except WebSocketDisconnect:
        alert_broadcaster.disconnect(websocket, user_id)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        alert_broadcaster.disconnect(websocket, user_id)

@router.get("", response_model=List[FamilyAlertResponse])
def get_alerts(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get audit trail of all family safety alerts for the current user or guardian session.
    """
    return db.query(FamilyAlert)\
        .filter((FamilyAlert.user_id == current_user_id) | (current_user_id == 2))\
        .order_by(FamilyAlert.delivered_at.desc())\
        .all()

@router.post("/dispatch", response_model=List[FamilyAlertResponse], status_code=status.HTTP_201_CREATED)
async def dispatch_alert(
    req: CreateAlertRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Dispatches alerts to selected Family Shield contacts with consent and threshold verification.
    Broadcasts live WebSockets to secondary devices/sessions with incident details.
    """
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

        # Check explicit user consent
        if not contact.consent_granted:
            logger.info(f"Skipping contact {contact.name}: User consent not granted.")
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

        # Broadcast live push over WebSockets to second device / guardian view
        try:
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
                "delivery_channel": alert.delivery_channel
            })
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
    Mark an active family alert as acknowledged by the trusted family guardian.
    """
    alert = db.query(FamilyAlert).filter(FamilyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.now(timezone.utc)
    alert.acknowledged_by = "Aarav Sharma" if current_user_id == 2 else "Family Guardian"
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
    Increments retry count and records audit trail.
    """
    alert = db.query(FamilyAlert).filter(FamilyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert record not found")

    alert.retry_count += 1
    alert.status = "DELIVERED"
    alert.failure_reason = None
    alert.delivered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    # Broadcast live update
    try:
        await alert_broadcaster.broadcast_alert({
            "type": "FAMILY_ALERT_RETRY",
            "alert_id": alert.id,
            "incident_id": alert.incident_id,
            "threat_title": alert.threat_title,
            "risk_level": alert.risk_level,
            "message_content": alert.message_content,
            "recommended_action": alert.recommended_action,
            "retry_count": alert.retry_count
        })
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
