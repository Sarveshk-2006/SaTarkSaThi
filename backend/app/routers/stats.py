from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from backend.app.database import get_db
from backend.app.dependencies import get_current_user_id
from backend.app.models import ScamAnalysis, FamilyAlert, TrustedContact, Incident
from backend.app.schemas import OverviewStatsResponse

router = APIRouter(prefix="/stats", tags=["Statistics & Overview"])

@router.get("/overview", response_model=OverviewStatsResponse)
def get_overview_stats(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Computes real summary metrics derived solely from stored records for the authenticated user.
    Does not invent fabricated threat counts.
    """
    total_analyses = db.query(ScamAnalysis).filter(ScamAnalysis.user_id == current_user_id).count()
    high_risk_analyses = db.query(ScamAnalysis).filter(
        ScamAnalysis.user_id == current_user_id,
        ScamAnalysis.severity == "HIGH_RISK"
    ).count()
    caution_analyses = db.query(ScamAnalysis).filter(
        ScamAnalysis.user_id == current_user_id,
        ScamAnalysis.severity == "CAUTION"
    ).count()
    safe_analyses = db.query(ScamAnalysis).filter(
        ScamAnalysis.user_id == current_user_id,
        ScamAnalysis.severity == "SAFE"
    ).count()

    total_family_alerts = db.query(FamilyAlert).filter(
        FamilyAlert.user_id == current_user_id,
        or_(FamilyAlert.is_discreet.is_(None), FamilyAlert.is_discreet == False),  # noqa: E712
    ).count()
    active_trusted_contacts = db.query(TrustedContact).filter(
        TrustedContact.user_id == current_user_id,
        TrustedContact.is_active == True
    ).count()

    total_incidents = db.query(Incident).filter(Incident.user_id == current_user_id).count()
    recovery_cases_created = db.query(Incident).filter(
        Incident.user_id == current_user_id,
        Incident.financial_loss > 0
    ).count()

    total_loss_recorded = db.query(
        func.coalesce(func.sum(Incident.financial_loss), 0.0)
    ).filter(Incident.user_id == current_user_id).scalar()

    recent_incidents = db.query(Incident).filter(
        Incident.user_id == current_user_id
    ).order_by(Incident.created_at.desc()).limit(5).all()

    recent_analyses = db.query(ScamAnalysis).filter(
        ScamAnalysis.user_id == current_user_id
    ).order_by(ScamAnalysis.created_at.desc()).limit(5).all()

    return OverviewStatsResponse(
        total_analyses=total_analyses,
        high_risk_analyses=high_risk_analyses,
        caution_analyses=caution_analyses,
        safe_analyses=safe_analyses,
        total_family_alerts=total_family_alerts,
        active_trusted_contacts=active_trusted_contacts,
        total_incidents=total_incidents,
        recovery_cases_created=recovery_cases_created,
        total_loss_recorded=float(total_loss_recorded),
        recent_incidents=recent_incidents,
        recent_analyses=recent_analyses
    )
