"""
Pydantic schemas for Satark Saathi Caller Shield endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class CallerLookupResponse(BaseModel):
    phone_number: str
    normalized_number: str
    display_tag: str
    category: str
    risk_score: int
    risk_level: str
    confidence: str
    action: str = "ALLOW"  # "ALLOW", "WARN", "BLOCK"
    is_blocked: bool = False
    carrier_verified: bool = False
    carrier_name: Optional[str] = None
    is_business: bool = False
    business_name: Optional[str] = None
    total_reports: int = 0
    verified_reports: int = 0
    ibm_summary: Optional[str] = None
    evidence_signals: List[str] = []
    recommended_action: Optional[str] = None
    last_reported_at: Optional[str] = None


class CallerReportCreate(BaseModel):
    phone_number: str = Field(..., description="Raw or formatted incoming caller number")
    category: str = Field(..., description="Fraud category: DIGITAL_ARREST, KYC_FRAUD, ELECTRICITY_SCAM, COURIER_CUSTOMS, LOTTERY_FRAUD, HARASSMENT, etc.")
    claimed_caller_name: Optional[str] = Field(None, description="Name claimed by caller, e.g. CBI Officer Vijay")
    description: Optional[str] = Field(None, description="Details of extortion attempt or call conversation")
    call_type: str = Field("INCOMING", description="INCOMING, MISSED, or WHATSAPP_CALL")


class CallerReportResponse(BaseModel):
    status: str
    message: str
    normalized_number: str
    risk_score: int
    risk_level: str
    total_reports: int


class CallerFeedbackCreate(BaseModel):
    phone_number: str
    is_spam: bool = True


class CallerBlocklistCreate(BaseModel):
    phone_number: str
    action: str = Field("BLOCK", description="BLOCK, ALLOW, or WARN")
    display_name: Optional[str] = None
    reason: Optional[str] = None


class CallerBlocklistResponse(BaseModel):
    id: int
    normalized_number: str
    display_name: Optional[str]
    action: str
    reason: Optional[str]
    created_at: Optional[str]


class CallerStatsResponse(BaseModel):
    total_screened_numbers: int
    active_threat_numbers: int
    community_reports_count: int
    personal_blocked_count: int
    ibm_ai_status: str
    analysis_provider: str
