export type RiskSeverity = 'SAFE' | 'CAUTION' | 'HIGH_RISK';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ConfidenceLabel = 'LOW' | 'MEDIUM' | 'HIGH';
export type InputType = 'text' | 'url' | 'image' | 'audio';
export type AnalysisMode = 'rule_based' | 'ai_assisted' | 'hybrid';
export type ChannelType = 'SMS' | 'WHATSAPP' | 'TELEGRAM' | 'EMAIL' | 'CALL_TRANSCRIPT' | 'APK_URL';
export type AlertLevel = 'ALL' | 'HIGH_RISK_ONLY' | 'CRITICAL_ONLY';
export type AlertStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED' | 'FAILED';
export type IncidentStatus = 'DRAFT' | 'UNDER_REVIEW' | 'REPORTED_1930' | 'BANK_FREEZE_REQUESTED' | 'RESOLVED';
export type PaymentOutcome = 'PROCEED_WITH_CAUTION' | 'PAUSE_AND_VERIFY' | 'SEEK_TRUSTED_HELP';

export interface UserProfile {
  id: number;
  full_name: string;
  phone_number: string;
  email?: string;
  role: 'PROTECTED_MEMBER' | 'GUARDIAN';
  preferred_language: string;
  city: string;
  bank_name: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface TrustedContact {
  id: number;
  user_id: number;
  name: string;
  relationship: string;
  phone_number: string;
  email?: string;
  alert_level: AlertLevel;
  is_active: boolean;
  is_primary: boolean;
  is_verified: boolean;
  consent_granted: boolean;
  contact_consent_status?: ContactConsentStatus;
  contact_consent_at?: string;
  verification_sent_at?: string;
  verified_at?: string;
  created_at: string;
}

export type ContactConsentStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface ContactInvitation {
  contact_id: number;
  owner_user_id: number;
  owner_name: string;
  relationship: string;
  contact_consent_status: ContactConsentStatus;
  owner_consent_granted: boolean;
  created_at: string;
}

export interface ContactInviteResponse {
  status: string;
  contact_id: number;
  expires_at: string;
  demo_invite_code: string;
  demo_mode: boolean;
  channel: string;
  message: string;
}

export interface ContactVerificationResponse {
  status: string;
  message: string;
  demo_verification_code: string;
  channel: string;
}

export interface ScamEvidence {
  id: number;
  factor_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  matched_text?: string;
}

export interface ScamAnalysis {
  id: number;
  incident_id?: string;
  input_text: string;
  channel: ChannelType;
  classification: string;
  risk_score: number;
  severity: RiskSeverity;
  risk_level?: RiskLevel;
  summary: string;
  advice: string;
  suggested_action?: string;
  is_flagged_for_family: boolean;
  is_seed_data: boolean;
  created_at: string;
  evidence_items: ScamEvidence[];
}

export type PolicyTier = 'GREEN' | 'AMBER' | 'RED';

export interface DetectedSignal {
  reason_code?: string;
  signal_type: string;
  severity: string;
  reason: string;
  excerpt?: string;
  weight: number;
}

export interface AnalysisResult {
  incident_id: string;
  input_type: InputType;
  risk_level: RiskLevel;
  risk_score: number;
  policy_tier?: PolicyTier;
  confidence_label: ConfidenceLabel;
  verdict: string;
  plain_language_summary: string;
  detected_signals: DetectedSignal[];
  counter_signals?: DetectedSignal[];
  reason_codes?: string[];
  supporting_evidence: string[];
  recommended_actions: string[];
  recommended_action?: string;
  verification_steps: string[];
  should_alert_family: boolean;
  ai_provider: string;
  analysis_mode: AnalysisMode;
  limitations: string[];
  classification: string;
  severity: RiskSeverity;
  summary: string;
  advice: string;
  suggested_action?: string;
  is_flagged_for_family: boolean;
  evidence_items: Array<{
    factor_type: string;
    severity: string;
    description: string;
    matched_text: string;
  }>;
}

export interface ImageUploadResult {
  filename: string;
  mime_type: string;
  size_bytes: number;
  ocr_available: boolean;
  extracted_text?: string;
  analysis?: AnalysisResult;
  message: string;
}

export interface AudioUploadResult {
  filename: string;
  mime_type: string;
  size_bytes: number;
  speech_recognition_available: boolean;
  transcript?: string;
  analysis?: AnalysisResult;
  message: string;
}

export interface PresetSample {
  id: string;
  title: string;
  category: string;
  channel: ChannelType;
  text: string;
  description: string;
}

export interface FamilyAlert {
  id: number;
  incident_id?: string;
  analysis_id?: number;
  contact_id: number;
  user_id: number;
  threat_title: string;
  message_content: string;
  risk_level: string;
  recommended_action?: string;
  delivery_channel: string;
  status: AlertStatus;
  failure_reason?: string;
  retry_count: number;
  is_seed_data: boolean;
  delivered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  contact?: TrustedContact;
}

export interface PaymentSimulation {
  id: number;
  simulation_id: string;
  vpa_or_account: string;
  recipient_name?: string;
  is_new_recipient: boolean;
  requested_amount: number;
  purpose?: string;
  pressure_present: boolean;
  authority_claimed: boolean;
  secrecy_demanded: boolean;
  guaranteed_returns: boolean;
  outcome: PaymentOutcome;
  risk_score: number;
  severity: RiskSeverity;
  decision_rationale: string;
  evidence_factors: string[];
  verification_steps: string[];
  policy_tier?: PolicyTier;
  call_state?: CallState;
  risk_signals?: RiskSignal[];
  history_summary?: Record<string, number | string>;
  guardian_approval_recommended?: boolean;
  eligible_guardian_count?: number;
  checkin_status?: 'NOT_STARTED' | 'COMPLETED';
  checkin_tier?: PolicyTier | null;
  source?: 'SANDBOX' | 'MOCK_UPI_SDK';
  is_simulation: boolean;
  disclaimer: string;
  checked_at: string;
}

export type CallState = 'NONE' | 'DEMO_SIMULATED_ACTIVE_CALL' | 'USER_REPORTED_ACTIVE_CALL';

export interface RiskSignal {
  code: string;
  label: string;
  points: number;
  explanation: string;
  source: string;
}

export type CheckinLanguage = 'en' | 'hi' | 'mr' | 'kn';

export interface CheckinQuestion {
  id: string;
  kind: 'single_choice' | 'free_text';
  prompt: string;
  prompt_en: string;
  optional: boolean;
  options: { value: string; label: string }[];
  step: number;
  total_estimate: number;
}

export type CheckinAction = 'DO_NOT_PAY' | 'WAIT_FOR_GUARDIAN' | 'PAUSE_AND_VERIFY' | 'PROCEED_WITH_CARE';

export interface CheckinResult {
  final_tier: PolicyTier;
  recommended_action: CheckinAction;
  message: string;
  answers_could_not_clear: boolean;
  answers_could_not_clear_message?: string | null;
  reasons: { code: string; label: string }[];
  guardian_request_ref?: string | null;
  eligible_guardian_count: number;
}

export interface CheckinResponse {
  simulation_id: string;
  language: CheckinLanguage;
  status: 'IN_PROGRESS' | 'COMPLETED';
  engine: string;
  engine_note: string;
  next_question?: CheckinQuestion | null;
  result?: CheckinResult | null;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface GuardianApproval {
  request_ref: string;
  simulation_id: string;
  requester_name: string;
  amount: number;
  payee: string;
  status: ApprovalStatus;
  created_at: string;
  expires_at: string;
  decided_at?: string | null;
  decision_note?: string | null;
  viewer_role: 'REQUESTER' | 'GUARDIAN';
  reason_codes: string[];
  guardian_guidance?: string | null;
}

export interface DuressSettings {
  enabled: boolean;
  configured_at?: string | null;
  eligible_guardian_count: number;
  how_it_works: string;
}

export type SdkDecisionType = 'ALLOW' | 'CHECKIN_REQUIRED' | 'GUARDIAN_APPROVAL_REQUIRED' | 'BLOCK_RECOMMENDED';

export interface SdkDecision {
  sdk_version: string;
  decision: SdkDecisionType;
  simulation_id: string;
  policy_tier: PolicyTier;
  risk_score: number;
  risk_signals: RiskSignal[];
  checkin_status: string;
  guardian_request_ref?: string | null;
  guardian_status?: ApprovalStatus | null;
  can_complete: boolean;
  user_message: string;
  integration_notice: string;
}

export interface SdkCompleteResponse {
  simulation_id: string;
  status: 'COMPLETED' | 'CANCELLED';
  transaction_id?: number;
  message: string;
  is_mock: boolean;
}

export interface MockLedgerEntry {
  id: number;
  payee_vpa: string;
  payee_name?: string;
  amount: number;
  status: string;
  simulation_id?: string;
  is_seed_data: boolean;
  created_at: string;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  status: 'NOT_CONFIGURED' | 'CONFIGURED_UNVERIFIED' | 'NOT_INTEGRATED' | 'SIMULATED' | string;
  active_for_scanner: boolean;
  detail: string;
  used_by: string[];
}

// Legacy alias
export type PaymentCheck = PaymentSimulation;

export interface SavePaymentIncidentResponse {
  status: string;
  incident_id: string;
  title: string;
  financial_loss: number;
  already_persisted: boolean;
}

export interface RecoveryDraft {
  id: number;
  incident_id: number;
  user_id: number;
  incident_datetime?: string;
  scam_category?: string;
  financial_loss: number;
  transaction_reference?: string;
  bank_or_app?: string;
  transfer_status?: string;
  portal_complaint_text: string;
  bank_complaint_text: string;
  police_complaint_text: string;
  missing_fields_notice?: string;
  reporting_disclaimer: string;
  status: string;
  generated_at: string;
  incident_reference?: string;
}

export interface BankFreezeResponse {
  success: boolean;
  freeze_reference: string;
  bank_name: string;
  status: string;
  timestamp: string;
  nodal_desk_assigned: string;
  action_summary: string;
  gateway_protocol: string;
  is_simulation?: boolean;
  simulation_notice?: string;
}

export interface CybercrimePortalSubmitResponse {
  success: boolean;
  portal_ack_number: string;
  filing_timestamp: string;
  jurisdiction: string;
  status: string;
  next_steps: string[];
  is_simulation?: boolean;
  simulation_notice?: string;
}

export interface GoldenHourAction {
  key: 'CYBERCRIME_CELL' | 'BANK_LIEN' | 'CYBER_POLICE' | string;
  title: string;
  recipient: string;
  reference: string;
  channel: string;
  status: string;
  subject: string;
  body: string;
  completed_at: string;
  real_next_step: string;
  real_action_label: string;
  real_action_url: string;
}

export interface GoldenHourResponse {
  draft_id: number;
  incident_reference?: string | null;
  activated_at: string;
  actions: GoldenHourAction[];
  already_activated: boolean;
  is_simulation: boolean;
  simulation_notice: string;
}

export interface RecoveryCaseContextResponse {
  incident_id: string;
  analysis_id?: number;
  title: string;
  scam_type: string;
  description: string;
  financial_loss: number;
  bank_name?: string;
  transaction_ref?: string;
  suspect_contact?: string;
  incident_date?: string;
  status: string;
  severity: string;
  risk_level: string;
  risk_score: number;
  timeline_events: string[];
  message_transcript?: string;
  latest_draft?: RecoveryDraft;
}

export interface RecoveryWizardRequest {
  incident_id?: string;
  incident_datetime?: string;
  scam_type: string;
  communication_channel: string;
  description: string;
  financial_loss: number;
  transaction_ref?: string;
  bank_name?: string;
  transfer_status: string;
  suspect_contact?: string;
  message_transcript?: string;
  timeline_events: string[];
  evidence_attachments: string[];
}

export interface Incident {
  id: number;
  incident_id: string;
  user_id: number;
  analysis_id?: number;
  title: string;
  scam_type: string;
  description: string;
  financial_loss: number;
  currency: string;
  bank_name?: string;
  transaction_ref?: string;
  suspect_contact?: string;
  incident_date: string;
  status: IncidentStatus;
  severity: RiskSeverity;
  risk_level: RiskLevel;
  risk_score: number;
  is_seed_data: boolean;
  created_at: string;
  updated_at?: string;
  recovery_drafts: RecoveryDraft[];
}

export interface AuditEvent {
  id: number;
  user_id?: number;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  description: string;
  timestamp: string;
}

export interface OverviewStats {
  total_analyses: number;
  high_risk_analyses: number;
  caution_analyses: number;
  safe_analyses: number;
  total_family_alerts: number;
  active_trusted_contacts: number;
  total_incidents: number;
  recovery_cases_created: number;
  total_loss_recorded: number;
  recent_incidents: Incident[];
  recent_analyses: ScamAnalysis[];
}

export interface SystemSettings {
  app_name: string;
  app_env: string;
  analysis_provider: string;
  watsonx_configured: boolean;
  enable_demo_seed: boolean;
  watsonx_apikey?: string;
  watsonx_project_id?: string;
}

export interface BankHelpline {
  bank: string;
  toll_free: string;
  sms_block?: string;
  email?: string;
  portal?: string;
  description?: string;
  action?: string;
}

export interface HelplinesResponse {
  emergency_helplines: BankHelpline[];
  official_guidance?: {
    primary_helpline: string;
    primary_portal: string;
    disclaimer: string;
    golden_hour_timeline: string;
  };
  golden_hour_protocol: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user_id: number;
  role: string;
  full_name: string;
}

export interface LoginCredentials {
  identifier: string;
  passcode: string;
}
