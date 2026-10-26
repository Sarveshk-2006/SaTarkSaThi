import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from backend.app.config import settings
from backend.app.database import init_db
from backend.app.routers import (
    health,
    auth,
    scanner,
    contacts,
    alerts,
    payment,
    recovery,
    incidents,
    stats,
    settings as settings_router,
    analyze_v1,
    evaluation,
    guardian,
    safety,
    sdk,
    integrations,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("satark_saathi")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Satark Saathi database and services...")
    init_db(seed_if_empty=True)
    logger.info("Satark Saathi backend initialized successfully.")
    yield
    logger.info("Satark Saathi backend shutting down.")

app = FastAPI(
    title=settings.app_name,
    description="AI-assisted digital scam prevention and family protection platform for Indian families.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS: use the configured origin list from settings.cors_origin_list.
# Set CORS_ORIGINS in .env to a comma-separated list of allowed origins.
# The wildcard "*" is intentionally NOT used; add your frontend URL to .env.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Validation Error Handler for consistent frontend consumption
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error.get("loc", []))
        errors.append({
            "field": field,
            "message": error.get("msg", "Invalid input")
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "error_code": "VALIDATION_FAILED",
            "message": "Input validation failed. Please check the submitted fields.",
            "details": errors
        }
    )

# Safe Unhandled Exception Handler: prevents stack trace and secret leakage
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An internal error occurred while processing the request. Details logged safely."
        }
    )

# Include API Routers under /api
api_prefix = "/api"
app.include_router(health.router, prefix=api_prefix)
app.include_router(auth.router, prefix=api_prefix)
app.include_router(scanner.router, prefix=api_prefix)
app.include_router(contacts.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(payment.router, prefix=api_prefix)
app.include_router(recovery.router, prefix=api_prefix)
app.include_router(incidents.router, prefix=api_prefix)
app.include_router(stats.router, prefix=api_prefix)
app.include_router(settings_router.router, prefix=api_prefix)
app.include_router(analyze_v1.router, prefix=api_prefix)
app.include_router(evaluation.router, prefix=api_prefix)
app.include_router(guardian.router, prefix=api_prefix)
app.include_router(safety.router, prefix=api_prefix)
app.include_router(sdk.router, prefix=api_prefix)
app.include_router(integrations.router, prefix=api_prefix)

from backend.app.services.alert_broadcaster import alert_broadcaster
from fastapi import WebSocket, WebSocketDisconnect, Query
from typing import Optional

# DEMO IDENTITY BOUNDARY — fallback for dev/demo only.
DEMO_USER_IDS = {1, 2}

@app.websocket("/api/ws/alerts")
async def websocket_alerts_alias(
    websocket: WebSocket,
    token: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None)
):
    """
    WebSocket transport for real-time live notification delivery.
    Supports cryptographic JWT authentication (?token=<jwt>).
    In production, token authentication is strictly required.
    In development mode, falls back to demo persona user_id if token is omitted.
    """
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
            await websocket.receive_text()
    except WebSocketDisconnect:
        alert_broadcaster.disconnect(websocket, resolved_uid)
    except Exception:
        alert_broadcaster.disconnect(websocket, resolved_uid)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi import HTTPException

FRONTEND_DIST_DIR = os.path.abspath(
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
)
ASSETS_DIR = os.path.join(FRONTEND_DIST_DIR, "assets")
if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")

@app.get("/")
def root(request: Request):
    accept = request.headers.get("accept", "")
    index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_file) and "application/json" not in accept:
        return FileResponse(index_file)
    return {
        "message": "Welcome to Satark Saathi API - Family Scam Prevention Platform",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

@app.get("/{full_path:path}")
def serve_spa_page(full_path: str, request: Request):
    if full_path.startswith("api") or full_path.startswith("docs") or full_path == "openapi.json":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not Found")

    direct_file = os.path.join(FRONTEND_DIST_DIR, full_path)
    if os.path.isfile(direct_file):
        return FileResponse(direct_file)

    index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.host, port=settings.port, reload=True)
