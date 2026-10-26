"""
Honest integration status. Reports what is actually wired up, what is simulated, and what is
not integrated, so the UI and presenters never over-claim IBM or banking capabilities.
"""

import logging
from typing import Dict, List

import httpx
from fastapi import APIRouter, Depends

from backend.app.config import settings
from backend.app.dependencies import get_current_user_id, require_admin

logger = logging.getLogger("satark_saathi.integrations")

router = APIRouter(prefix="/integrations", tags=["Integration Status"])

IBM_IAM_URL = "https://iam.cloud.ibm.com/identity/token"


def integration_statuses() -> List[Dict]:
    watsonx_active = settings.analysis_provider == "watsonx" and settings.watsonx_configured
    bob_active = settings.analysis_provider == "bob" and settings.bob_configured
    return [
        {
            "id": "ibm_bob",
            "name": "IBM Bob (runtime inference)",
            "status": "CONFIGURED_UNVERIFIED" if settings.bob_configured else "NOT_CONFIGURED",
            "active_for_scanner": bob_active,
            "detail": (
                f"Requests go to the configured BOB_API_ENDPOINT using format '{settings.bob_api_format}' and model "
                f"'{settings.bob_model_id}'. Not verified until POST /api/integrations/bob/verify succeeds."
                if settings.bob_configured else
                "No BOB_API_KEY/BOB_API_ENDPOINT/BOB_MODEL_ID configured. Scanner uses the local rule engine."
            ),
            "used_by": ["Scam Analyzer text/OCR/transcript enrichment (only when ANALYSIS_PROVIDER=bob)"],
        },
        {
            "id": "whatsapp_cloud_api",
            "name": "WhatsApp Cloud API webhook",
            "status": "CONFIGURED_UNVERIFIED" if settings.whatsapp_configured else "BLOCKED_BY_EXTERNAL_CONFIGURATION",
            "active_for_scanner": False,
            "detail": (
                "Webhook at /api/whatsapp/webhook verifies Meta signatures. Live delivery requires an approved "
                "WhatsApp Business account; test numbers are sandbox only."
            ),
            "used_by": ["WhatsApp message check bot"],
        },
        {
            "id": "ibm_watsonx_ai",
            "name": "IBM watsonx.ai (Granite text generation)",
            "status": "CONFIGURED_UNVERIFIED" if settings.watsonx_configured else "NOT_CONFIGURED",
            "active_for_scanner": watsonx_active,
            "detail": (
                f"Client calls {settings.watsonx_url}/ml/v1/text/generation with model '{settings.watsonx_model_id}'. "
                "Credentials are present but a live call has not been verified by this endpoint; use POST /api/integrations/watsonx/verify."
                if settings.watsonx_configured else
                "No WATSONX_APIKEY/WATSONX_PROJECT_ID configured. All analysis uses the local deterministic rule engine."
            ),
            "used_by": ["Scam Analyzer text analysis (only when ANALYSIS_PROVIDER=watsonx)"],
        },
        {
            "id": "ibm_watsonx_orchestrate",
            "name": "IBM watsonx Orchestrate",
            "status": "NOT_INTEGRATED",
            "active_for_scanner": False,
            "detail": "No Orchestrate agent, skill or API call exists in this codebase.",
            "used_by": [],
        },
        {
            "id": "ibm_granite_guardian",
            "name": "IBM Granite Guardian",
            "status": "NOT_INTEGRATED",
            "active_for_scanner": False,
            "detail": (
                "Not called anywhere. IBM's foundation-model lifecycle page lists granite-guardian-3-8b on multitenant "
                "watsonx.ai as withdrawn on 8 August 2026, so any future use must be re-validated against current IBM docs."
            ),
            "used_by": [],
        },
        {
            "id": "ibm_safer_payments",
            "name": "IBM Safer Payments",
            "status": "NOT_INTEGRATED",
            "active_for_scanner": False,
            "detail": (
                "Not integrated. Transaction risk uses Satark's local, explainable rules over a mock ledger; "
                "it is not an IBM Safer Payments model or simulation of one."
            ),
            "used_by": [],
        },
        {
            "id": "upi_and_banks",
            "name": "UPI apps / banks / NPCI",
            "status": "SIMULATED",
            "active_for_scanner": False,
            "detail": "The mock UPI app and SDK boundary are prototypes. No PhonePe, Google Pay, Paytm, BHIM, bank or NPCI integration exists.",
            "used_by": ["Mock UPI app", "Payment Checkpoint sandbox", "Golden Hour bank-freeze rehearsal"],
        },
        {
            "id": "sms_gateway",
            "name": "SMS / WhatsApp delivery",
            "status": "SIMULATED" if settings.sms_provider == "simulated" else "CONFIGURED_UNVERIFIED",
            "active_for_scanner": False,
            "detail": f"SMS provider setting: '{settings.sms_provider}'. Family alerts are delivered in-app over WebSockets.",
            "used_by": ["Family Shield alerts", "Contact invitations"],
        },
    ]


@router.get("/status")
def get_integration_status():
    if settings.analysis_provider == "bob" and settings.bob_configured:
        engine = "IBM Bob enrichment over the local rule engine (rule-engine fallback)"
    elif settings.analysis_provider == "watsonx" and settings.watsonx_configured:
        engine = "IBM watsonx.ai (with automatic rule-engine fallback)"
    else:
        engine = "Satark deterministic rule engine (local)"
    return {
        "analysis_engine": engine,
        "integrations": integration_statuses(),
    }


@router.post("/bob/verify")
async def verify_bob(current_user_id: int = Depends(require_admin)):
    """Sends a minimal non-sensitive inference request. Never returns credentials."""
    from backend.app.services.bob_analyzer import verify_bob_connection
    result = await verify_bob_connection()
    logger.info(f"Bob verification by admin {current_user_id}: {result['status']} ({result['latency_ms']} ms)")
    return result


@router.post("/watsonx/verify")
async def verify_watsonx(current_user_id: int = Depends(require_admin)):
    """
    Performs a real IAM token exchange and a 1-token generation call when credentials exist.
    Never returns credentials or tokens.
    """
    if not settings.watsonx_configured:
        return {"status": "NOT_CONFIGURED", "iam_ok": False, "generation_ok": False,
                "detail": "Set WATSONX_APIKEY and WATSONX_PROJECT_ID to verify a live connection."}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            iam = await client.post(
                IBM_IAM_URL,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": settings.watsonx_apikey},
            )
            if iam.status_code != 200:
                return {"status": "AUTHENTICATION_FAILED" if iam.status_code in (400, 401, 403) else "FAILED",
                        "iam_ok": False, "generation_ok": False,
                        "detail": f"IAM token exchange returned HTTP {iam.status_code}."}
            token = iam.json().get("access_token")
            gen = await client.post(
                f"{settings.watsonx_url}/ml/v1/text/generation?version=2024-05-31",
                headers={"Authorization": "Bearer " + str(token), "Content-Type": "application/json", "Accept": "application/json"},
                json={
                    "model_id": settings.watsonx_model_id,
                    "project_id": settings.watsonx_project_id,
                    "input": "Reply with OK.",
                    "parameters": {"max_new_tokens": 1},
                },
            )
            ok = gen.status_code == 200
            if ok:
                status_cat = "VERIFIED"
            elif gen.status_code in (401, 403):
                status_cat = "AUTHENTICATION_FAILED"
            elif gen.status_code == 429:
                status_cat = "RATE_LIMITED"
            elif gen.status_code >= 500:
                status_cat = "PROVIDER_UNAVAILABLE"
            else:
                status_cat = "FAILED"
            return {
                "status": status_cat,
                "iam_ok": True,
                "generation_ok": ok,
                "model_id": settings.watsonx_model_id,
                "detail": "Live text generation succeeded." if ok else f"Text generation returned HTTP {gen.status_code}.",
            }
    except httpx.HTTPError as e:
        logger.warning(f"watsonx verification failed: {type(e).__name__}")
        return {"status": "FAILED", "iam_ok": False, "generation_ok": False,
                "detail": f"Network error contacting IBM Cloud ({type(e).__name__})."}
