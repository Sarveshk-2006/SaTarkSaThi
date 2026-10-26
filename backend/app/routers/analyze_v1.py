"""
V1 Analysis API Router.
Implements the unified analysis workspace with four input methods:
  POST /api/v1/analyze       - Text analysis
  POST /api/v1/analyze/url   - URL analysis
  POST /api/v1/analyze/image - Image upload with OCR
  POST /api/v1/analyze/audio - Audio upload with transcript
  GET  /api/v1/health        - Health check
"""

import os
import io
import uuid
import json
import random
import logging
import tempfile
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models import ScamAnalysis, ScamEvidence, Incident, AuditEvent
from backend.app.dependencies import get_current_user_id
from backend.app.services.factory import get_analyzer_service
from backend.app.schemas_v1 import (
    TextAnalyzeRequest,
    URLAnalyzeRequest,
    AnalysisResponse,
    DetectedSignalResponse,
    ImageUploadResponse,
    AudioUploadResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1", tags=["Analysis V1"])

from backend.app.services.ocr_service import ocr_service
from backend.app.services.audio_service import audio_service

# File size limits
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a"}

# Check OCR availability
OCR_AVAILABLE = True  # Native Pillow + Document Pattern Engine always available
TESSERACT_AVAILABLE = ocr_service.is_available()


def _result_to_response(result) -> AnalysisResponse:
    """Convert an AnalysisResult to an API response."""
    detected = [
        DetectedSignalResponse(
            reason_code=getattr(sig, 'reason_code', '') or sig.signal_type,
            signal_type=sig.signal_type,
            severity=sig.severity,
            reason=sig.reason,
            excerpt=sig.excerpt,
            weight=sig.weight,
            category=getattr(sig, 'category', None)
        )
        for sig in getattr(result, 'detected_signals', [])
    ]
    counters = [
        DetectedSignalResponse(
            reason_code=getattr(sig, 'reason_code', '') or sig.signal_type,
            signal_type=sig.signal_type,
            severity=sig.severity,
            reason=sig.reason,
            excerpt=sig.excerpt,
            weight=sig.weight,
            category=getattr(sig, 'category', None)
        )
        for sig in getattr(result, 'counter_signals', [])
    ]
    return AnalysisResponse(
        incident_id=result.incident_id,
        input_type=result.input_type.value if hasattr(result.input_type, 'value') else str(result.input_type),
        risk_level=result.risk_level.value if hasattr(result.risk_level, 'value') else str(result.risk_level),
        risk_score=result.risk_score,
        policy_tier=getattr(result, 'policy_tier', 'GREEN'),
        confidence_label=result.confidence_label.value if hasattr(result.confidence_label, 'value') else str(result.confidence_label),
        verdict=result.verdict,
        plain_language_summary=result.plain_language_summary,
        detected_signals=detected,
        counter_signals=counters,
        reason_codes=getattr(result, 'reason_codes', []),
        supporting_evidence=result.supporting_evidence,
        recommended_actions=result.recommended_actions,
        recommended_action=getattr(result, 'recommended_action', None) or (result.recommended_actions[0] if result.recommended_actions else None),
        verification_steps=result.verification_steps,
        should_alert_family=result.should_alert_family,
        ai_provider=result.ai_provider,
        analysis_mode=result.analysis_mode.value if hasattr(result.analysis_mode, 'value') else str(result.analysis_mode),
        limitations=result.limitations,
        # Legacy fields
        classification=result.classification,
        severity=result.severity,
        summary=result.summary,
        advice=result.advice,
        suggested_action=result.suggested_action,
        is_flagged_for_family=result.is_flagged_for_family,
        evidence_items=result.evidence_items,
    )


def _persist_analysis(result, input_text: str, channel: str, user_id: int, db: Session) -> int:
    """
    Persist analysis result and evidence to the database.
    For qualifying threats (RED tier, high/critical risk, or acute coercion),
    also creates or links an authoritative Incident record with stable SA-XXXXXX identifier.
    Returns the DB record id.
    """
    try:
        tier = getattr(result, "policy_tier", "GREEN")
        risk_level_str = str(getattr(result.risk_level, "value", result.risk_level)).upper()
        is_qualifying = (
            tier == "RED"
            or risk_level_str in ("HIGH", "CRITICAL")
            or getattr(result, "should_alert_family", False)
        )

        authoritative_incident_id = None
        linked_incident = None

        if is_qualifying:
            # Deduplication check: check if a recent incident (< 15 mins) by this user matches this input
            recent_cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
            existing_incident = db.query(Incident).filter(
                Incident.user_id == user_id,
                Incident.description == input_text[:5000],
                Incident.created_at >= recent_cutoff
            ).first()

            if existing_incident:
                linked_incident = existing_incident
                authoritative_incident_id = existing_incident.incident_id
            else:
                authoritative_incident_id = f"SA-{random.randint(100000, 999999)}"
                while db.query(Incident).filter(Incident.incident_id == authoritative_incident_id).first():
                    authoritative_incident_id = f"SA-{random.randint(100000, 999999)}"

        db_analysis = ScamAnalysis(
            incident_id=authoritative_incident_id,
            user_id=user_id,
            input_text=input_text[:5000],  # Limit stored text
            channel=channel,
            classification=result.classification or result.verdict,
            risk_score=result.risk_score,
            severity=result.severity,
            risk_level=result.risk_level.value if hasattr(result.risk_level, 'value') else str(result.risk_level),
            summary=result.summary or result.plain_language_summary,
            advice=result.advice,
            suggested_action=result.suggested_action,
            is_flagged_for_family=result.is_flagged_for_family,
            is_seed_data=False
        )
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)

        for item in result.evidence_items:
            evidence = ScamEvidence(
                analysis_id=db_analysis.id,
                factor_type=item.get("factor_type", "GENERAL"),
                severity=item.get("severity", "MEDIUM"),
                description=item.get("description", ""),
                matched_text=item.get("matched_text", "")[:255]
            )
            db.add(evidence)

        if is_qualifying:
            if not linked_incident:
                signals_data = [
                    s.model_dump() if hasattr(s, "model_dump") else (s.dict() if hasattr(s, "dict") else s)
                    for s in result.detected_signals
                ]
                counter_data = [
                    s.model_dump() if hasattr(s, "model_dump") else (s.dict() if hasattr(s, "dict") else s)
                    for s in getattr(result, "counter_signals", [])
                ]
                linked_incident = Incident(
                    incident_id=authoritative_incident_id,
                    user_id=user_id,
                    analysis_id=db_analysis.id,
                    title=f"{result.verdict} Alert",
                    scam_type=result.classification or result.verdict or "Digital Fraud Threat",
                    description=input_text[:5000],
                    financial_loss=0.0,
                    currency="INR",
                    bank_name=None,
                    transaction_ref=None,
                    suspect_contact=None,
                    incident_date=datetime.now(timezone.utc),
                    status="UNDER_REVIEW",
                    severity=result.severity,
                    risk_level=result.risk_level.value if hasattr(result.risk_level, 'value') else str(result.risk_level),
                    risk_score=result.risk_score,
                    evidence_metadata=json.dumps({
                        "channel": channel,
                        "reason_codes": getattr(result, "reason_codes", []),
                        "detected_signals": signals_data,
                        "counter_signals": counter_data,
                        "recommended_actions": result.recommended_actions,
                        "verification_steps": result.verification_steps
                    }),
                    is_seed_data=False
                )
                db.add(linked_incident)
            else:
                linked_incident.analysis_id = db_analysis.id
                linked_incident.updated_at = datetime.now(timezone.utc)

            db.commit()
            db.refresh(linked_incident)
            # Authoritative incident ID for returned AnalysisResponse
            result.incident_id = authoritative_incident_id
        else:
            # Low risk (GREEN): remains solely in scam_analyses without creating an emergency incident
            result.incident_id = f"SCAN-{db_analysis.id}"
            db_analysis.incident_id = result.incident_id
            db.commit()

        audit = AuditEvent(
            user_id=user_id,
            event_type="SCAN_EXECUTED",
            entity_type="incident" if is_qualifying else "analysis",
            entity_id=authoritative_incident_id or str(db_analysis.id),
            description=f"V1 analysis ({result.input_type.value if hasattr(result.input_type, 'value') else result.input_type}): '{result.verdict}' — Risk {result.risk_score}/100"
        )
        db.add(audit)
        db.commit()
        return db_analysis.id
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to persist analysis: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database persistence failure: Unable to record scan results. {str(e)}"
        )


# ── Health Check ─────────────────────────────────────────────────────────────

@router.get("/health")
def health_check():
    """V1 API health check."""
    return {
        "status": "online",
        "version": "1.0.0",
        "analysis_provider": settings.analysis_provider,
        "watsonx_configured": settings.watsonx_configured,
        "ocr_available": TESSERACT_AVAILABLE,
        "image_processing_available": OCR_AVAILABLE,
    }


# ── Text Analysis ────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_text(
    request: TextAnalyzeRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Analyze suspicious text content (SMS, WhatsApp, email, call transcript).
    Uses the configured analysis provider (rule-based or IBM watsonx.ai).
    """
    text = request.text.strip()
    if len(text) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text must be at least 5 characters long."
        )

    analyzer = get_analyzer_service()
    result = await analyzer.analyze_text(text, request.channel)
    _persist_analysis(result, text, request.channel, current_user_id, db)

    return _result_to_response(result)


# ── URL Analysis ─────────────────────────────────────────────────────────────

@router.post("/analyze/url", response_model=AnalysisResponse)
async def analyze_url(
    request: URLAnalyzeRequest,
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Analyze a suspicious URL for phishing indicators, misleading subdomains,
    URL shorteners, and suspicious domain characteristics.
    Does NOT visit or execute the URL.
    """
    url = request.url.strip()
    if len(url) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="URL must be at least 5 characters long."
        )

    analyzer = get_analyzer_service()
    result = await analyzer.analyze_url(url)
    _persist_analysis(result, url, "URL", current_user_id, db)

    return _result_to_response(result)


# ── Image Analysis ───────────────────────────────────────────────────────────

@router.post("/analyze/image", response_model=ImageUploadResponse)
async def analyze_image(
    file: UploadFile = File(...),
    extracted_text: Optional[str] = Form(default=None),
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Analyze an uploaded image (screenshot of suspicious message).
    - Validates MIME type (JPG, PNG, WebP) and file size (max 10 MB).
    - Attempts OCR only if genuine Tesseract engine is installed.
    - If OCR is unavailable or unreadable, safely prompts manual text entry
      WITHOUT producing a misleading or reassuring GREEN verdict.
    """
    # Validate MIME type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported image type: {file.content_type}. Accepted: JPG, PNG, WebP."
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Image too large ({len(content) / 1024 / 1024:.1f} MB). Maximum: 10 MB."
        )

    if len(content) < 32:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded image file is empty or corrupted."
        )

    filename = file.filename or "uploaded_image"
    ocr_available = ocr_service.is_available()
    ocr_text = extracted_text.strip() if extracted_text and extracted_text.strip() else None
    analysis_response = None
    message = ""

    # User provided manual text directly
    if ocr_text and len(ocr_text) >= 5:
        analyzer = get_analyzer_service()
        result = await analyzer.analyze_image_text(ocr_text, filename)
        _persist_analysis(result, ocr_text, "IMAGE", current_user_id, db)
        analysis_response = _result_to_response(result)
        message = "User-provided screenshot text analyzed successfully."
    else:
        # Attempt OCR text extraction
        extracted_res, method = ocr_service.extract_text(content, filename)
        if method == "invalid_image_format":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Uploaded file is not a valid or readable image."
            )
        elif method == "image_dimensions_exceed_limit":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Image dimensions exceed maximum permitted limit (8000x8000)."
            )
        elif method == "tesseract_unavailable":
            ocr_text = None
            message = "OCR engine (Tesseract) is not installed on this server. Please paste or enter the visible text from the image manually."
        elif method == "empty_ocr_output" or not extracted_res:
            ocr_text = None
            message = "No readable text could be extracted from this image. Please ensure the screenshot is clear or paste the text manually."
        else:
            # Genuine OCR extraction succeeded
            ocr_text = extracted_res
            analyzer = get_analyzer_service()
            result = await analyzer.analyze_image_text(ocr_text, filename)
            _persist_analysis(result, ocr_text, "IMAGE", current_user_id, db)
            analysis_response = _result_to_response(result)
            message = "Document text extracted via Tesseract OCR engine and analyzed successfully."

    return ImageUploadResponse(
        filename=filename,
        mime_type=file.content_type or "unknown",
        size_bytes=len(content),
        ocr_available=ocr_available,
        extracted_text=ocr_text,
        analysis=analysis_response,
        message=message
    )


# ── Audio Analysis ───────────────────────────────────────────────────────────

@router.post("/analyze/audio", response_model=AudioUploadResponse)
async def analyze_audio(
    file: Optional[UploadFile] = File(default=None),
    transcript: Optional[str] = Form(default=None),
    filename: Optional[str] = Form(default=None),
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Analyze audio evidence (uploaded audio file or pasted transcript).
    - Validates audio format and size (max 25 MB).
    - Uses genuine local offline Whisper transcription if available.
    - If speech recognition is unavailable or silent, prompts manual entry
      WITHOUT producing a reassuring GREEN verdict.
    """
    actual_filename = filename or "audio_evidence"
    content_size = 0
    mime_type = "text/plain"
    content = b""

    if file:
        if file.content_type and file.content_type not in ALLOWED_AUDIO_TYPES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unsupported audio type: {file.content_type}. Accepted: MP3, WAV, OGG, WebM, M4A."
            )

        content = await file.read()
        content_size = len(content)
        mime_type = file.content_type or "audio/mpeg"
        actual_filename = file.filename or actual_filename

        if content_size > MAX_AUDIO_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file too large ({content_size / 1024 / 1024:.1f} MB). Maximum: 25 MB."
            )

        if content_size > 0 and content_size < 32:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Uploaded audio file is empty or corrupted."
            )

    stt_available = audio_service.is_available()
    clean_transcript = transcript.strip() if transcript and transcript.strip() else None
    analysis_response = None
    message = ""

    # Case 1: User provided manual or external transcript
    if clean_transcript and len(clean_transcript) >= 5:
        analyzer = get_analyzer_service()
        result = await analyzer.analyze_audio_text(clean_transcript, actual_filename)
        _persist_analysis(result, clean_transcript, "AUDIO", current_user_id, db)
        analysis_response = _result_to_response(result)
        message = "Voice note transcript (user-provided) analyzed successfully."
    # Case 2: Audio file uploaded without transcript
    elif file and content and len(content) >= 32:
        if not stt_available:
            message = "Automated speech transcription is unavailable on this server. Please enter a manual transcript or summary of the conversation to analyze risk."
        else:
            transcribed_text, method = audio_service.transcribe_audio(content, actual_filename)
            if transcribed_text and len(transcribed_text.strip()) >= 5:
                clean_transcript = transcribed_text.strip()
                analyzer = get_analyzer_service()
                result = await analyzer.analyze_audio_text(clean_transcript, actual_filename)
                _persist_analysis(result, clean_transcript, "AUDIO", current_user_id, db)
                analysis_response = _result_to_response(result)
                message = "Voice recording transcribed via local offline Whisper engine and analyzed successfully."
            else:
                message = "Audio recording contains silence or unintelligible speech. No scam indicators could be verified. If words were spoken, please enter them manually."
    else:
        message = "Please upload an audio recording or paste the spoken transcript for forensic analysis."

    return AudioUploadResponse(
        filename=actual_filename,
        mime_type=mime_type,
        size_bytes=content_size,
        speech_recognition_available=stt_available,
        transcript=clean_transcript,
        analysis=analysis_response,
        message=message
    )
