import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  LifeBuoy,
  PhoneCall,
  Building2,
  ExternalLink,
  CheckCircle2,
  Download,
  Edit3,
  Save,
  ChevronRight,
  ChevronLeft,
  Paperclip,
  Calendar,
  Info,
  Zap,
  Send,
  ShieldAlert,
  AlertOctagon,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { api } from '../api/endpoints';
import {
  RecoveryDraft,
  BankHelpline,
  RecoveryWizardRequest,
  BankFreezeResponse,
  CybercrimePortalSubmitResponse,
} from '../api/types';
import { CopyButton } from '../components/common/CopyButton';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { SimulationBanner } from '../components/common/SimulationBanner';
import { useToast } from '../context/ToastContext';

export const GoldenHourRecoveryPage: React.FC = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();

  const [helplines, setHelplines] = useState<BankHelpline[]>([]);
  const [loading, setLoading] = useState(true);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseLoadError, setCaseLoadError] = useState<string | null>(null);

  // 4-Step Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [linkedIncidentId, setLinkedIncidentId] = useState<string | null>(null);

  // Step 1: Incident Info
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [scamType, setScamType] = useState('Digital Arrest Scam');
  const [channel, setChannel] = useState('WhatsApp Video Call');
  const [description, setDescription] = useState('');

  // Step 2: Financial Info (Missing UTR explicitly allowed!)
  const [financialLoss, setFinancialLoss] = useState<string>('25000');
  const [transactionRef, setTransactionRef] = useState('');
  const [bankName, setBankName] = useState('State Bank of India');
  const [transferStatus, setTransferStatus] = useState<'COMPLETED' | 'PENDING'>('COMPLETED');

  // Step 3: Evidence & Timeline
  const [suspectContact, setSuspectContact] = useState('+91 98201 98201');
  const [messageTranscript, setMessageTranscript] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<string[]>([
    'Received threat message citing PMLA investigation',
    'Instructed to stay on Skype video call in isolated room',
    'Transferred funds to purported police clearing account'
  ]);
  const [newTimelineEvent, setNewTimelineEvent] = useState('');

  // Step 4: Recovery Drafts & Review
  const [generatedDraft, setGeneratedDraft] = useState<RecoveryDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [activeTab, setActiveTab] = useState<'PORTAL' | 'BANK' | 'POLICE'>('PORTAL');

  // Editable draft states
  const [editedPortalText, setEditedPortalText] = useState('');
  const [editedBankText, setEditedBankText] = useState('');
  const [editedPoliceText, setEditedPoliceText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const qId = searchParams.get('incident_id') || searchParams.get('incidentId');
    const state = location.state as any;
    const effectiveIncidentId = qId || state?.incidentId;

    if (state?.incidentId && !qId) {
      setSearchParams({ incident_id: state.incidentId }, { replace: true });
    }

    if (effectiveIncidentId) {
      setLinkedIncidentId(effectiveIncidentId);
      setCaseLoading(true);
      setCaseLoadError(null);
      api.getRecoveryCase(effectiveIncidentId)
        .then((caseData) => {
          setLinkedIncidentId(caseData.incident_id);
          if (caseData.scam_type) setScamType(caseData.scam_type);
          if (caseData.description) setDescription(caseData.description);
          if (caseData.financial_loss !== undefined && caseData.financial_loss !== null) {
            setFinancialLoss(caseData.financial_loss.toString());
          }
          if (caseData.bank_name) setBankName(caseData.bank_name);
          if (caseData.transaction_ref) setTransactionRef(caseData.transaction_ref);
          if (caseData.suspect_contact) setSuspectContact(caseData.suspect_contact);
          if (caseData.incident_date) setIncidentDate(caseData.incident_date.slice(0, 16));
          if (caseData.timeline_events && caseData.timeline_events.length > 0) {
            setTimelineEvents(caseData.timeline_events);
          }
          if (caseData.message_transcript) {
            setMessageTranscript(caseData.message_transcript);
          }
          if (caseData.latest_draft) {
            setGeneratedDraft(caseData.latest_draft);
            setEditedPortalText(caseData.latest_draft.portal_complaint_text);
            setEditedBankText(caseData.latest_draft.bank_complaint_text);
            setEditedPoliceText(caseData.latest_draft.police_complaint_text);
            setWizardStep(4);
          }
        })
        .catch((err: any) => {
          const detail = err?.message || 'Unauthorized or incident not found';
          setCaseLoadError(`Failed to load incident record (${effectiveIncidentId}): ${detail}`);
        })
        .finally(() => {
          setCaseLoading(false);
        });
    } else {
      if (state?.classification) {
        setScamType(state.classification);
        setDescription(state.summary || '');
        if (state.extractedText) setMessageTranscript(state.extractedText);
      }
      if (state?.financialLoss) {
        setFinancialLoss(state.financialLoss.toString());
      }
      if (state?.recipient) {
        setSuspectContact(state.recipient);
      }
      if (state?.bankName) {
        setBankName(state.bankName);
      }
    }

    api.getHelplines()
      .then((hData) => {
        setHelplines(hData.emergency_helplines || []);
      })
      .catch((err) => {
        showToast({ type: 'error', title: 'Failed to load recovery resources', message: err.message });
      })
      .finally(() => setLoading(false));
  }, [searchParams, location.state]);

  const handleAddTimelineEvent = () => {
    if (newTimelineEvent.trim()) {
      setTimelineEvents([...timelineEvents, newTimelineEvent.trim()]);
      setNewTimelineEvent('');
    }
  };

  const handleRemoveTimelineEvent = (idx: number) => {
    setTimelineEvents(timelineEvents.filter((_, i) => i !== idx));
  };

  const handleExecuteWizard = async () => {
    if (!description.trim()) {
      showToast({ type: 'warning', title: 'Narrative Required', message: 'Please describe the incident in Step 1.' });
      setWizardStep(1);
      return;
    }

    setIsGenerating(true);
    try {
      const payload: RecoveryWizardRequest = {
        incident_id: linkedIncidentId || undefined,
        incident_datetime: incidentDate ? new Date(incidentDate).toISOString() : undefined,
        scam_type: scamType,
        communication_channel: channel,
        description: description.trim(),
        financial_loss: financialLoss ? parseFloat(financialLoss) : 0.0,
        transaction_ref: transactionRef.trim() || undefined, // Missing UTR allowed
        bank_name: bankName,
        transfer_status: transferStatus,
        suspect_contact: suspectContact.trim() || undefined,
        message_transcript: messageTranscript.trim() || undefined,
        timeline_events: timelineEvents,
        evidence_attachments: [],
      };

      const draft = await api.executeRecoveryWizard(payload);
      setGeneratedDraft(draft);
      setEditedPortalText(draft.portal_complaint_text);
      setEditedBankText(draft.bank_complaint_text);
      setEditedPoliceText(draft.police_complaint_text);
      setWizardStep(4);

      showToast({
        type: 'success',
        title: 'Golden Hour Drafts Generated',
        message: 'Pre-filled complaints ready for Cyber Crime 1930 and your Bank Nodal Officer.',
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Wizard Error', message: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraftEdits = async () => {
    if (!generatedDraft) return;
    setIsSavingEdit(true);
    try {
      const updated = await api.updateRecoveryDraft(generatedDraft.id, {
        portal_complaint_text: editedPortalText,
        bank_complaint_text: editedBankText,
        police_complaint_text: editedPoliceText,
        status: 'REVIEWED'
      });
      setGeneratedDraft(updated);
      setIsEditingDraft(false);
      showToast({ type: 'success', title: 'Edits Saved', message: 'Complaint drafts successfully updated.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExportTxt = () => {
    if (!generatedDraft) return;
    const url = api.getRecoveryDraftExportUrl(generatedDraft.id, 'txt');
    window.open(url, '_blank');
  };

  // Automated Banking Freeze & Cybercrime Portal e-Filing
  const [bankFreezeReceipt, setBankFreezeReceipt] = useState<BankFreezeResponse | null>(null);
  const [isFreezingBank, setIsFreezingBank] = useState(false);
  const [cybercrimeAckReceipt, setCybercrimeAckReceipt] = useState<CybercrimePortalSubmitResponse | null>(null);
  const [isSubmittingPortal, setIsSubmittingPortal] = useState(false);

  const handleDispatchBankFreeze = async () => {
    setIsFreezingBank(true);
    try {
      const res = await api.submitBankFreeze({
        incident_id: linkedIncidentId || undefined,
        bank_name: bankName || 'State Bank of India',
        account_number_last4: '9821',
        transaction_amount: parseFloat(financialLoss) || 0,
        suspect_vpa_or_account: suspectContact || 'suspect@fakeupi',
        utr_number: transactionRef || undefined,
      });
      setBankFreezeReceipt(res);
      showToast({
        type: 'success',
        title: 'Interbank Freeze Initiated',
        message: `Lien request dispatched under protocol: ${res.freeze_reference}`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Freeze Dispatch Failed', message: err.message });
    } finally {
      setIsFreezingBank(false);
    }
  };

  const handleSubmitCybercrimePortal = async () => {
    setIsSubmittingPortal(true);
    try {
      const res = await api.submitCybercrimePortal({
        incident_id: linkedIncidentId || undefined,
        complaint_text: editedPortalText || 'Cyber Financial Fraud complaint details pending police verification.',
        scam_category: scamType || 'Cyber Financial Fraud',
        financial_loss: parseFloat(financialLoss) || 0,
        suspect_details: suspectContact || undefined,
      });
      setCybercrimeAckReceipt(res);
      showToast({
        type: 'success',
        title: 'Cybercrime Portal e-Filing Registered',
        message: `National Portal Acknowledgement issued: ${res.portal_ack_number}`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'e-Filing Failed', message: err.message });
    } finally {
      setIsSubmittingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-bold text-slate-900">Golden Hour Recovery Desk</h1>
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SimulationBanner message="Golden Hour Incident Recovery prepares verified, structured dispute drafts for cyber authorities and bank nodal desks. Dispatches under Step 4 demonstrate prototype electronic freeze formatting without creating real FIR police filings." />

      {/* 1930 Cyber Fraud Helpline Urgent Banner (Mandatory Requirement) */}
      <div className="bg-[#991B1B] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border border-red-700/60">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shrink-0">
            <PhoneCall className="w-8 h-8 text-white animate-bounce-short" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white text-[#991B1B]">
                CRITICAL GOLDEN HOUR ACTION
              </span>
              <span className="text-xs text-red-100 font-medium">Within 2 to 3 Hours</span>
            </div>
            <h2 className="text-xl font-bold mt-1 tracking-tight">
              Dial 1930 &bull; Citizen Cyber Fraud Reporting System
            </h2>
            <p className="text-xs text-red-100 mt-1 max-w-xl leading-relaxed">
              If money has been debited, call <strong>1930 immediately</strong> and register at{' '}
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="underline font-bold text-white hover:text-amber-200">
                cybercrime.gov.in
              </a>. Initiates inter-bank lien marking to freeze funds before mule ATM withdrawals.
              <span className="block mt-1 text-[11px] text-red-200 font-normal">
                *Notice: Official reporting initiates immediate tracing, but does not guarantee recovery.
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="tel:1930"
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#991B1B] font-bold text-sm flex items-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-[#991B1B]" />
            Call 1930 Now
          </a>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 rounded-xl bg-red-950/60 hover:bg-red-950 text-white font-medium text-xs flex items-center gap-1.5 border border-red-400/30 cursor-pointer"
          >
            Portal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Step Wizard Progress Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-[#176B58]" />
                Golden Hour Incident Recovery Wizard
              </h1>
              {linkedIncidentId && (
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#DCEDE5] text-[#176B58] border border-teal-200">
                  Case #{linkedIncidentId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compile non-fabricated, structured dispute drafts for cyber authorities and bank nodal desks.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
            Step {wizardStep} of 4
          </span>
        </div>

        {/* Case Hydration Loading State */}
        {caseLoading && (
          <div className="p-3 bg-[#DCEDE5] border border-teal-200 rounded-xl text-xs text-[#176B58] flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-[#176B58] animate-spin" />
            <span>Retrieving authoritative incident dossier from backend...</span>
          </div>
        )}

        {/* Case Hydration Error State */}
        {caseLoadError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Record Access Alert</p>
              <p className="mt-0.5 text-[11px]">{caseLoadError}</p>
              <p className="mt-1 text-[10px] text-slate-500">
                You can continue entering details manually. Note that only authorized owners or consented guardians may link official recovery cases.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { step: 1, label: '1. Incident Info' },
            { step: 2, label: '2. Financial Details' },
            { step: 3, label: '3. Evidence & Timeline' },
            { step: 4, label: '4. Recovery Actions' },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                if (generatedDraft || s.step < wizardStep) setWizardStep(s.step as any);
              }}
              className={`py-2 px-1 rounded-xl font-semibold transition-all border ${
                wizardStep === s.step
                  ? 'bg-[#176B58] text-white border-[#176B58] shadow-sm'
                  : wizardStep > s.step
                  ? 'bg-[#DCEDE5] text-[#176B58] border-teal-200 cursor-pointer'
                  : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wizard Step 1: Incident Info */}
      {wizardStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#176B58]" />
            Step 1: Incident Particulars
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Approximate Date & Time of Incident *
              </label>
              <input
                type="datetime-local"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category of Cyber Fraud *
              </label>
              <select
                value={scamType}
                onChange={(e) => setScamType(e.target.value)}
                className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
              >
                <option value="Digital Arrest Scam">Digital Arrest Scam (Fake Police / CBI)</option>
                <option value="Utility Impersonation Phishing">Electricity Bill Disconnection Threat</option>
                <option value="Part-Time Job / Telegram Task Fraud">Prepaid Task / Job Offer Fraud</option>
                <option value="Fake Investment Scheme">High-Yield Guaranteed Investment Ponzi</option>
                <option value="Courier / Customs Duty Fraud">Customs / Fedex Parcel Extortion</option>
                <option value="Bank KYC / SIM Block Fraud">Bank Account KYC Deactivation Phishing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact Channel Used by Scammer *
            </label>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder="e.g. WhatsApp Video Call (+91 98201 98201), Skype, Telegram"
              className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Incident Narrative / Statement of Facts *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain clearly what happened: who called, what claims were made, what pressure was applied..."
              className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58] leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              disabled={!description.trim()}
              className="px-6 py-2.5 rounded-xl bg-[#176B58] hover:bg-[#125243] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              Continue to Financial Details
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 2: Financial Information */}
      {wizardStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#176B58]" />
            Step 2: Financial Details &amp; Transaction References
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Amount Lost or at Risk (INR) *
              </label>
              <input
                type="number"
                min="0"
                value={financialLoss}
                onChange={(e) => setFinancialLoss(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58] font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Complainant Bank / Payment App
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India, HDFC Bank, Google Pay"
                className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Transaction Reference / UTR Number
                </label>
                <span className="text-[10px] text-[#176B58] font-semibold bg-[#DCEDE5] px-2 py-0.5 rounded">
                  Optional / Missing UTR Allowed
                </span>
              </div>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Leave blank if UTR is not yet available"
                className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58] font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If omitted, the complaint draft will explicitly indicate &quot;[UTR PENDING BANK STATEMENT]&quot; without fabricating numbers.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transfer Status
              </label>
              <select
                value={transferStatus}
                onChange={(e) => setTransferStatus(e.target.value as any)}
                className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
              >
                <option value="COMPLETED">Completed (Amount already debited)</option>
                <option value="PENDING">Pending / In-Transit (Dispute immediately)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className="px-6 py-2.5 rounded-xl bg-[#176B58] hover:bg-[#125243] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
            >
              Continue to Evidence & Timeline
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 3: Evidence & Timeline */}
      {wizardStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-[#176B58]" />
            Step 3: Evidence &amp; Incident Timeline
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Suspect Identifiers (Phone, UPI ID, Bank Account)
            </label>
            <input
              type="text"
              value={suspectContact}
              onChange={(e) => setSuspectContact(e.target.value)}
              placeholder="e.g. +91 98201 98201, officer-cbi@ybl"
              className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Message / Voice-Note Transcript Excerpt (Optional)
            </label>
            <textarea
              rows={3}
              value={messageTranscript}
              onChange={(e) => setMessageTranscript(e.target.value)}
              placeholder="Paste exact text received from scammer..."
              className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58] leading-relaxed"
            />
          </div>

          {/* Timeline Events Builder */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chronological Timeline of Events
            </label>
            <div className="space-y-2 mb-3">
              {timelineEvents.map((evt, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                  <span className="font-medium">{idx + 1}. {evt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTimelineEvent(idx)}
                    className="text-slate-400 hover:text-red-600 text-xs font-bold px-1"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTimelineEvent}
                onChange={(e) => setNewTimelineEvent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTimelineEvent())}
                placeholder="Add milestone (e.g. 11:30 AM caller threatened arrest)..."
                className="flex-1 py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
              />
              <button
                type="button"
                onClick={handleAddTimelineEvent}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer shrink-0"
              >
                Add Event
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleExecuteWizard}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl bg-[#176B58] hover:bg-[#125243] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? 'Generating Structured Drafts...' : 'Generate Official Complaint Drafts'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 4: Recovery Actions & Draft Review */}
      {wizardStep === 4 && generatedDraft && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-0">
          <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B58] bg-[#DCEDE5] px-2.5 py-0.5 rounded-full">
                Step 4: Formal Recovery Dossier
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Review, Edit &amp; Export Complaint Drafts
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every detail is editable before submission. Do NOT auto-submit to police; review thoroughly first.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isEditingDraft ? (
                <button
                  type="button"
                  onClick={handleSaveDraftEdits}
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isSavingEdit ? 'Saving...' : 'Save Edits'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingDraft(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-slate-600" />
                  Edit Draft
                </button>
              )}

              <button
                type="button"
                onClick={handleExportTxt}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export TXT Dossier
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-[#176B58] hover:bg-[#135948] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Missing Fields Notice */}
          {generatedDraft.missing_fields_notice && (
            <div className="mx-6 mt-6 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{generatedDraft.missing_fields_notice}</span>
            </div>
          )}

          {/* Prototype Simulation Notice & Statutory Filing Guidance */}
          <div className="mx-6 mt-6 p-4 rounded-2xl bg-[#142A36] text-white flex flex-col gap-3 border border-slate-700/60 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Prototype Sandbox Simulation
                </span>
                <span className="text-xs text-amber-200 font-mono">No Live External Integration</span>
              </div>
              <span className="text-[11px] text-slate-300">
                Official filing requires calling 1930 or visiting cybercrime.gov.in
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Statutory Reporting Workflow Demonstration
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Satark Saathi prepares compliant dispute documentation. In this demonstration environment, the actions below simulate how electronic lien requests and e-filings would be formatted for beneficiary banks and the National Cyber Crime Reporting Portal.
                <strong className="text-amber-300 block mt-1">
                  DISCLAIMER: These sandbox actions do NOT freeze actual bank accounts or create police FIR records. To stop fund movement in real emergencies, immediately dial 1930 and contact your bank's fraud desk.
                </strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={handleDispatchBankFreeze}
                disabled={isFreezingBank || !!bankFreezeReceipt}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  bankFreezeReceipt
                    ? 'bg-emerald-700 text-white cursor-default'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                }`}
              >
                <Zap className="w-4 h-4" />
                {isFreezingBank
                  ? 'Simulating Gateway Dispatch...'
                  : bankFreezeReceipt
                  ? `Simulation Ref: ${bankFreezeReceipt.freeze_reference}`
                  : '⚡ Simulate Interbank Freeze (Sandbox)'}
              </button>

              <button
                type="button"
                onClick={handleSubmitCybercrimePortal}
                disabled={isSubmittingPortal || !!cybercrimeAckReceipt}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  cybercrimeAckReceipt
                    ? 'bg-teal-700 text-white cursor-default'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                }`}
              >
                <Send className="w-4 h-4" />
                {isSubmittingPortal
                  ? 'Simulating 1930 Filing...'
                  : cybercrimeAckReceipt
                  ? `Simulated Ack: ${cybercrimeAckReceipt.portal_ack_number}`
                  : '🚀 Simulate 1930 e-Filing (Sandbox)'}
              </button>
            </div>
          </div>

          {/* Electronic Receipts Banner when either action has been dispatched */}
          {(bankFreezeReceipt || cybercrimeAckReceipt) && (
            <div className="mx-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {bankFreezeReceipt && (
                <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-amber-900">
                      <CheckCircle2 className="w-4 h-4 text-amber-700" /> [PROTOTYPE SIMULATION] Freeze Request
                    </span>
                    <span className="font-mono bg-amber-200 text-amber-950 px-2 py-0.5 rounded text-[11px]">
                      {bankFreezeReceipt.freeze_reference}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-900">
                    {bankFreezeReceipt.action_summary}
                  </p>
                  <p className="mt-1 text-[10px] text-amber-800 font-mono">
                    Desk: {bankFreezeReceipt.nodal_desk_assigned} (Demonstration Model)
                  </p>
                  {bankFreezeReceipt.simulation_notice && (
                    <p className="mt-2 text-[10px] text-amber-800 bg-white/70 p-2 rounded border border-amber-200">
                      {bankFreezeReceipt.simulation_notice}
                    </p>
                  )}
                </div>
              )}

              {cybercrimeAckReceipt && (
                <div className="p-4 rounded-xl bg-teal-50/90 border border-teal-300 text-xs text-teal-950">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-teal-900">
                      <ShieldAlert className="w-4 h-4 text-teal-700" /> [PROTOTYPE SIMULATION] 1930 Portal Filing
                    </span>
                    <span className="font-mono bg-teal-200 text-teal-950 px-2 py-0.5 rounded text-[11px]">
                      {cybercrimeAckReceipt.portal_ack_number}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-teal-900">
                    Jurisdiction: {cybercrimeAckReceipt.jurisdiction}
                  </p>
                  <p className="mt-1 text-[10px] text-teal-800">
                    Status: {cybercrimeAckReceipt.status} (Simulated Dispatch)
                  </p>
                  {cybercrimeAckReceipt.simulation_notice && (
                    <p className="mt-2 text-[10px] text-teal-800 bg-white/70 p-2 rounded border border-teal-200">
                      {cybercrimeAckReceipt.simulation_notice}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Draft Selection Tabs */}
          <div className="px-6 pt-5">
            <div className="flex border-b border-slate-200 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('PORTAL')}
                className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  activeTab === 'PORTAL'
                    ? 'border-[#176B58] text-[#176B58]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Cyber Crime Portal 1930 Draft
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('BANK')}
                className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  activeTab === 'BANK'
                    ? 'border-[#176B58] text-[#176B58]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Bank Nodal Officer Recall Dispute
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('POLICE')}
                className={`py-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  activeTab === 'POLICE'
                    ? 'border-[#176B58] text-[#176B58]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                3. Police Cyber Crime Cell Format
              </button>
            </div>
          </div>

          {/* Draft Content Box */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">
                {isEditingDraft ? 'Editable Draft Content:' : 'Pre-Formatted Dispute Text:'}
              </span>
              <CopyButton
                textToCopy={
                  activeTab === 'PORTAL'
                    ? editedPortalText
                    : activeTab === 'BANK'
                    ? editedBankText
                    : editedPoliceText
                }
              />
            </div>

            {isEditingDraft ? (
              <textarea
                rows={16}
                value={
                  activeTab === 'PORTAL'
                    ? editedPortalText
                    : activeTab === 'BANK'
                    ? editedBankText
                    : editedPoliceText
                }
                onChange={(e) => {
                  if (activeTab === 'PORTAL') setEditedPortalText(e.target.value);
                  else if (activeTab === 'BANK') setEditedBankText(e.target.value);
                  else setEditedPoliceText(e.target.value);
                }}
                className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58] leading-relaxed"
              />
            ) : (
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-[500px] leading-relaxed border border-slate-800">
                {activeTab === 'PORTAL'
                  ? editedPortalText
                  : activeTab === 'BANK'
                  ? editedBankText
                  : editedPoliceText}
              </pre>
            )}

            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Next Steps Under Golden Hour Protocol:</p>
              <p>1. Copy Section 1 text and submit directly on <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#176B58] underline font-bold">cybercrime.gov.in</a>.</p>
              <p>2. Email Section 2 text to your bank fraud dispute cell ({bankName}).</p>
              <p>3. Note complaint acknowledgement number and keep bank statement copy ready.</p>
            </div>
          </div>
        </div>
      )}

      {/* Verified Indian Bank Desks Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#176B58]" />
          Verified Indian Bank 24x7 Emergency Hotlines &amp; Freeze Desks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {helplines.map((b, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <h4 className="font-bold text-xs text-slate-900">{b.bank}</h4>
              <p className="text-xs font-mono text-[#176B58] font-bold mt-1">📞 {b.toll_free}</p>
              {b.sms_block && <p className="text-[11px] text-slate-600 mt-1 font-mono">{b.sms_block}</p>}
              {b.email && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{b.email}</p>}
              {b.portal && (
                <a
                  href={b.portal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#176B58] font-semibold hover:underline mt-2"
                >
                  Dispute Portal <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
