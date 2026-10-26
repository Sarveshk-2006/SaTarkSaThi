"""
V1 Analysis API schemas.
Typed Pydantic request/response models for all analysis endpoints.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


# ── Request Models ───────────────────────────────────────────────────────────

class TextAnalyzeRequest(BaseModel):
    """Request body for text message analysis."""
    text: str = Field(
        ...,
        min_length=5,
        max_length=10000,
        description="The suspicious message text to analyze"
    )
    channel: str = Field(
        default="SMS",
        description="Source channel: SMS, WHATSAPP, TELEGRAM, EMAIL, CALL_TRANSCRIPT"
    )


class URLAnalyzeRequest(BaseModel):
    """Request body for URL analysis."""
    url: str = Field(
        ...,
        min_length=5,
        max_length=2048,
        description="The suspicious URL to analyze"
    )


class ImageAnalyzeRequest(BaseModel):
    """Metadata for image analysis (file sent via multipart form)."""
    extracted_text: Optional[str] = Field(
        default=None,
        description="If OCR is unavailable, user can paste extracted text"
    )


class AudioAnalyzeRequest(BaseModel):
    """Metadata for audio analysis."""
    transcript: Optional[str] = Field(
        default=None,
        max_length=10000,
        description="Audio transcript text (if speech recognition unavailable, user pastes text)"
    )
    filename: Optional[str] = Field(
        default=None,
        description="Original audio filename"
    )


# ── Response Models ──────────────────────────────────────────────────────────

class DetectedSignalResponse(BaseModel):
    """A single detected risk signal with justification."""
    reason_code: str = ""
    signal_type: str
    severity: str
    reason: str
    excerpt: Optional[str] = None
    weight: float = 1.0
    category: Optional[str] = None


class AnalysisResponse(BaseModel):
    """
    Full structured analysis response.
    Every detected signal includes a reason, excerpt, and machine-readable code.
    """
    incident_id: str
    input_type: str
    risk_level: str = Field(description="LOW, MEDIUM, HIGH, or CRITICAL")
    risk_score: int = Field(ge=0, le=100, description="Heuristic risk score, not a calibrated probability")
    policy_tier: str = Field(default="GREEN", description="Centralized policy tier: GREEN, AMBER, or RED")
    confidence_label: str = Field(description="LOW, MEDIUM, or HIGH")
    verdict: str
    plain_language_summary: str
    detected_signals: List[DetectedSignalResponse] = []
    counter_signals: List[DetectedSignalResponse] = []
    reason_codes: List[str] = []
    supporting_evidence: List[str] = []
    recommended_actions: List[str] = []
    recommended_action: Optional[str] = None
    verification_steps: List[str] = []
    should_alert_family: bool = False
    ai_provider: str = "none"
    analysis_mode: str = "rule_based"
    limitations: List[str] = []

    # Legacy compatibility for existing frontend
    classification: str = ""
    severity: str = "SAFE"
    summary: str = ""
    advice: str = ""
    suggested_action: Optional[str] = None
    is_flagged_for_family: bool = False
    evidence_items: List[dict] = []


class ImageUploadResponse(BaseModel):
    """Response for image upload with OCR results."""
    filename: str
    mime_type: str
    size_bytes: int
    ocr_available: bool
    extracted_text: Optional[str] = None
    analysis: Optional[AnalysisResponse] = None
    message: str = ""


class AudioUploadResponse(BaseModel):
    """Response for audio upload."""
    filename: str
    mime_type: str
    size_bytes: int
    speech_recognition_available: bool = False
    transcript: Optional[str] = None
    analysis: Optional[AnalysisResponse] = None
    message: str = ""
