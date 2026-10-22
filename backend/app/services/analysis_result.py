"""
Structured analysis result model for the Satark Saathi scam intelligence engine.
All analysis providers must return this validated schema.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ConfidenceLabel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class InputType(str, Enum):
    TEXT = "text"
    URL = "url"
    IMAGE = "image"
    AUDIO = "audio"


class AnalysisMode(str, Enum):
    RULE_BASED = "rule_based"
    AI_ASSISTED = "ai_assisted"
    HYBRID = "hybrid"


class DetectedSignal(BaseModel):
    """A single detected manipulation tactic or risk indicator."""
    signal_type: str = Field(..., description="Category: e.g. AUTHORITY_IMPERSONATION, ARTIFICIAL_URGENCY")
    severity: str = Field(default="MEDIUM", description="LOW, MEDIUM, or HIGH")
    reason: str = Field(..., description="Why this signal was flagged")
    excerpt: Optional[str] = Field(default=None, description="Supporting text from the input")
    weight: float = Field(default=1.0, description="Contribution weight to overall risk score")


class AnalysisResult(BaseModel):
    """
    The unified, validated output of every completed scam analysis.
    Every field is documented and every signal includes justification.
    """
    incident_id: str = Field(..., description="Unique analysis identifier")
    input_type: InputType = Field(..., description="What type of input was analyzed")
    risk_level: RiskLevel = Field(..., description="Overall risk classification")
    risk_score: int = Field(..., ge=0, le=100, description="Heuristic risk score (0-100). Not a calibrated probability.")
    confidence_label: ConfidenceLabel = Field(..., description="Confidence in the assessment")
    verdict: str = Field(..., description="Short classification label")
    plain_language_summary: str = Field(..., description="Easy-to-understand explanation for the user")
    detected_signals: List[DetectedSignal] = Field(default_factory=list, description="All detected manipulation tactics")
    supporting_evidence: List[str] = Field(default_factory=list, description="Key evidence items supporting the verdict")
    recommended_actions: List[str] = Field(default_factory=list, description="What the user should do immediately")
    verification_steps: List[str] = Field(default_factory=list, description="How to independently verify legitimacy")
    should_alert_family: bool = Field(default=False, description="Whether trusted contacts should be notified")
    ai_provider: str = Field(default="none", description="Which AI provider was used, if any")
    analysis_mode: AnalysisMode = Field(default=AnalysisMode.RULE_BASED, description="How the analysis was performed")
    limitations: List[str] = Field(
        default_factory=lambda: [
            "This is a heuristic risk assessment, not a definitive fraud determination.",
            "A low-risk result does not guarantee the communication is safe.",
            "Always verify through official channels before sharing personal or financial information."
        ],
        description="Known limitations the user should be aware of"
    )

    # Legacy compatibility fields
    classification: str = Field(default="", description="Legacy classification label")
    severity: str = Field(default="SAFE", description="Legacy severity: SAFE, CAUTION, HIGH_RISK")
    summary: str = Field(default="", description="Legacy summary text")
    advice: str = Field(default="", description="Legacy advice text")
    suggested_action: Optional[str] = Field(default=None, description="Legacy suggested action")
    is_flagged_for_family: bool = Field(default=False, description="Legacy family flag")
    evidence_items: List[dict] = Field(default_factory=list, description="Legacy evidence format")
