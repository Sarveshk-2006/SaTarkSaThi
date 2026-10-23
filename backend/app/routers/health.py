from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database import get_db
from backend.app.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
def check_health(db: Session = Depends(get_db)):
    """
    Service health check verifying backend, database, and analysis engine readiness.

    `watsonx_configured` is True only when WATSONX_APIKEY **and** WATSONX_PROJECT_ID
    are both non-empty in the environment configuration. A missing or empty API key
    never produces a truthy value here — the health endpoint cannot mislead the
    presenter into claiming that IBM inference is active.
    """
    db_status = "unhealthy"
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    is_healthy = db_status == "healthy"

    # Honest provider description
    watsonx_configured = settings.watsonx_configured
    if settings.analysis_provider == "watsonx" and watsonx_configured:
        analysis_engine = "IBM watsonx.ai Granite (configured)"
    else:
        analysis_engine = "Satark Rule Engine (IBM watsonx.ai ready — credentials not configured)"

    return {
        "status": "online" if is_healthy else "degraded",
        "app_name": settings.app_name,
        "environment": settings.app_env,
        "database": db_status,
        "analysis_provider": settings.analysis_provider,
        "analysis_engine": analysis_engine,
        "watsonx_configured": watsonx_configured,
        "version": "1.0.0",
    }
