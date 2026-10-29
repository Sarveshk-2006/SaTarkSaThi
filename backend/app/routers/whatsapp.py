"""
WhatsApp Cloud API (Meta) webhook for a "forward a suspicious message, get a risk check" bot.

Security and privacy:
  * GET verification uses WHATSAPP_VERIFY_TOKEN (Meta's hub.challenge handshake).
  * POST payloads must carry a valid X-Hub-Signature-256 HMAC computed with WHATSAPP_APP_SECRET.
  * Message IDs are de-duplicated so Meta retries never produce duplicate replies.
  * A phone number is NOT treated as proof of a Satark account; forwarded messages are analysed
    anonymously and are not stored or linked to any user record.
  * Live replies need an approved WhatsApp Business account + WHATSAPP_ACCESS_TOKEN and
    WHATSAPP_PHONE_NUMBER_ID; otherwise the integration reports BLOCKED_BY_EXTERNAL_CONFIGURATION.
"""

import hashlib
import hmac
import json
import logging
import threading
from collections import OrderedDict

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from backend.app.config import settings
from backend.app.dependencies import get_current_user_id
from backend.app.services.factory import get_analyzer_service

logger = logging.getLogger("satark_saathi.whatsapp")
router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Bot"])

_seen_ids: "OrderedDict[str, bool]" = OrderedDict()
_seen_lock = threading.Lock()
_MAX_SEEN = 5000

RISK_EMOJI = {"LOW": "🟢", "MEDIUM": "🟡", "HIGH": "🔴", "CRITICAL": "🔴"}


def _already_processed(message_id: str) -> bool:
    with _seen_lock:
        if message_id in _seen_ids:
            return True
        _seen_ids[message_id] = True
        if len(_seen_ids) > _MAX_SEEN:
            _seen_ids.popitem(last=False)
        return False


def verify_signature(raw_body: bytes, signature_header: str) -> bool:
    if not settings.whatsapp_app_secret or not signature_header or not signature_header.startswith("sha256="):
        return False
    expected = hmac.new(settings.whatsapp_app_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature_header.split("=", 1)[1])


async def build_reply(text: str) -> str:
    result = await get_analyzer_service().analyze_text(text[:4000], "WHATSAPP")
    level = result.risk_level.value if hasattr(result.risk_level, "value") else str(result.risk_level)
    lines = [
        f"{RISK_EMOJI.get(level, '⚪')} Satark Saathi check: {level} risk",
        f"{result.verdict}",
    ]
    signals = [s.reason for s in result.detected_signals[:3]]
    if signals:
        lines.append("Why: " + "; ".join(signals))
    actions = result.recommended_actions[:2] or ([result.recommended_action] if result.recommended_action else [])
    if actions:
        lines.append("Do now: " + " ".join(f"• {a}" for a in actions))
    if level in ("HIGH", "CRITICAL"):
        lines.append("If money was sent, call 1930 immediately or visit cybercrime.gov.in.")
    lines.append("A low-risk result is not proof of safety. Never share OTP/PIN.")
    return "\n".join(lines)[:4000]


async def _send_whatsapp_text(to: str, body: str):
    if not (settings.whatsapp_access_token and settings.whatsapp_phone_number_id):
        logger.info("WhatsApp reply not sent: access token / phone number ID not configured.")
        return
    url = (f"https://graph.facebook.com/{settings.whatsapp_graph_version}/"
           f"{settings.whatsapp_phone_number_id}/messages")
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                url,
                headers={"Authorization": "Bearer " + str(settings.whatsapp_access_token),
                         "Content-Type": "application/json"},
                json={"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": body}},
            )
            if resp.status_code >= 300:
                logger.warning(f"WhatsApp send failed with HTTP {resp.status_code}")
    except httpx.HTTPError as e:
        logger.warning(f"WhatsApp send network error: {type(e).__name__}")


async def _process_message(sender: str, text: str):
    reply = await build_reply(text)
    await _send_whatsapp_text(sender, reply)


@router.get("/webhook")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    if not settings.whatsapp_verify_token:
        raise HTTPException(status_code=503, detail="WhatsApp webhook is not configured on this server.")
    if hub_mode == "subscribe" and hub_verify_token and hmac.compare_digest(hub_verify_token, settings.whatsapp_verify_token):
        return PlainTextResponse(hub_challenge or "")
    raise HTTPException(status_code=403, detail="Webhook verification failed.")


@router.post("/webhook")
async def receive_webhook(request: Request, background: BackgroundTasks):
    if not settings.whatsapp_configured:
        raise HTTPException(status_code=503, detail="WhatsApp webhook is not configured on this server.")
    raw = await request.body()
    if len(raw) > 256 * 1024:
        raise HTTPException(status_code=413, detail="Payload too large.")
    if not verify_signature(raw, request.headers.get("X-Hub-Signature-256", "")):
        raise HTTPException(status_code=401, detail="Invalid webhook signature.")
    try:
        payload = json.loads(raw)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid JSON.")

    queued = 0
    for entry in payload.get("entry", []) or []:
        for change in entry.get("changes", []) or []:
            for msg in (change.get("value", {}) or {}).get("messages", []) or []:
                msg_id, sender = msg.get("id"), msg.get("from")
                if not msg_id or not sender or _already_processed(msg_id):
                    continue
                if msg.get("type") == "text":
                    body = ((msg.get("text") or {}).get("body") or "").strip()
                    if len(body) >= 5:
                        background.add_task(_process_message, sender, body)
                        queued += 1
                else:
                    background.add_task(_send_whatsapp_text, sender,
                                        "Please forward the suspicious message as text. Images and voice notes "
                                        "can be checked in the Satark Saathi app.")
    # Meta expects a fast 200; processing happens in the background.
    return {"status": "received", "queued": queued}


class SimulateIn(BaseModel):
    text: str = Field(..., min_length=5, max_length=4000)


@router.post("/simulate")
async def simulate_bot_reply(body: SimulateIn, _user: int = Depends(get_current_user_id)):
    """Demo helper: returns the exact reply the bot would send, without contacting WhatsApp."""
    return {"simulated": True, "reply": await build_reply(body.text)}
