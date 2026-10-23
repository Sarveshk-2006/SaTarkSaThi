from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- User Profile Schemas ---
class UserProfileBase(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[str] = None
    role: str = "PROTECTED_MEMBER"  # "PROTECTED_MEMBER", "GUARDIAN"
    preferred_language: str = "English"
    city: str = "New Delhi"
    bank_name: str = "State Bank of India"
    notifications_enabled: bool = True

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    preferred_language: Optional[str] = None
    city: Optional[str] = None
    bank_name: Optional[str] = None
    notifications_enabled: Optional[bool] = None

class UserProfileResponse(UserProfileBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- Trusted Contact Schemas ---
class TrustedContactBase(BaseModel):
    name: str
    relationship: str
    phone_number: str
    email: Optional[str] = None
    alert_level: str = "HIGH_RISK_ONLY"  # "ALL", "HIGH_RISK_ONLY", "CRITICAL_ONLY"
    is_active: bool = True
    is_primary: bool = False
    is_verified: bool = False
    # Explicit user consent for incident sharing must be deliberately granted; never assumed.
    consent_granted: bool = False

class TrustedContactCreate(BaseModel):
    name: str
    relationship: str
    phone_number: str
    email: Optional[str] = None
    alert_level: str = "HIGH_RISK_ONLY"
    is_active: bool = True
    is_primary: bool = False
    # Explicit user consent default is False — creating a contact does NOT grant consent automatically.
    consent_granted: bool = False

class TrustedContactUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    alert_level: Optional[str] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None
    consent_granted: Optional[bool] = None

class ContactVerificationRequest(BaseModel):
    contact_id: int

class ContactVerificationConfirm(BaseModel):
    code: str = Field(..., min_length=4, max_length=10)

class TrustedContactResponse(TrustedContactBase):
    id: int
    user_id: int
    verification_sent_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Evidence & Analysis Schemas ---
class ScamEvidenceResponse(BaseModel):
    id: int
    factor_type: str
    severity: str
    description: str
    matched_text: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=5, description="The suspicious message, SMS, WhatsApp, or email text")
    channel: str = Field(default="SMS", description="Channel: SMS, WHATSAPP, TELEGRAM, EMAIL, CALL_TRANSCRIPT, APK_URL")

class ScamAnalysisResponse(BaseModel):
    id: int
    incident_id: Optional[str] = None
    input_text: str
    channel: str
    classification: str
    risk_score: int
    severity: str  # SAFE, CAUTION, HIGH_RISK
    risk_level: Optional[str] = "HIGH"
    summary: str
    advice: str
    suggested_action: Optional[str] = None
    is_flagged_for_family: bool
    is_seed_data: bool
    created_at: datetime
    evidence_items: List[ScamEvidenceResponse] = []
    model_config = ConfigDict(from_attributes=True)

class PresetSample(BaseModel):
    id: str
    title: str
    category: str
    channel: str
    text: str
    description: str

# --- Family Alert Schemas ---
class CreateAlertRequest(BaseModel):
    contact_ids: List[int]
    threat_title: str
    message_content: str
    delivery_channel: str = "IN_APP_SIMULATION"
    analysis_id: Optional[int] = None
    incident_id: Optional[str] = None
    risk_level: str = "HIGH"
    recommended_action: Optional[str] = None

class FamilyAlertResponse(BaseModel):
    id: int
    incident_id: Optional[str] = None
    analysis_id: Optional[int] = None
    contact_id: int
    user_id: int
    threat_title: str
    message_content: str
    risk_level: str = "HIGH"
    recommended_action: Optional[str] = None
    delivery_channel: str
    status: str
    failure_reason: Optional[str] = None
    retry_count: int = 0
    is_seed_data: bool
    delivered_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    contact: Optional[TrustedContactResponse] = None
    model_config = ConfigDict(from_attributes=True)

# --- Payment Checkpoint / Simulation Schemas ---
class PaymentCheckRequest(BaseModel):
    """Legacy compatibility request."""
    vpa_or_account: str = Field(..., min_length=3)
    recipient_name: Optional[str] = None
    requested_amount: Optional[float] = None
    purpose: Optional[str] = None

class PaymentSimulationRequest(BaseModel):
    """Realistic interactive sandbox simulation for pre-transaction risk checkpoint."""
    vpa_or_account: str = Field(..., min_length=3, description="UPI ID (e.g. user@okhdfc) or Account Number")
    recipient_name: Optional[str] = None
    is_new_recipient: bool = True
    requested_amount: float = Field(..., gt=0, description="Amount in INR. Must be greater than 0.")
    purpose: Optional[str] = None
    pressure_present: bool = False
    authority_claimed: bool = False
    secrecy_demanded: bool = False
    guaranteed_returns: bool = False

class PaymentSimulationResponse(BaseModel):
    id: int
    simulation_id: str
    vpa_or_account: str
    recipient_name: Optional[str] = None
    is_new_recipient: bool
    requested_amount: float
    purpose: Optional[str] = None
    pressure_present: bool
    authority_claimed: bool
    secrecy_demanded: bool
    guaranteed_returns: bool
    outcome: str  # "PROCEED_WITH_CAUTION", "PAUSE_AND_VERIFY", "SEEK_TRUSTED_HELP"
    policy_tier: str = "GREEN"  # "GREEN", "AMBER", "RED" aligned with centralized risk policy
    risk_score: int
    severity: str
    decision_rationale: str
    evidence_factors: List[str] = []
    verification_steps: List[str] = []
    is_simulation: bool = True
    disclaimer: str = "SIMULATION ONLY: no real money has been moved or blocked."
    checked_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Alias for legacy compatibility
PaymentCheckResponse = PaymentSimulationResponse

# --- Incident & Recovery Schemas ---
class IncidentCreate(BaseModel):
    title: str
    scam_type: str
    description: str
    financial_loss: float = Field(default=0.0, ge=0)
    currency: str = "INR"
    bank_name: Optional[str] = None
    transaction_ref: Optional[str] = None  # None/empty explicitly allowed
    suspect_contact: Optional[str] = None
    analysis_id: Optional[int] = None
    severity: str = "HIGH_RISK"
    risk_level: str = "HIGH"

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    scam_type: Optional[str] = None
    description: Optional[str] = None
    financial_loss: Optional[float] = None
    bank_name: Optional[str] = None
    transaction_ref: Optional[str] = None
    suspect_contact: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    risk_level: Optional[str] = None

class RecoveryDraftResponse(BaseModel):
    id: int
    incident_id: int
    user_id: int
    incident_datetime: Optional[datetime] = None
    scam_category: Optional[str] = None
    financial_loss: float = 0.0
    transaction_reference: Optional[str] = None
    bank_or_app: Optional[str] = None
    transfer_status: Optional[str] = "COMPLETED"
    portal_complaint_text: str
    bank_complaint_text: str
    police_complaint_text: str
    missing_fields_notice: Optional[str] = None
    reporting_disclaimer: str = "Call 1930 Cyber Fraud Helpline immediately and file at cybercrime.gov.in. Official reporting does not guarantee financial recovery."
    status: str = "DRAFT"
    generated_at: datetime
    incident_reference: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class RecoveryWizardRequest(BaseModel):
    # Optional existing incident ID to link to
    incident_id: Optional[str] = None

    # Step 1: Incident Info
    incident_datetime: Optional[datetime] = None
    scam_type: str = Field(..., min_length=2)
    communication_channel: str = Field(default="Phone Call / SMS")
    description: str = Field(..., min_length=5)

    # Step 2: Financial Info (Missing UTR explicitly allowed!)
    financial_loss: float = Field(default=0.0, ge=0)
    transaction_ref: Optional[str] = None
    bank_name: Optional[str] = None
    transfer_status: str = Field(default="COMPLETED")  # "PENDING" or "COMPLETED"

    # Step 3: Evidence & Timeline
    suspect_contact: Optional[str] = None
    message_transcript: Optional[str] = None
    timeline_events: List[str] = []
    evidence_attachments: List[str] = []

class BankFreezeRequest(BaseModel):
    incident_id: Optional[str] = None
    bank_name: str = Field(..., min_length=2)
    account_number_last4: str = Field(default="XXXX")
    transaction_amount: float = Field(default=0.0, ge=0)
    suspect_vpa_or_account: str = Field(..., min_length=3)
    utr_number: Optional[str] = None
    urgency_level: str = Field(default="EMERGENCY_GOLDEN_HOUR")

class BankFreezeResponse(BaseModel):
    success: bool = True
    freeze_reference: str
    bank_name: str
    status: str
    timestamp: datetime
    nodal_desk_assigned: str
    action_summary: str
    gateway_protocol: str
    is_simulation: bool = True
    simulation_notice: str = "PROTOTYPE SIMULATION ONLY: No actual bank lien was placed. In a real emergency, call 1930 and contact your bank nodal officer immediately."

class CybercrimePortalSubmitRequest(BaseModel):
    incident_id: Optional[str] = None
    complaint_text: str = Field(..., min_length=10)
    scam_category: str = Field(default="Cyber Financial Fraud")
    financial_loss: float = Field(default=0.0, ge=0)
    suspect_details: Optional[str] = None

class CybercrimePortalSubmitResponse(BaseModel):
    success: bool = True
    portal_ack_number: str
    filing_timestamp: datetime
    jurisdiction: str
    status: str
    next_steps: List[str]
    is_simulation: bool = True
    simulation_notice: str = "SANDBOX SIMULATION ONLY: This draft has not been filed with police. Export the dossier and submit formally at cybercrime.gov.in."

class RecoveryCaseContextResponse(BaseModel):
    incident_id: str
    scam_type: str
    description: str
    financial_loss: float = 0.0
    currency: str = "INR"
    bank_name: Optional[str] = None
    transaction_ref: Optional[str] = None
    suspect_contact: Optional[str] = None
    incident_date: Optional[datetime] = None
    status: str
    risk_score: int
    risk_level: str
    timeline_events: List[str] = []
    communication_channel: Optional[str] = None
    latest_draft: Optional[RecoveryDraftResponse] = None

class IncidentResponse(BaseModel):
    id: int
    incident_id: str
    user_id: int
    analysis_id: Optional[int] = None
    title: str
    scam_type: str
    description: str
    financial_loss: float
    currency: str
    bank_name: Optional[str] = None
    transaction_ref: Optional[str] = None
    suspect_contact: Optional[str] = None
    incident_date: datetime
    status: str
    severity: str
    risk_level: str = "HIGH"
    risk_score: int = 70
    is_seed_data: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    recovery_drafts: List[RecoveryDraftResponse] = []
    model_config = ConfigDict(from_attributes=True)

# --- Audit Event Schemas ---
class AuditEventResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    event_type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    description: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Stats Schema ---
class OverviewStatsResponse(BaseModel):
    total_analyses: int
    high_risk_analyses: int
    caution_analyses: int
    safe_analyses: int
    total_family_alerts: int
    active_trusted_contacts: int
    total_incidents: int
    recovery_cases_created: int
    total_loss_recorded: float
    recent_incidents: List[IncidentResponse] = []
    recent_analyses: List[ScamAnalysisResponse] = []

# --- System Settings Schema ---
class SystemSettingsResponse(BaseModel):
    app_name: str
    app_env: str
    analysis_provider: str
    watsonx_configured: bool
    enable_demo_seed: bool

class SystemSettingsUpdate(BaseModel):
    analysis_provider: Optional[str] = None
    watsonx_apikey: Optional[str] = None
    watsonx_project_id: Optional[str] = None


# --- Authentication Schemas ---
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: int
    role: str
    full_name: str


class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Phone number (+91...) or email address")
    passcode: str = Field(..., description="User numeric or text passcode")


class DemoTokenRequest(BaseModel):
    user_id: int = Field(1, description="Demo identity ID: 1 (Rajesh Sharma) or 2 (Aarav Sharma)")
