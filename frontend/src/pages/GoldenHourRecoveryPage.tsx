import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Phone,
  Enterprise,
  Launch,
  CheckmarkFilled,
  Download,
  DocumentPdf,
  Document,
  Edit,
  Save,
  ArrowRight,
  ArrowLeft,
  Time,
  Information,
  Flash,
  Renew,
  Printer,
  WarningAlt,
  Add,
  TrashCan,
  Help,
} from '@carbon/icons-react';
import {
  Tile,
  Button,
  Tag,
  ProgressIndicator,
  ProgressStep,
  TextInput,
  TextArea,
  Select,
  SelectItem,
  InlineNotification,
  Loading,
} from '@carbon/react';
import { api } from '../api/endpoints';
import {
  RecoveryDraft,
  BankHelpline,
  RecoveryWizardRequest,
  GoldenHourResponse,
} from '../api/types';
import { GoldenHourResponsePanel } from '../components/recovery/GoldenHourResponsePanel';
import { CopyButton } from '../components/common/CopyButton';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { SimulationBanner } from '../components/common/SimulationBanner';
import { ServiceJourneyHeader } from '../components/common/ServiceJourneyHeader';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { staggerContainer, staggerItem } from '../utils/motionVariants';

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
    'Transferred funds to purported police clearing account',
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

  // One-tap Golden Hour response
  const [ghResponse, setGhResponse] = useState<GoldenHourResponse | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isExporting, setIsExporting] = useState<'txt' | 'pdf' | null>(null);

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

  const activateResponse = async (draftId: number) => {
    setIsActivating(true);
    try {
      const res = await api.activateGoldenHourResponse(draftId);
      setGhResponse(res);
      setLinkedIncidentId(res.incident_reference || linkedIncidentId);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Activation failed', message: err.message });
    } finally {
      setIsActivating(false);
    }
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
      setGhResponse(null);
      setWizardStep(4);
      await activateResponse(draft.id);
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
        status: 'REVIEWED',
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

  const handleExport = async (format: 'txt' | 'pdf') => {
    if (!generatedDraft) return;
    setIsExporting(format);
    try {
      await api.downloadRecoveryDraft(generatedDraft.id, format);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Export Failed', message: err.message });
    } finally {
      setIsExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#e0e0e0] pb-4">
          <h1 className="text-xl font-semibold text-[#161616]">Golden Hour Recovery Desk</h1>
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SimulationBanner message="Enter what happened, then press one button. Satark Saathi prepares the complaint, the bank lien request and the police intimation at once. In this demo the dispatches are simulated — nothing reaches a real bank, police station or government portal." />

      <ServiceJourneyHeader
        title="Golden Hour Recovery Desk & Incident Wizard"
        badge="EMERGENCY RESPONSE"
        badgeKind="red"
        tagline="Time-critical multi-desk recovery protocol for citizens within the first 2-3 hours of an unauthorized or fraudulent transfer."
        inputs="Incident narrative, disputed financial amount, bank name, suspect contact info, and timeline events."
        deliverables="Simultaneous multi-desk drafts: 1930 portal complaint text, bank lien recall request, and police intimation."
        nextAction="Dial 1930 immediately with the formatted complaint, contact your bank nodal officer, and file at cybercrime.gov.in."
        icon={Help}
      />

      {/* 1930 Cyber Fraud Helpline Urgent Banner (Mandatory Requirement) */}
      <div className="bg-[#da1e28] text-white p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-l-4 border-l-[#750e13]">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 shrink-0">
            <Phone size={28} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-white text-[#da1e28]">
                CRITICAL GOLDEN HOUR ACTION
              </span>
              <span className="text-xs text-white/90 font-medium">Within 2 to 3 Hours</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Dial 1930 &bull; Citizen Cyber Fraud Reporting System
            </h2>
            <p className="text-xs text-white/90 mt-1 max-w-xl leading-relaxed">
              If money has been debited, call <strong>1930 immediately</strong> and register at{' '}
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="underline font-bold text-white hover:text-[#f4f4f4]">
                cybercrime.gov.in
              </a>. Initiates inter-bank lien marking to freeze funds before mule ATM withdrawals.
              <span className="block mt-1 text-[11px] text-white/80 font-normal">
                *Notice: Official reporting initiates immediate tracing, but does not guarantee recovery.
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href="tel:1930"
            className="cds--btn cds--btn--secondary bg-white text-[#da1e28] hover:bg-[#f4f4f4] font-bold text-sm inline-flex items-center gap-2"
          >
            <Phone size={16} />
            Call 1930 Now
          </a>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="cds--btn cds--btn--tertiary bg-black/40 hover:bg-black/60 text-white font-medium text-xs inline-flex items-center gap-1.5 border border-white/30"
          >
            Portal
            <Launch size={14} />
          </a>
        </div>
      </div>

      {/* Step Wizard Progress Header */}
      <Tile className="p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e0e0e0] pb-4 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-[#161616] flex items-center gap-2">
                <Help size={20} className="text-[#0f62fe]" />
                Golden Hour Incident Recovery Wizard
              </h1>
              {linkedIncidentId && (
                <Tag type="teal" size="sm">
                  Case #{linkedIncidentId}
                </Tag>
              )}
            </div>
            <p className="text-xs text-[#525252] mt-0.5">
              Compile non-fabricated, structured dispute drafts for cyber authorities and bank nodal desks.
            </p>
          </div>
          <Tag type="warm-gray" size="md">
            Step {wizardStep} of 4
          </Tag>
        </div>

        {/* Case Hydration Loading State */}
        {caseLoading && (
          <div className="p-3 bg-[#edf5ff] border-l-4 border-l-[#0f62fe] text-xs text-[#0043ce] flex items-center gap-2">
            <Renew size={16} className="animate-spin text-[#0043ce]" />
            <span>Retrieving authoritative incident dossier from backend...</span>
          </div>
        )}

        {/* Case Hydration Error State */}
        {caseLoadError && (
          <InlineNotification
            kind="error"
            title="Record Access Alert"
            subtitle={`${caseLoadError}. You can continue entering details manually.`}
            hideCloseButton
            lowContrast
          />
        )}

        {/* Carbon Progress Indicator */}
        <div className="overflow-x-auto py-2">
          <ProgressIndicator currentIndex={wizardStep - 1}>
            <ProgressStep
              label="Incident Particulars"
              secondaryLabel="Date, scam type & narrative"
              onClick={() => {
                if (generatedDraft || wizardStep > 1) setWizardStep(1);
              }}
            />
            <ProgressStep
              label="Financial Details"
              secondaryLabel="Loss & bank transaction info"
              onClick={() => {
                if (generatedDraft || wizardStep > 2) setWizardStep(2);
              }}
            />
            <ProgressStep
              label="Evidence & Timeline"
              secondaryLabel="Suspect & milestone events"
              onClick={() => {
                if (generatedDraft || wizardStep > 3) setWizardStep(3);
              }}
            />
            <ProgressStep
              label="Recovery Actions"
              secondaryLabel="Drafts, dispatches & export"
              onClick={() => {
                if (generatedDraft) setWizardStep(4);
              }}
            />
          </ProgressIndicator>
        </div>
      </Tile>

      {/* Wizard Step Content with AnimatePresence */}
      <AnimatePresence mode="wait">
        {/* Wizard Step 1: Incident Particulars */}
        {wizardStep === 1 && (
          <motion.div
            key="wizard-step-1"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            <Tile className="p-6 shadow-sm space-y-5">
              <div className="border-b border-[#e0e0e0] pb-3">
                <h2 className="text-base font-semibold text-[#161616] flex items-center gap-2">
                  <Time size={20} className="text-[#0f62fe]" />
                  Step 1: Incident Particulars
                </h2>
                <p className="text-xs text-[#525252] mt-0.5">
                  Record when the incident began and describe the sequence in your own words.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <TextInput
                    id="gh-incident-datetime"
                    labelText="Approximate Date & Time of Incident *"
                    type="datetime-local"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                  />
                </div>

                <div>
                  <Select
                    id="gh-scam-type"
                    labelText="Category of Cyber Fraud *"
                    value={scamType}
                    onChange={(e) => setScamType(e.target.value)}
                  >
                    <SelectItem value="Digital Arrest Scam" text="Digital Arrest Scam (Fake Police / CBI / ED)" />
                    <SelectItem value="Utility Impersonation Phishing" text="Electricity Bill Disconnection Threat" />
                    <SelectItem value="Part-Time Job / Telegram Task Fraud" text="Prepaid Task / Job Offer Fraud" />
                    <SelectItem value="Fake Investment Scheme" text="High-Yield Guaranteed Investment Ponzi" />
                    <SelectItem value="Courier / Customs Duty Fraud" text="Customs / Fedex Parcel Extortion" />
                    <SelectItem value="Bank KYC / SIM Block Fraud" text="Bank Account KYC Deactivation Phishing" />
                  </Select>
                </div>
              </div>

              <div>
                <TextInput
                  id="gh-contact-channel"
                  labelText="Contact Channel Used by Scammer *"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="e.g. WhatsApp Video Call (+91 98201 98201), Skype, Telegram"
                />
              </div>

              <div>
                <TextArea
                  id="gh-narrative"
                  labelText="Incident Narrative / Statement of Facts *"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain clearly what happened: who called, what claims were made, what pressure was applied..."
                  helperText="Be as detailed as possible. This narrative is incorporated into official complaint drafts."
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-[#e0e0e0]">
                <Button
                  kind="primary"
                  renderIcon={ArrowRight}
                  onClick={() => setWizardStep(2)}
                  disabled={!description.trim()}
                >
                  Continue to Financial Details
                </Button>
              </div>
            </Tile>
          </motion.div>
        )}

        {/* Wizard Step 2: Financial Details */}
        {wizardStep === 2 && (
          <motion.div
            key="wizard-step-2"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            <Tile className="p-6 shadow-sm space-y-5">
              <div className="border-b border-[#e0e0e0] pb-3">
                <h2 className="text-base font-semibold text-[#161616] flex items-center gap-2">
                  <Enterprise size={20} className="text-[#0f62fe]" />
                  Step 2: Financial Details &amp; Transaction References
                </h2>
                <p className="text-xs text-[#525252] mt-0.5">
                  Specify debited accounts, amounts, and transaction references if available.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <TextInput
                    id="gh-financial-loss"
                    labelText="Amount Lost or at Risk (INR) *"
                    type="number"
                    min="0"
                    value={financialLoss}
                    onChange={(e) => setFinancialLoss(e.target.value)}
                    placeholder="e.g. 25000"
                  />
                </div>

                <div>
                  <TextInput
                    id="gh-bank-name"
                    labelText="Complainant Bank / Payment App"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. State Bank of India, HDFC Bank, Google Pay"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <TextInput
                    id="gh-transaction-ref"
                    labelText="Transaction Reference / UTR Number"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Leave blank if UTR is not yet available"
                    helperText="Missing UTR explicitly allowed. If omitted, the draft will indicate '[UTR PENDING BANK STATEMENT]' without fabricating fake numbers."
                  />
                </div>

                <div>
                  <Select
                    id="gh-transfer-status"
                    labelText="Transfer Status"
                    value={transferStatus}
                    onChange={(e) => setTransferStatus(e.target.value as any)}
                  >
                    <SelectItem value="COMPLETED" text="Completed (Amount already debited)" />
                    <SelectItem value="PENDING" text="Pending / In-Transit (Dispute immediately)" />
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#e0e0e0]">
                <Button
                  kind="secondary"
                  renderIcon={ArrowLeft}
                  onClick={() => setWizardStep(1)}
                >
                  Back
                </Button>
                <Button
                  kind="primary"
                  renderIcon={ArrowRight}
                  onClick={() => setWizardStep(3)}
                >
                  Continue to Evidence &amp; Timeline
                </Button>
              </div>
            </Tile>
          </motion.div>
        )}

        {/* Wizard Step 3: Evidence & Timeline */}
        {wizardStep === 3 && (
          <motion.div
            key="wizard-step-3"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            <Tile className="p-6 shadow-sm space-y-5">
              <div className="border-b border-[#e0e0e0] pb-3">
                <h2 className="text-base font-semibold text-[#161616] flex items-center gap-2">
                  <Time size={20} className="text-[#0f62fe]" />
                  Step 3: Evidence &amp; Incident Timeline
                </h2>
                <p className="text-xs text-[#525252] mt-0.5">
                  Record suspect contact handles and step-by-step chronology for cyber authorities.
                </p>
              </div>

              <div>
                <TextInput
                  id="gh-suspect-contact"
                  labelText="Suspect Identifiers (Phone, UPI ID, Bank Account)"
                  value={suspectContact}
                  onChange={(e) => setSuspectContact(e.target.value)}
                  placeholder="e.g. +91 98201 98201, officer-cbi@ybl"
                />
              </div>

              <div>
                <TextArea
                  id="gh-message-transcript"
                  labelText="Message / Voice-Note Transcript Excerpt (Optional)"
                  rows={3}
                  value={messageTranscript}
                  onChange={(e) => setMessageTranscript(e.target.value)}
                  placeholder="Paste exact text received from scammer..."
                  helperText="Verbatim text from SMS, WhatsApp, or recorded conversation."
                />
              </div>

              {/* Timeline Events Builder */}
              <div>
                <label className="cds--label mb-2 block">
                  Chronological Timeline of Events
                </label>
                <div className="space-y-2 mb-3">
                  {timelineEvents.map((evt, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.04 }}
                      className="flex items-center justify-between p-3 bg-[#f4f4f4] border border-[#e0e0e0] text-xs text-[#161616]"
                    >
                      <span className="font-medium">
                        {idx + 1}. {evt}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTimelineEvent(idx)}
                        className="text-[#da1e28] hover:text-[#750e13] p-1 cursor-pointer"
                        title="Remove event"
                      >
                        <TrashCan size={16} />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <TextInput
                      id="gh-new-event"
                      labelText=""
                      hideLabel
                      value={newTimelineEvent}
                      onChange={(e) => setNewTimelineEvent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTimelineEvent())}
                      placeholder="Add milestone (e.g. 11:30 AM caller threatened immediate arrest)..."
                    />
                  </div>
                  <Button
                    kind="tertiary"
                    size="md"
                    renderIcon={Add}
                    onClick={handleAddTimelineEvent}
                  >
                    Add Event
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#e0e0e0]">
                <Button
                  kind="secondary"
                  renderIcon={ArrowLeft}
                  onClick={() => setWizardStep(2)}
                >
                  Back
                </Button>
                <Button
                  kind="danger"
                  renderIcon={isGenerating ? Renew : Flash}
                  onClick={handleExecuteWizard}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'Activating Golden Hour Response…' : 'Activate Golden Hour Response'}
                </Button>
              </div>
            </Tile>
          </motion.div>
        )}

        {/* Wizard Step 4: Recovery Actions & Draft Review */}
        {wizardStep === 4 && generatedDraft && (
          <motion.div
            key="wizard-step-4"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
          >
            <Tile className="p-0 overflow-hidden shadow-sm space-y-0">
          <div className="p-6 border-b border-[#e0e0e0] bg-[#f4f4f4] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <Tag type="teal" size="sm">
                Step 4: Formal Recovery Dossier
              </Tag>
              <h2 className="text-lg font-semibold text-[#161616] mt-1">
                Review, Edit &amp; Export Complaint Drafts
              </h2>
              <p className="text-xs text-[#525252] mt-0.5">
                Every detail is editable before submission. Do NOT auto-submit to police; review thoroughly first.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isEditingDraft ? (
                <Button
                  kind="primary"
                  size="sm"
                  renderIcon={Save}
                  onClick={handleSaveDraftEdits}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Edits'}
                </Button>
              ) : (
                <Button
                  kind="secondary"
                  size="sm"
                  renderIcon={Edit}
                  onClick={() => setIsEditingDraft(true)}
                >
                  Edit Draft
                </Button>
              )}

              <Button
                kind="tertiary"
                size="sm"
                renderIcon={DocumentPdf}
                onClick={() => handleExport('pdf')}
                disabled={isExporting !== null}
                title="Structured PDF: case summary, missing-information checklist, evidence references, timeline, audit trail and all three drafts"
              >
                {isExporting === 'pdf' ? 'Building PDF…' : 'Download PDF Pack'}
              </Button>

              <Button
                kind="tertiary"
                size="sm"
                renderIcon={Download}
                onClick={() => handleExport('txt')}
                disabled={isExporting !== null}
              >
                {isExporting === 'txt' ? 'Exporting…' : 'Export TXT Dossier'}
              </Button>

              <Button
                kind="ghost"
                size="sm"
                renderIcon={Printer}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </div>
          </div>

          {/* Missing Fields Notice */}
          {generatedDraft.missing_fields_notice && (
            <div className="m-6">
              <InlineNotification
                kind="warning"
                title="Missing Information Notice"
                subtitle={generatedDraft.missing_fields_notice}
                hideCloseButton
                lowContrast
              />
            </div>
          )}

          {/* One-tap Golden Hour response */}
          <div className="px-6">
            {ghResponse ? (
              <GoldenHourResponsePanel key={ghResponse.activated_at} response={ghResponse} />
            ) : (
              <div className="p-5 bg-[#161616] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 my-4">
                <div>
                  <h3 className="text-sm font-semibold">Act now with one tap</h3>
                  <p className="text-xs text-[#c6c6c6] mt-1 max-w-xl">
                    Sends the complaint to the cyber crime cell, asks your bank to block the amount in the fraudster&apos;s account,
                    and informs the cyber police — <strong className="text-[#f1c21b]">simulated in this demo</strong>.
                  </p>
                </div>
                <Button
                  kind="danger"
                  renderIcon={isActivating ? Renew : Flash}
                  onClick={() => activateResponse(generatedDraft.id)}
                  disabled={isActivating}
                >
                  {isActivating ? 'Activating…' : 'Activate Golden Hour Response'}
                </Button>
              </div>
            )}
          </div>

          {/* Draft Selection Tabs */}
          <div className="px-6 pt-4">
            <div className="flex border-b border-[#e0e0e0] gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('PORTAL')}
                className={`py-3 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer ${
                  activeTab === 'PORTAL'
                    ? 'border-[#0f62fe] text-[#0f62fe]'
                    : 'border-transparent text-[#525252] hover:text-[#161616]'
                }`}
              >
                1. Cyber Crime Portal 1930 Draft
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('BANK')}
                className={`py-3 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer ${
                  activeTab === 'BANK'
                    ? 'border-[#0f62fe] text-[#0f62fe]'
                    : 'border-transparent text-[#525252] hover:text-[#161616]'
                }`}
              >
                2. Bank Nodal Officer Recall Dispute
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('POLICE')}
                className={`py-3 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer ${
                  activeTab === 'POLICE'
                    ? 'border-[#0f62fe] text-[#0f62fe]'
                    : 'border-transparent text-[#525252] hover:text-[#161616]'
                }`}
              >
                3. Police Cyber Crime Cell Format
              </button>
            </div>
          </div>

          {/* Draft Content Box */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#525252]">
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
                className="w-full p-4 font-mono text-xs text-[#161616] bg-[#f4f4f4] border border-[#8d8d8d] focus:outline-none focus:ring-2 focus:ring-[#0f62fe] leading-relaxed"
              />
            ) : (
              <pre className="p-4 bg-[#161616] text-[#f4f4f4] font-mono text-xs whitespace-pre-wrap overflow-x-auto max-h-[500px] leading-relaxed border border-[#393939]">
                {activeTab === 'PORTAL'
                  ? editedPortalText
                  : activeTab === 'BANK'
                  ? editedBankText
                  : editedPoliceText}
              </pre>
            )}

            <div className="mt-5 p-4 bg-[#f4f4f4] border-l-4 border-l-[#0f62fe] text-xs text-[#525252] space-y-1">
              <p className="font-semibold text-[#161616]">Next Steps Under Golden Hour Protocol:</p>
              <p>1. Copy Section 1 text and submit directly on <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#0f62fe] underline font-bold">cybercrime.gov.in</a>.</p>
              <p>2. Email Section 2 text to your bank fraud dispute cell ({bankName}).</p>
              <p>3. Note complaint acknowledgement number and keep bank statement copy ready.</p>
            </div>
          </div>
        </Tile>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verified Indian Bank Desks Grid */}
      <Tile className="p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[#161616] mb-4 flex items-center gap-2">
          <Enterprise size={20} className="text-[#0f62fe]" />
          Verified Indian Bank 24x7 Emergency Hotlines &amp; Freeze Desks
        </h3>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {helplines.map((b, idx) => (
            <motion.div
              key={idx}
              variants={staggerItem}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="p-4 border border-[#e0e0e0] bg-[#f4f4f4] hover:bg-[#e8e8e8] transition-colors"
            >
              <h4 className="font-semibold text-xs text-[#161616]">{b.bank}</h4>
              <p className="text-xs font-mono text-[#0f62fe] font-bold mt-1">📞 {b.toll_free}</p>
              {b.sms_block && <p className="text-[11px] text-[#525252] mt-1 font-mono">{b.sms_block}</p>}
              {b.email && <p className="text-[11px] text-[#525252] mt-0.5 truncate">{b.email}</p>}
              {b.portal && (
                <a
                  href={b.portal}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#0f62fe] font-semibold hover:underline mt-2"
                >
                  Dispute Portal <Launch size={12} />
                </a>
              )}
            </motion.div>
          ))}
        </motion.div>
      </Tile>
    </div>
  );
};
