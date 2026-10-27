import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship as orm_relationship
from backend.app.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False, default="Rajesh Sharma")
    phone_number = Column(String(20), nullable=False, default="+91 98765 43210")
    email = Column(String(120), nullable=True, default="rajesh.sharma@example.in")
    role = Column(String(30), default="PROTECTED_MEMBER")  # "PROTECTED_MEMBER", "GUARDIAN"
    passcode_hash = Column(String(128), nullable=True)  # Hashed passcode for demo session
    preferred_language = Column(String(20), default="English")
    city = Column(String(50), default="New Delhi")
    bank_name = Column(String(80), default="State Bank of India")
    notifications_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    contacts = orm_relationship("TrustedContact", back_populates="user", cascade="all, delete-orphan")
    incidents = orm_relationship("Incident", back_populates="user", cascade="all, delete-orphan")
    payment_simulations = orm_relationship("PaymentSimulation", back_populates="user", cascade="all, delete-orphan")


class TrustedContact(Base):
    __tablename__ = "trusted_contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, default=1, index=True)
    name = Column(String(100), nullable=False)
    relationship = Column(String(50), nullable=False)  # "Son", "Daughter", "Spouse", "Sibling", "Lawyer", "Friend"
    phone_number = Column(String(20), nullable=False)
    email = Column(String(120), nullable=True)
    alert_level = Column(String(30), default="HIGH_RISK_ONLY")  # "ALL", "HIGH_RISK_ONLY", "CRITICAL_ONLY"
    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)

    # Contact verification
    is_verified = Column(Boolean, default=False)
    verification_code = Column(String(10), nullable=True)
    verification_sent_at = Column(DateTime(timezone=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Explicit user consent for incident sharing
    consent_granted = Column(Boolean, default=False)  # Must be explicitly granted; never assumed.

    # Contact-side consent: the invited person must accept separately from the owner's grant.
    # "PENDING", "ACCEPTED", "DECLINED"
    contact_consent_status = Column(String(20), default="PENDING")
    contact_consent_at = Column(DateTime(timezone=True), nullable=True)
    invite_code_hash = Column(String(128), nullable=True)
    invite_expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    user = orm_relationship("UserProfile", back_populates="contacts")
    alerts = orm_relationship("FamilyAlert", back_populates="contact", cascade="all, delete-orphan")


class ScamAnalysis(Base):
    __tablename__ = "scam_analyses"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, default=1, index=True)
    input_text = Column(Text, nullable=False)
    channel = Column(String(40), default="SMS")  # "SMS", "WHATSAPP", "TELEGRAM", "EMAIL", "CALL_TRANSCRIPT", "APK_URL"
    classification = Column(String(80), nullable=False)  # e.g. "Digital Arrest Scam"
    risk_score = Column(Integer, nullable=False)  # 0 to 100
    severity = Column(String(20), nullable=False)  # "SAFE", "CAUTION", "HIGH_RISK"
    risk_level = Column(String(20), default="HIGH")  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    summary = Column(Text, nullable=False)
    advice = Column(Text, nullable=False)
    suggested_action = Column(String(255), nullable=True)
    is_flagged_for_family = Column(Boolean, default=False)
    is_seed_data = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    evidence_items = orm_relationship("ScamEvidence", back_populates="analysis", cascade="all, delete-orphan")
    alerts = orm_relationship("FamilyAlert", back_populates="analysis")
    incidents = orm_relationship("Incident", back_populates="analysis")


class ScamEvidence(Base):
    __tablename__ = "scam_evidence"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("scam_analyses.id"), nullable=False, index=True)
    factor_type = Column(String(50), nullable=False)
    severity = Column(String(20), default="MEDIUM")  # "LOW", "MEDIUM", "HIGH"
    description = Column(Text, nullable=False)
    matched_text = Column(String(255), nullable=True)
    file_name = Column(String(120), nullable=True)
    file_type = Column(String(50), nullable=True)
    retention_policy = Column(String(50), default="30_DAYS_ANALYTICS_ONLY")

    # Relationships
    analysis = orm_relationship("ScamAnalysis", back_populates="evidence_items")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, index=True, nullable=False)  # Standardized SA-XXXXXX
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, default=1, index=True)
    analysis_id = Column(Integer, ForeignKey("scam_analyses.id"), nullable=True, index=True)

    title = Column(String(150), nullable=False)
    scam_type = Column(String(80), nullable=False)
    description = Column(Text, nullable=False)
    financial_loss = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    bank_name = Column(String(80), nullable=True)
    transaction_ref = Column(String(100), nullable=True)  # UTR / UPI Ref (nullable for missing UTR)
    suspect_contact = Column(String(100), nullable=True)  # Suspect phone / UPI / account

    incident_date = Column(DateTime(timezone=True), default=utc_now)
    status = Column(String(30), default="DRAFT", index=True)  # "DRAFT", "UNDER_REVIEW", "REPORTED_1930", "BANK_FREEZE_REQUESTED", "RESOLVED"
    severity = Column(String(20), default="HIGH_RISK")
    risk_level = Column(String(20), default="HIGH")  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    risk_score = Column(Integer, default=70)

    evidence_metadata = Column(Text, nullable=True)  # JSON timeline / attachment references
    is_seed_data = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    user = orm_relationship("UserProfile", back_populates="incidents")
    analysis = orm_relationship("ScamAnalysis", back_populates="incidents")
    recovery_drafts = orm_relationship("RecoveryDraft", back_populates="incident", cascade="all, delete-orphan")


class FamilyAlert(Base):
    __tablename__ = "family_alerts"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), nullable=True, index=True)  # SA-XXXXXX
    analysis_id = Column(Integer, ForeignKey("scam_analyses.id"), nullable=True)
    contact_id = Column(Integer, ForeignKey("trusted_contacts.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, default=1, index=True)

    threat_title = Column(String(120), nullable=False)
    message_content = Column(Text, nullable=False)
    risk_level = Column(String(20), default="HIGH")  # "HIGH", "CRITICAL"
    recommended_action = Column(String(255), nullable=True)
    delivery_channel = Column(String(40), default="IN_APP_SIMULATION")  # "IN_APP_SIMULATION", "WHATSAPP_SIMULATION", "SMS_SIMULATION"
    status = Column(String(30), default="PENDING", index=True)  # "PENDING", "SENT", "DELIVERED", "ACKNOWLEDGED", "FAILED"

    failure_reason = Column(String(255), nullable=True)
    retry_count = Column(Integer, default=0)
    is_seed_data = Column(Boolean, default=False)

    delivered_at = Column(DateTime(timezone=True), default=utc_now)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(String(100), nullable=True)

    # Discreet escalations are visible to the guardian recipient only, never in the owner's alert list.
    is_discreet = Column(Boolean, default=False)

    # Relationships
    analysis = orm_relationship("ScamAnalysis", back_populates="alerts")
    contact = orm_relationship("TrustedContact", back_populates="alerts")


class PaymentSimulation(Base):
    __tablename__ = "payment_simulations"

    id = Column(Integer, primary_key=True, index=True)
    simulation_id = Column(String(50), unique=True, index=True, nullable=False)  # SIM-XXXXXX
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, default=1, index=True)

    vpa_or_account = Column(String(120), nullable=False)
    recipient_name = Column(String(120), nullable=True)
    is_new_recipient = Column(Boolean, default=True)
    requested_amount = Column(Float, nullable=False)
    purpose = Column(String(120), nullable=True)

    # Coercion / Social engineering factors
    pressure_present = Column(Boolean, default=False)
    authority_claimed = Column(Boolean, default=False)
    secrecy_demanded = Column(Boolean, default=False)
    guaranteed_returns = Column(Boolean, default=False)

    # Outcome: PROCEED_WITH_CAUTION, PAUSE_AND_VERIFY, SEEK_TRUSTED_HELP
    outcome = Column(String(40), nullable=False, index=True)
    risk_score = Column(Integer, nullable=False)  # 0 to 100
    severity = Column(String(20), nullable=False)  # "SAFE", "CAUTION", "HIGH_RISK"
    decision_rationale = Column(Text, nullable=False)
    evidence_factors = Column(Text, nullable=True)  # JSON array
    verification_steps = Column(Text, nullable=True)  # JSON array

    # "NONE", "DEMO_SIMULATED_ACTIVE_CALL", "USER_REPORTED_ACTIVE_CALL"
    call_state = Column(String(40), default="NONE")
    risk_signals = Column(Text, nullable=True)  # JSON array of explained signals
    guardian_approval_recommended = Column(Boolean, default=False)

    # Safety check-in outcome only (free-text answers are never stored)
    checkin_status = Column(String(20), default="NOT_STARTED")  # "NOT_STARTED", "COMPLETED"
    checkin_tier = Column(String(10), nullable=True)
    checkin_signal_codes = Column(Text, nullable=True)  # JSON array of codes
    checkin_completed_at = Column(DateTime(timezone=True), nullable=True)

    # "SANDBOX" (Payment Checkpoint) or "MOCK_UPI_SDK" (mock UPI app via SDK boundary)
    source = Column(String(30), default="SANDBOX")

    # Strictly marked simulation
    is_simulation = Column(Boolean, default=True)
    checked_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    # Relationships
    user = orm_relationship("UserProfile", back_populates="payment_simulations")


class TransactionRecord(Base):
    """
    Mock payment ledger used as transaction history for risk baselines.
    Seed rows and mock UPI app payments only; never a real bank or UPI record.
    """
    __tablename__ = "transaction_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, index=True)
    payee_vpa = Column(String(120), nullable=False, index=True)
    payee_name = Column(String(120), nullable=True)
    amount = Column(Float, nullable=False)
    category = Column(String(40), nullable=True)
    status = Column(String(20), default="COMPLETED")  # "COMPLETED", "CANCELLED"
    simulation_id = Column(String(50), nullable=True)
    is_mock = Column(Boolean, default=True)
    is_seed_data = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)


class GuardianApprovalRequest(Base):
    __tablename__ = "guardian_approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_ref = Column(String(30), unique=True, index=True, nullable=False)  # GA-XXXXXX
    simulation_id = Column(String(50), nullable=False, index=True)
    requester_user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, index=True)
    eligible_contact_ids = Column(Text, nullable=False)  # JSON array of TrustedContact ids
    amount = Column(Float, nullable=False)
    payee = Column(String(120), nullable=False)
    reason_codes = Column(Text, nullable=True)  # JSON array
    status = Column(String(20), default="PENDING", index=True)  # PENDING, APPROVED, DECLINED, EXPIRED, CANCELLED
    is_discreet = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by_user_id = Column(Integer, nullable=True)
    decided_by_contact_id = Column(Integer, nullable=True)
    decision_note = Column(String(280), nullable=True)


class SafetyPreference(Base):
    """
    Opt-in duress phrase settings. Only a salted PBKDF2 hash is stored; the phrase is never persisted.
    """
    __tablename__ = "safety_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, unique=True, index=True)
    duress_enabled = Column(Boolean, default=False)
    duress_phrase_hash = Column(String(200), nullable=True)
    duress_word_count = Column(Integer, nullable=True)
    duress_consent_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


# Legacy alias so existing queries/imports do not break
PaymentCheck = PaymentSimulation


class RecoveryDraft(Base):
    __tablename__ = "recovery_drafts"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, default=1)

    # Wizard details
    incident_datetime = Column(DateTime(timezone=True), nullable=True)
    scam_category = Column(String(80), nullable=True)
    communication_channel = Column(String(50), nullable=True)
    incident_narrative = Column(Text, nullable=True)
    financial_loss = Column(Float, default=0.0)
    transaction_reference = Column(String(100), nullable=True)  # Missing UTR allowed
    bank_or_app = Column(String(80), nullable=True)
    transfer_status = Column(String(30), default="COMPLETED")  # "PENDING", "COMPLETED"
    evidence_attachments = Column(Text, nullable=True)  # JSON array
    timeline_events = Column(Text, nullable=True)  # JSON array

    portal_complaint_text = Column(Text, nullable=False)  # For cybercrime.gov.in / 1930 Helpline
    bank_complaint_text = Column(Text, nullable=False)    # Bank Nodal Officer freeze dispute
    police_complaint_text = Column(Text, nullable=False)  # Formal police station format

    status = Column(String(30), default="DRAFT")  # "DRAFT", "REVIEWED", "EXPORTED"
    golden_hour_response = Column(Text, nullable=True)  # JSON of the one-tap (simulated) response
    generated_at = Column(DateTime(timezone=True), default=utc_now)
    last_edited_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    incident = orm_relationship("Incident", back_populates="recovery_drafts")


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    event_type = Column(String(60), nullable=False, index=True)  # "SCAN_EXECUTED", "ALERT_DISPATCHED", "INCIDENT_CREATED", "COMPLAINT_GENERATED", "CONTACT_VERIFIED", "PAYMENT_SIMULATION"
    entity_type = Column(String(50), nullable=True)  # "incident", "contact", "alert", "simulation"
    entity_id = Column(String(50), nullable=True, index=True)
    description = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True)


class CallerReputation(Base):
    """
    Caller reputation record indexed by E.164 normalized phone number.
    Maintains risk scores, fraud category, community report count,
    carrier verification flags, and IBM AI enriched summaries.
    """
    __tablename__ = "caller_reputations"

    id = Column(Integer, primary_key=True, index=True)
    normalized_number = Column(String(30), unique=True, index=True, nullable=False)  # e.g. +919876500001
    raw_display_number = Column(String(30), nullable=False)  # Formatted display
    display_tag = Column(String(100), nullable=True)  # e.g. "Suspected Digital Arrest Extortion"
    category = Column(String(60), default="UNKNOWN", index=True)  # "DIGITAL_ARREST", "KYC_FRAUD", "ELECTRICITY_SCAM", "COURIER_CUSTOMS", "LEGITIMATE_BUSINESS", "UNKNOWN"
    
    risk_score = Column(Integer, default=0, index=True)  # 0 to 100
    risk_level = Column(String(20), default="UNKNOWN", index=True)  # "LOW", "SUSPICIOUS", "HIGH", "CRITICAL", "UNKNOWN"
    confidence = Column(String(20), default="MEDIUM")  # "LOW", "MEDIUM", "HIGH"
    
    total_reports = Column(Integer, default=0)
    verified_reports = Column(Integer, default=0)
    upvotes_spam = Column(Integer, default=0)
    downvotes_safe = Column(Integer, default=0)
    
    carrier_verified = Column(Boolean, default=False)  # STIR/SHAKEN or carrier network signature
    carrier_name = Column(String(60), nullable=True)
    is_business = Column(Boolean, default=False)
    business_name = Column(String(120), nullable=True)
    
    ibm_summary = Column(Text, nullable=True)  # Grounded summary produced by IBM watsonx Granite
    ibm_enriched_at = Column(DateTime(timezone=True), nullable=True)
    evidence_signals = Column(Text, nullable=True)  # JSON array of detected behavioral signals
    recommended_action = Column(String(255), nullable=True)
    
    last_reported_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    reports = orm_relationship("CallerReport", back_populates="reputation", cascade="all, delete-orphan")


class CallerReport(Base):
    """
    Individual citizen reports of spam, extortion, or fraudulent calls.
    """
    __tablename__ = "caller_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=True, index=True)
    normalized_number = Column(String(30), ForeignKey("caller_reputations.normalized_number"), nullable=False, index=True)
    
    category = Column(String(60), nullable=False)  # "DIGITAL_ARREST", "KYC_FRAUD", "ELECTRICITY_SCAM", "COURIER_CUSTOMS", "LOTTERY_FRAUD", "HARASSMENT", "SAFE_BUSINESS"
    claimed_caller_name = Column(String(100), nullable=True)  # What name did the scammer claim? (e.g. "CBI Officer Sharma")
    description = Column(Text, nullable=True)
    call_type = Column(String(30), default="INCOMING")  # "INCOMING", "MISSED", "WHATSAPP_CALL"
    call_timestamp = Column(DateTime(timezone=True), default=utc_now)
    
    status = Column(String(30), default="VERIFIED", index=True)  # "PENDING", "VERIFIED", "DISPUTED", "REJECTED"
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    reputation = orm_relationship("CallerReputation", back_populates="reports")


class CallerBlocklist(Base):
    """
    Personal blocklist and allowlist rules configured by individual users.
    """
    __tablename__ = "caller_blocklists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False, index=True)
    normalized_number = Column(String(30), nullable=False, index=True)
    display_name = Column(String(100), nullable=True)
    action = Column(String(20), default="BLOCK")  # "BLOCK", "ALLOW", "WARN"
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class CallerLookupAudit(Base):
    """
    Audit log for caller reputation queries.
    Uses hashed number for privacy while maintaining statistical telemetry.
    """
    __tablename__ = "caller_lookup_audits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    number_hash = Column(String(64), nullable=False, index=True)  # SHA-256 for privacy
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="UNKNOWN")
    cache_hit = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True)

