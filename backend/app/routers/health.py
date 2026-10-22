from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database import get_db
from backend.app.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
def check_health(db: Session = Depends(get_db)):
    """
    Service health check verifying backend, database, and analysis engine readiness.
    """
    db_status = "unhealthy"
    try:
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"

    is_healthy = db_status == "healthy"
    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "online" if is_healthy else "degraded",
        "app_name": settings.app_name,
        "environment": settings.app_env,
        "database": db_status,
        "analysis_provider": settings.analysis_provider,
        "watsonx_ready": bool((settings.watsonx_apikey and settings.watsonx_project_id) or (settings.watsonx_apikey and "bob" in settings.watsonx_apikey) or getattr(settings, "bob_api_key", "")),
        "version": "1.0.0"
    }
