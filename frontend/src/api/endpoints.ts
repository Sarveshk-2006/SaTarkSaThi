import { apiClient } from './client';
import {
  UserProfile,
  TrustedContact,
  ContactVerificationResponse,
  ScamAnalysis,
  PresetSample,
  FamilyAlert,
  PaymentSimulation,
  PaymentCheck,
  Incident,
  RecoveryDraft,
  RecoveryWizardRequest,
  AuditEvent,
  OverviewStats,
  SystemSettings,
  HelplinesResponse,
  AnalysisResult,
  ImageUploadResult,
  AudioUploadResult,
  BankFreezeResponse,
  CybercrimePortalSubmitResponse,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export const api = {
  // Health
  checkHealth: () => apiClient.get<{ status: string; app_name: string; database: string }>('/health'),

  // Stats / Overview
  getOverviewStats: () => apiClient.get<OverviewStats>('/stats/overview'),

  // Legacy Scanner (backward compat)
  getPresets: () => apiClient.get<PresetSample[]>('/scanner/presets'),
  analyzeMessage: (text: string, channel: string = 'SMS') =>
    apiClient.post<ScamAnalysis>('/scanner/analyze', { text, channel }),
  getAnalysisHistory: (limit: number = 50) =>
    apiClient.get<ScamAnalysis[]>(`/scanner/history?limit=${limit}`),
  getAnalysisDetail: (id: number) => apiClient.get<ScamAnalysis>(`/scanner/${id}`),

  // ── V1 Analysis API ─────────────────────────────────────────────────────
  analyzeText: (text: string, channel: string = 'SMS') =>
    apiClient.post<AnalysisResult>('/v1/analyze', { text, channel }),

  analyzeUrl: (url: string) =>
    apiClient.post<AnalysisResult>('/v1/analyze/url', { url }),

  analyzeImage: async (file: File, extractedText?: string): Promise<ImageUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    if (extractedText) {
      formData.append('extracted_text', extractedText);
    }
    const url = `${BASE_URL}/v1/analyze/image`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || data?.message || 'Image analysis failed');
      }
      return response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Image upload timed out');
      throw err;
    }
  },

  analyzeAudio: async (file: File | null, transcript?: string): Promise<AudioUploadResult> => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (transcript) {
      formData.append('transcript', transcript);
    }
    const url = `${BASE_URL}/v1/analyze/audio`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || data?.message || 'Audio analysis failed');
      }
      return response.json();
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') throw new Error('Audio upload timed out');
      throw err;
    }
  },

  // Family Shield Contacts
  getContacts: () => apiClient.get<TrustedContact[]>('/contacts'),
  createContact: (data: Partial<TrustedContact>) => apiClient.post<TrustedContact>('/contacts', data),
  updateContact: (id: number, data: Partial<TrustedContact>) =>
    apiClient.put<TrustedContact>(`/contacts/${id}`, data),
  deleteContact: (id: number) => apiClient.delete(`/contacts/${id}`),
  requestContactVerification: (contactId: number) =>
    apiClient.post<ContactVerificationResponse>(`/contacts/${contactId}/verify/request`),
  confirmContactVerification: (contactId: number, code: string) =>
    apiClient.post<TrustedContact>(`/contacts/${contactId}/verify/confirm`, { code }),

  // Family Alerts
  getAlerts: () => apiClient.get<FamilyAlert[]>('/alerts'),
  dispatchAlert: (data: {
    contact_ids: number[];
    threat_title: string;
    message_content: string;
    delivery_channel?: string;
    analysis_id?: number;
    incident_id?: string;
    risk_level?: string;
    recommended_action?: string;
  }) => apiClient.post<FamilyAlert[]>('/alerts/dispatch', data),
  acknowledgeAlert: (alertId: number) => apiClient.post<FamilyAlert>(`/alerts/${alertId}/acknowledge`),
  retryAlert: (alertId: number) => apiClient.post<FamilyAlert>(`/alerts/${alertId}/retry`),

  // Payment Checkpoint Sandbox Simulation
  simulatePayment: (data: {
    vpa_or_account: string;
    recipient_name?: string;
    is_new_recipient?: boolean;
    requested_amount: number;
    purpose?: string;
    pressure_present?: boolean;
    authority_claimed?: boolean;
    secrecy_demanded?: boolean;
    guaranteed_returns?: boolean;
  }) => apiClient.post<PaymentSimulation>('/payment/simulate', data),
  getPaymentSimulations: () => apiClient.get<PaymentSimulation[]>('/payment/simulations'),
  // Legacy alias
  checkPayment: (data: {
    vpa_or_account: string;
    recipient_name?: string;
    requested_amount?: number;
    purpose?: string;
  }) => apiClient.post<PaymentCheck>('/payment/check', data),

  // Incidents & Cases
  getIncidents: (params?: {
    search?: string;
    scam_type?: string;
    risk_level?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.scam_type) searchParams.set('scam_type', params.scam_type);
    if (params?.risk_level) searchParams.set('risk_level', params.risk_level);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    const query = searchParams.toString();
    return apiClient.get<Incident[]>(`/incidents${query ? `?${query}` : ''}`);
  },
  getIncident: (id: string | number) => apiClient.get<Incident>(`/incidents/${id}`),
  createIncident: (data: Partial<Incident>) => apiClient.post<Incident>('/incidents', data),
  updateIncident: (id: string | number, data: Partial<Incident>) =>
    apiClient.put<Incident>(`/incidents/${id}`, data),
  deleteIncident: (id: string | number) => apiClient.delete(`/incidents/${id}`),
  getIncidentAudit: (id: string | number) => apiClient.get<AuditEvent[]>(`/incidents/${id}/audit`),

  // Golden Hour Recovery
  getHelplines: () => apiClient.get<HelplinesResponse>('/recovery/helplines'),
  executeRecoveryWizard: (data: RecoveryWizardRequest) =>
    apiClient.post<RecoveryDraft>('/recovery/wizard', data),
  updateRecoveryDraft: (draftId: number, data: { portal_complaint_text?: string; bank_complaint_text?: string; police_complaint_text?: string; status?: string }) =>
    apiClient.put<RecoveryDraft>(`/recovery/drafts/${draftId}`, data),
  getRecoveryDraftExportUrl: (draftId: number, format: 'txt' | 'markdown' = 'txt') =>
    `${BASE_URL}/recovery/drafts/${draftId}/export?format=${format}`,
  generateRecoveryDraft: (incidentId: number) =>
    apiClient.post<RecoveryDraft>(`/recovery/draft/${incidentId}`),
  submitBankFreeze: (data: {
    incident_id?: string;
    bank_name: string;
    account_number_last4?: string;
    transaction_amount: number;
    suspect_vpa_or_account: string;
    utr_number?: string;
  }) => apiClient.post<BankFreezeResponse>('/recovery/submit-bank-freeze', data),
  submitCybercrimePortal: (data: {
    incident_id?: string;
    complaint_text: string;
    scam_category?: string;
    financial_loss: number;
    suspect_details?: string;
  }) => apiClient.post<CybercrimePortalSubmitResponse>('/recovery/submit-cybercrime-portal', data),
  getCarrierLogs: () => apiClient.get<any>('/alerts/carrier-logs'),

  // Settings & Profile
  getSettings: () => apiClient.get<SystemSettings>('/settings'),
  updateSettings: (data: Partial<SystemSettings>) => apiClient.put<SystemSettings>('/settings/system', data),
  getProfile: () => apiClient.get<UserProfile>('/settings/profile'),
  updateProfile: (data: Partial<UserProfile>) => apiClient.put<UserProfile>('/settings/profile', data),
  resetDatabase: (seedDemoData: boolean = true) =>
    apiClient.post<{ status: string; message: string; seeded: boolean }>('/settings/reset-database', {
      seed_demo_data: seedDemoData,
    }),

  // Benchmark Evaluation
  getEvaluationMetrics: () => apiClient.get<any>('/evaluation/metrics'),
  runEvaluation: () => apiClient.post<any>('/evaluation/run'),
};
