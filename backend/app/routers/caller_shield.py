"""
API Router for Satark Saathi Caller Shield.
Incoming Caller Intelligence, Community Reporting, Personal Blocklist,
and IBM watsonx.ai Enrichment Endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models import CallerReputation, CallerReport, CallerBlocklist, CallerLookupAudit
from backend.app.services.caller_intelligence_service import (
    CallerIntelligenceService,
    normalize_phone_number,
)
from backend.app.services.ibm_caller_service import ibm_caller_service
from backend.app.schemas_caller import (
    CallerLookupResponse,
    CallerReportCreate,
    CallerReportResponse,
    CallerFeedbackCreate,
    CallerBlocklistCreate,
    CallerBlocklistResponse,
    CallerStatsResponse,
)

router = APIRouter(
    prefix="/v1/caller-intelligence",
    tags=["Caller Shield - Incoming Caller Intelligence"]
)


@router.get("/lookup", response_model=CallerLookupResponse)
def lookup_caller(
    phone_number: str = Query(..., description="Incoming caller phone number to screen"),
    user_id: Optional[int] = Query(1, description="Citizen user ID to check against personal blocklist"),
    db: Session = Depends(get_db)
):
    """
    Sub-50ms Caller Identification and Risk Assessment Endpoint.
    Used by Android CallScreeningService and Web UI Search.
    Returns caller category, threat score (0-100), carrier verification,
    community report count, personal blocklist decision, and IBM AI summary.
    """
    service = CallerIntelligenceService(db)
    result = service.lookup(phone_number=phone_number, user_id=user_id)
    return result


@router.post("/reports", response_model=CallerReportResponse)
def submit_caller_report(
    payload: CallerReportCreate,
    user_id: Optional[int] = Query(1, description="Citizen user ID submitting the report"),
    db: Session = Depends(get_db)
):
    """
    Submits a community spam or extortion report for a phone number.
    Atomically updates the caller's reputation and threat score.
    """
    service = CallerIntelligenceService(db)
    try:
        res = service.submit_report(
            phone_number=payload.phone_number,
            category=payload.category,
            claimed_caller_name=payload.claimed_caller_name,
            description=payload.description,
            call_type=payload.call_type,
            user_id=user_id,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/reports")
def list_caller_reports(
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Lists recent community spam and fraud reports for moderation and public telemetry.
    """
    query = db.query(CallerReport).order_by(CallerReport.created_at.desc())
    if category:
        query = query.filter(CallerReport.category == category)
    reports = query.limit(limit).all()

    return [
        {
            "id": r.id,
            "normalized_number": r.normalized_number,
            "category": r.category,
            "claimed_caller_name": r.claimed_caller_name,
            "description": r.description,
            "call_type": r.call_type,
            "call_timestamp": r.call_timestamp.isoformat() if r.call_timestamp else None,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


@router.post("/feedback")
def record_call_feedback(
    payload: CallerFeedbackCreate,
    user_id: Optional[int] = Query(1),
    db: Session = Depends(get_db)
):
    """
    Post-call quick feedback prompt.
    Upvotes spam score or downvotes safe caller score based on citizen verification.
    """
    service = CallerIntelligenceService(db)
    res = service.record_feedback(
        phone_number=payload.phone_number,
        is_spam=payload.is_spam,
        user_id=user_id,
    )
    return res


@router.get("/blocklist", response_model=List[CallerBlocklistResponse])
def get_user_blocklist(
    user_id: int = Query(1, description="Citizen user ID"),
    db: Session = Depends(get_db)
):
    """Retrieves personal blocked and trusted numbers for a citizen."""
    service = CallerIntelligenceService(db)
    return service.list_blocklist(user_id=user_id)


@router.post("/blocklist")
def add_to_blocklist(
    payload: CallerBlocklistCreate,
    user_id: int = Query(1, description="Citizen user ID"),
    db: Session = Depends(get_db)
):
    """Adds a phone number to personal blocklist or allowlist."""
    service = CallerIntelligenceService(db)
    try:
        return service.update_blocklist(
            user_id=user_id,
            phone_number=payload.phone_number,
            action=payload.action,
            display_name=payload.display_name,
            reason=payload.reason,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/blocklist")
def remove_from_blocklist(
    phone_number: str = Query(...),
    user_id: int = Query(1),
    db: Session = Depends(get_db)
):
    """Removes a phone number from personal blocklist."""
    service = CallerIntelligenceService(db)
    success = service.remove_from_blocklist(user_id=user_id, phone_number=phone_number)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Number not found in blocklist.")
    return {"status": "success", "message": f"{phone_number} removed from personal blocklist."}


@router.get("/threats")
def list_top_threats(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Returns the most active scam/extortion caller numbers for the UI threat radar."""
    service = CallerIntelligenceService(db)
    return service.list_recent_threats(limit=limit)


@router.get("/stats", response_model=CallerStatsResponse)
def get_caller_shield_stats(db: Session = Depends(get_db)):
    """Summary metrics for the Caller Shield dashboard."""
    total_screened = db.query(CallerReputation).count()
    active_threats = db.query(CallerReputation).filter(CallerReputation.risk_score >= 60).count()
    total_reports = db.query(CallerReport).count()
    total_blocked = db.query(CallerBlocklist).filter(CallerBlocklist.action == "BLOCK").count()
    
    ibm_status = "CONFIGURED" if ibm_caller_service.is_configured() else "FALLBACK_RULE_ENGINE"

    return {
        "total_screened_numbers": total_screened,
        "active_threat_numbers": active_threats,
        "community_reports_count": total_reports,
        "personal_blocked_count": total_blocked,
        "ibm_ai_status": ibm_status,
        "analysis_provider": f"IBM watsonx.ai ({settings.watsonx_model_id})" if ibm_caller_service.is_configured() else "Deterministic Local Rule Engine"
    }


@router.get("/ibm-status")
def get_ibm_caller_status():
    """Inspects IBM watsonx AI provider status and model configuration."""
    is_conf = ibm_caller_service.is_configured()
    return {
        "status": "CONFIGURED_ACTIVE" if is_conf else "LOCAL_FALLBACK_ACTIVE",
        "provider": "IBM watsonx.ai" if is_conf else "Local Rule Engine",
        "model_id": settings.watsonx_model_id if is_conf else "rule_based_v1",
        "base_url": settings.watsonx_url if is_conf else "local",
        "circuit_breaker": "TRIPPED" if ibm_caller_service._circuit_broken else "NOMINAL",
        "active_for_call_screening": True,
        "description": "Granite text generation model for telecom fraud summarization" if is_conf else "Fast deterministic pattern matching engine ensuring sub-second response times."
    }


@router.post("/enrich")
async def enrich_caller_intelligence(
    phone_number: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Manually triggers AI caller enrichment via IBM watsonx.ai.
    Updates the CallerReputation record with the AI-generated summary and signals.
    """
    normalized = normalize_phone_number(phone_number)
    rep = db.query(CallerReputation).filter_by(normalized_number=normalized).first()
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caller number not registered.")

    ai_res = await ibm_caller_service.enrich_caller(
        phone_number=rep.raw_display_number,
        category=rep.category,
        claimed_name=rep.display_tag,
    )

    rep.ibm_summary = ai_res.get("summary")
    rep.recommended_action = ai_res.get("recommended_action")
    db.commit()

    return {
        "normalized_number": normalized,
        "ai_summary": rep.ibm_summary,
        "recommended_action": rep.recommended_action,
        "provider": ai_res.get("provider"),
        "model": ai_res.get("model"),
    }
