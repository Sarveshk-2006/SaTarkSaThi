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
    contact_consent_status: str = "PENDING"
    contact_consent_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ContactInvitationResponse(BaseModel):
    contact_id: int
    owner_user_id: int
    owner_name: str
    relationship: str
    contact_consent_status: str
    owner_consent_granted: bool
    created_at: datetime

class InvitationDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(ACCEPT|DECLINE)$")

class InvitationCodeDecisionRequest(BaseModel):
    invite_code: str = Field(..., min_length=6, max_length=20)
    decision: str = Field(..., pattern="^(ACCEPT|DECLINE)$")

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
    call_state: str = Field(
        default="NONE",
        pattern="^(NONE|DEMO_SIMULATED_ACTIVE_CALL|USER_REPORTED_ACTIVE_CALL)$",
        description="Explicit call-state signal. Never automatically detected in this prototype.",
    )

class RiskSignalResponse(BaseModel):
    code: str
    label: str
    points: int
    explanation: str
    source: str

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
    call_state: str = "NONE"
    outcome: str  # "PROCEED_WITH_CAUTION", "PAUSE_AND_VERIFY", "SEEK_TRUSTED_HELP"
    policy_tier: str = "GREEN"  # "GREEN", "AMBER", "RED" aligned with centralized risk policy
    risk_score: int
    severity: str
    decision_rationale: str
    evidence_factors: List[str] = []
    verification_steps: List[str] = []
    risk_signals: List[RiskSignalResponse] = []
    history_summary: dict = {}
    guardian_approval_recommended: bool = False
    eligible_guardian_count: int = 0
    checkin_status: str = "NOT_STARTED"
    checkin_tier: Optional[str] = None
    source: str = "SANDBOX"
    is_simulation: bool = True
    disclaimer: str = "SIMULATION ONLY: no real money has been moved or blocked."
    checked_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Safety Check-in Schemas ---
class CheckinAnswer(BaseModel):
    question_id: str = Field(..., max_length=40)
    value: str = Field(default="", max_length=500)

class CheckinRequest(BaseModel):
    language: str = "en"
    answers: List[CheckinAnswer] = []

class CheckinOption(BaseModel):
    value: str
    label: str

class CheckinQuestion(BaseModel):
    id: str
    kind: str
    prompt: str
    prompt_en: str
    optional: bool = False
    options: List[CheckinOption] = []
    step: int
    total_estimate: int

class CheckinReason(BaseModel):
    code: str
    label: str

class CheckinResult(BaseModel):
    final_tier: str
    recommended_action: str  # DO_NOT_PAY, WAIT_FOR_GUARDIAN, PAUSE_AND_VERIFY, PROCEED_WITH_CARE
    message: str
    answers_could_not_clear: bool = False
    answers_could_not_clear_message: Optional[str] = None
    reasons: List[CheckinReason] = []
    guardian_request_ref: Optional[str] = None
    eligible_guardian_count: int = 0

class CheckinResponse(BaseModel):
    simulation_id: str
    language: str
    status: str  # IN_PROGRESS, COMPLETED
    engine: str = "RULE_BASED_GUIDED_CHECKIN"
    engine_note: str = "Guided rule-based check-in. No generative AI model is used, and answers cannot override objective payment risk."
    next_question: Optional[CheckinQuestion] = None
    result: Optional[CheckinResult] = None

# --- Guardian Approval Schemas ---
class GuardianApprovalResponse(BaseModel):
    request_ref: str
    simulation_id: str
    requester_name: str
    amount: float
    payee: str
    status: str
    created_at: datetime
    expires_at: datetime
    decided_at: Optional[datetime] = None
    decision_note: Optional[str] = None
    viewer_role: str
    reason_codes: List[str] = []
    guardian_guidance: Optional[str] = None

class GuardianDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(APPROVE|DECLINE)$")
    note: Optional[str] = Field(default=None, max_length=280)

# --- Duress Phrase Schemas ---
class DuressSettingsResponse(BaseModel):
    enabled: bool
    configured_at: Optional[datetime] = None
    eligible_guardian_count: int = 0
    how_it_works: str = (
        "If your secret phrase appears in your answer to the check-in question about what a payment is for, "
        "the app shows an ordinary 'family check needed' screen while quietly asking your accepted guardians to call you."
    )

class DuressSettingsUpdate(BaseModel):
    phrase: str = Field(..., min_length=8, max_length=80)
    consent_acknowledged: bool

# --- SDK Boundary Schemas ---
class SdkPreTransactionRequest(BaseModel):
    payee_vpa: str = Field(..., min_length=3)
    payee_name: Optional[str] = None
    amount: float = Field(..., gt=0)
    note: Optional[str] = None
    call_state: str = Field(default="NONE", pattern="^(NONE|DEMO_SIMULATED_ACTIVE_CALL|USER_REPORTED_ACTIVE_CALL)$")
    host_app: str = Field(default="SATARK_MOCK_UPI", max_length=40)

class SdkDecisionResponse(BaseModel):
    sdk_version: str = "0.1.0-prototype"
    decision: str  # ALLOW, CHECKIN_REQUIRED, GUARDIAN_APPROVAL_REQUIRED, BLOCK_RECOMMENDED
    simulation_id: str
    policy_tier: str
    risk_score: int
    risk_signals: List[RiskSignalResponse] = []
    checkin_status: str = "NOT_STARTED"
    guardian_request_ref: Optional[str] = None
    guardian_status: Optional[str] = None
    can_complete: bool
    user_message: str
    integration_notice: str = (
        "Prototype SDK boundary used by the Satark mock UPI app only. It is not integrated with PhonePe, "
        "Google Pay, Paytm, BHIM or any bank application, and no real money moves."
    )

class SdkCompleteResponse(BaseModel):
    simulation_id: str
    status: str  # COMPLETED, CANCELLED
    transaction_id: Optional[int] = None
    message: str
    is_mock: bool = True

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

class GoldenHourAction(BaseModel):
    key: str  # CYBERCRIME_CELL, BANK_LIEN, CYBER_POLICE
    title: str
    recipient: str
    reference: str
    channel: str
    status: str = "SIMULATED_DISPATCHED"
    subject: str
    body: str
    completed_at: datetime
    real_next_step: str
    real_action_label: str
    real_action_url: str

class GoldenHourResponse(BaseModel):
    draft_id: int
    incident_reference: Optional[str] = None
    activated_at: datetime
    actions: List[GoldenHourAction]
    already_activated: bool = False
    is_simulation: bool = True
    simulation_notice: str = (
        "DEMO SIMULATION: no e-mail was actually sent and no bank, police or government system was contacted. "
        "In a real emergency call 1930, report at cybercrime.gov.in and call your bank's fraud line."
    )

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
