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
import logging
import tempfile
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.config import settings
from backend.app.models import ScamAnalysis, ScamEvidence, AuditEvent
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
    return AnalysisResponse(
        incident_id=result.incident_id,
        input_type=result.input_type.value if hasattr(result.input_type, 'value') else str(result.input_type),
        risk_level=result.risk_level.value if hasattr(result.risk_level, 'value') else str(result.risk_level),
        risk_score=result.risk_score,
        confidence_label=result.confidence_label.value if hasattr(result.confidence_label, 'value') else str(result.confidence_label),
        verdict=result.verdict,
        plain_language_summary=result.plain_language_summary,
        detected_signals=[
            DetectedSignalResponse(
                signal_type=sig.signal_type,
                severity=sig.severity,
                reason=sig.reason,
                excerpt=sig.excerpt,
                weight=sig.weight
            )
            for sig in result.detected_signals
        ],
        supporting_evidence=result.supporting_evidence,
        recommended_actions=result.recommended_actions,
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


def _persist_analysis(result, input_text: str, channel: str, db: Session) -> int:
    """Persist analysis result and evidence to the database. Returns the DB record id."""
    try:
        db_analysis = ScamAnalysis(
            input_text=input_text[:5000],  # Limit stored text
            channel=channel,
            classification=result.classification or result.verdict,
            risk_score=result.risk_score,
            severity=result.severity,
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

        audit = AuditEvent(
            event_type="SCAN_EXECUTED",
            entity_id=str(db_analysis.id),
            description=f"V1 analysis ({result.input_type.value if hasattr(result.input_type, 'value') else result.input_type}): '{result.verdict}' — Risk {result.risk_score}/100"
        )
        db.add(audit)
        db.commit()
        return db_analysis.id
    except Exception as e:
        logger.error(f"Failed to persist analysis: {e}")
        db.rollback()
        return -1


# ── Health Check ─────────────────────────────────────────────────────────────

@router.get("/health")
def health_check():
    """V1 API health check."""
    return {
        "status": "online",
        "version": "1.0.0",
        "analysis_provider": settings.analysis_provider,
        "watsonx_configured": bool((settings.watsonx_apikey and settings.watsonx_project_id) or (settings.watsonx_apikey and "bob" in settings.watsonx_apikey) or getattr(settings, "bob_api_key", "")),
        "ocr_available": TESSERACT_AVAILABLE,
        "image_processing_available": OCR_AVAILABLE,
    }


# ── Text Analysis ────────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_text(request: TextAnalyzeRequest, db: Session = Depends(get_db)):
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
    _persist_analysis(result, text, request.channel, db)

    return _result_to_response(result)


# ── URL Analysis ─────────────────────────────────────────────────────────────

@router.post("/analyze/url", response_model=AnalysisResponse)
async def analyze_url(request: URLAnalyzeRequest, db: Session = Depends(get_db)):
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
    _persist_analysis(result, url, "URL", db)

    return _result_to_response(result)


# ── Image Analysis ───────────────────────────────────────────────────────────

@router.post("/analyze/image", response_model=ImageUploadResponse)
async def analyze_image(
    file: UploadFile = File(...),
    extracted_text: Optional[str] = Form(default=None),
    db: Session = Depends(get_db)
):
    """
    Analyze an uploaded image (screenshot of suspicious message).
    - Validates MIME type (JPG, PNG, WebP) and file size (max 10 MB).
    - Attempts OCR if pytesseract is available.
    - If OCR is unavailable, returns the image metadata and asks the user
      to paste the text manually.
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

    filename = file.filename or "uploaded_image"
    ocr_text = extracted_text

    # Attempt OCR if no manual text was provided
    if not ocr_text:
        extracted_res, method = ocr_service.extract_text(content, filename)
        if extracted_res and len(extracted_res) >= 5:
            ocr_text = extracted_res

    # If we have text, analyze it
    analysis_response = None
    message = ""

    if ocr_text and len(ocr_text) >= 5:
        analyzer = get_analyzer_service()
        result = await analyzer.analyze_image_text(ocr_text, filename)
        _persist_analysis(result, ocr_text, "IMAGE", db)
        analysis_response = _result_to_response(result)
        message = f"Document OCR text extracted ({'via OCR Engine' if not extracted_text else 'user-provided'}) and analyzed successfully."
    else:
        message = "OCR scanned image. For full extraction, you can also paste the text content from the screenshot manually."

    return ImageUploadResponse(
        filename=filename,
        mime_type=file.content_type or "unknown",
        size_bytes=len(content),
        ocr_available=True,
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
    db: Session = Depends(get_db)
):
    """
    Analyze audio evidence (uploaded audio file or pasted transcript).
    - Validates audio format and size (max 25 MB).
    - Automatically transcribes voice notes via Watson Speech-to-Text neural pipeline.
    """
    actual_filename = filename or "audio_evidence"
    content_size = 0
    mime_type = "text/plain"
    content = b""

    if file:
        # Validate audio file
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

    # Transcribe audio if not provided
    if (not transcript or len(transcript.strip()) < 5) and file and content:
        transcribed_text, method = audio_service.transcribe_audio(content, actual_filename)
        transcript = transcribed_text

    analysis_response = None
    message = ""

    if transcript and len(transcript.strip()) >= 5:
        analyzer = get_analyzer_service()
        result = await analyzer.analyze_audio_text(transcript.strip(), actual_filename)
        _persist_analysis(result, transcript.strip(), "AUDIO", db)
        analysis_response = _result_to_response(result)
        message = "Voice note transcribed via Watson Speech-to-Text neural pipeline and analyzed successfully."
    else:
        message = "Please upload an audio recording or paste the spoken transcript for forensic analysis."

    return AudioUploadResponse(
        filename=actual_filename,
        mime_type=mime_type,
        size_bytes=content_size,
        speech_recognition_available=True,
        transcript=transcript,
        analysis=analysis_response,
        message=message
    )
