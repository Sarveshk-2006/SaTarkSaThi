import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CheckmarkFilled,
  WarningFilled,
  WarningAltFilled,
  Flash,
  ArrowRight,
  Phone,
  Time,
  Information,
  Locked,
  Save,
  Renew,
  Checkmark,
} from '@carbon/icons-react';
import {
  Tile,
  Button,
  Tag,
  Modal,
  ProgressBar,
} from '@carbon/react';
import { api } from '../api/endpoints';
import { CallState, PaymentSimulation } from '../api/types';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { SimulationBanner } from '../components/common/SimulationBanner';
import { ServiceJourneyHeader } from '../components/common/ServiceJourneyHeader';
import { SafetyCheckIn, toCheckinLanguage } from '../components/payment/SafetyCheckIn';
import { GuardianApprovalPanel, RiskSignalList } from '../components/payment/PaymentSafetyWidgets';

interface PresetSimulation {
  title: string;
  category: string;
  categoryColor: 'red' | 'warm-gray' | 'purple' | 'green';
  vpa: string;
  name: string;
  amount: number;
  purpose: string;
  is_new: boolean;
  pressure: boolean;
  authority: boolean;
  secrecy: boolean;
  returns: boolean;
  call: CallState;
}

const PRESETS: PresetSimulation[] = [
  {
    title: 'Digital Arrest Bail Deposit',
    category: 'ACUTE EXTORTION',
    categoryColor: 'red',
    vpa: 'cbi.court.clearance@oksbi',
    name: 'CBI Escrow Cell',
    amount: 50000,
    purpose: 'Clearance fee to drop PMLA arrest warrant',
    is_new: true,
    pressure: true,
    authority: true,
    secrecy: true,
    returns: false,
    call: 'DEMO_SIMULATED_ACTIVE_CALL',
  },
  {
    title: 'Electricity Bill Disconnection',
    category: 'UTILITY FRAUD',
    categoryColor: 'warm-gray',
    vpa: 'officer.bses.bill@ybl',
    name: 'BSES Electricity Officer',
    amount: 12500,
    purpose: 'Pending utility bill to stop disconnection tonight',
    is_new: true,
    pressure: true,
    authority: false,
    secrecy: false,
    returns: false,
    call: 'NONE',
  },
  {
    title: 'Telegram Guaranteed Return',
    category: 'TASK SCAM',
    categoryColor: 'purple',
    vpa: '9810123456@paytm',
    name: 'VIP Investment Desk',
    amount: 25000,
    purpose: 'Crypto arbitrage investment task',
    is_new: true,
    pressure: false,
    authority: false,
    secrecy: false,
    returns: true,
    call: 'NONE',
  },
  {
    title: 'Legitimate Grocery Store QR',
    category: 'BENIGN MERCHANT',
    categoryColor: 'green',
    vpa: 'kirana.store@icici',
    name: 'Sharma General Store',
    amount: 650,
    purpose: 'Weekly grocery supplies payment',
    is_new: false,
    pressure: false,
    authority: false,
    secrecy: false,
    returns: false,
    call: 'NONE',
  },
];

const PURPOSE_SUGGESTIONS = [
  'Bail clearance to avoid arrest warrant',
  'Urgent electricity bill to avoid power cut',
  'Prepaid Telegram task investment deposit',
  'Customs duty for overseas gift parcel',
  'Routine grocery store payment',
];

export const PaymentCheckpointPage: React.FC = () => {
  const { showToast } = useToast();
  const { language: appLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [vpa, setVpa] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isNewRecipient, setIsNewRecipient] = useState(true);

  const [pressurePresent, setPressurePresent] = useState(false);
  const [authorityClaimed, setAuthorityClaimed] = useState(false);
  const [secrecyDemanded, setSecrecyDemanded] = useState(false);
  const [guaranteedReturns, setGuaranteedReturns] = useState(false);
  const [callState, setCallState] = useState<CallState>('NONE');

  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<PaymentSimulation | null>(null);
  const [savedIncidentId, setSavedIncidentId] = useState<string | null>(null);
  const [isSavingIncident, setIsSavingIncident] = useState(false);
  const [pastSimulations, setPastSimulations] = useState<PaymentSimulation[]>([]);
  const [checkedChecklist, setCheckedChecklist] = useState<{ [idx: number]: boolean }>({});
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number | null>(null);

  const fetchPastSimulations = async () => {
    try {
      const data = await api.getPaymentSimulations();
      setPastSimulations(data);
    } catch {
      // Non-fatal
    }
  };

  useEffect(() => {
    fetchPastSimulations();

    const state = location.state as any;
    if (state?.vpa) {
      setVpa(state.vpa);
      if (state.name) setRecipientName(state.name);
      if (state.amount) setAmount(state.amount.toString());
      if (state.purpose) setPurpose(state.purpose);
      if (state.is_new !== undefined) setIsNewRecipient(state.is_new);
      if (state.pressure !== undefined) setPressurePresent(state.pressure);
      if (state.authority !== undefined) setAuthorityClaimed(state.authority);
      if (state.secrecy !== undefined) setSecrecyDemanded(state.secrecy);
      if (state.returns !== undefined) setGuaranteedReturns(state.returns);
      setResult(null);
      setSavedIncidentId(null);
    }
  }, [location.state]);

  const handleApplyPreset = (preset: PresetSimulation, idx: number) => {
    setSelectedPresetIdx(idx);
    setVpa(preset.vpa);
    setRecipientName(preset.name);
    setAmount(preset.amount.toString());
    setPurpose(preset.purpose);
    setIsNewRecipient(preset.is_new);
    setPressurePresent(preset.pressure);
    setAuthorityClaimed(preset.authority);
    setSecrecyDemanded(preset.secrecy);
    setGuaranteedReturns(preset.returns);
    setCallState(preset.call);
    setResult(null);
    setSavedIncidentId(null);
    setCheckedChecklist({});
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vpa.trim() || !amount) {
      showToast({ type: 'warning', title: 'Input Required', message: 'Please provide VPA and transfer amount.' });
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast({ type: 'warning', title: 'Invalid Amount', message: 'Enter a valid amount in INR.' });
      return;
    }

    setSimulating(true);
    setSavedIncidentId(null);
    setCheckedChecklist({});

    try {
      const res = await api.simulatePayment({
        vpa_or_account: vpa.trim(),
        recipient_name: recipientName.trim() || undefined,
        requested_amount: numAmount,
        purpose: purpose.trim() || undefined,
        is_new_recipient: isNewRecipient,
        pressure_present: pressurePresent,
        authority_claimed: authorityClaimed,
        secrecy_demanded: secrecyDemanded,
        guaranteed_returns: guaranteedReturns,
        call_state: callState,
      });

      setResult(res);
      fetchPastSimulations();

      showToast({
        type: res.outcome === 'SEEK_TRUSTED_HELP' ? 'error' : res.outcome === 'PAUSE_AND_VERIFY' ? 'warning' : 'success',
        title: `Decision: ${res.outcome.replace(/_/g, ' ')}`,
        message: `Risk Score: ${res.risk_score}/100`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Simulation Failed', message: err.message });
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveIncident = async () => {
    if (!result) return;
    setIsSavingIncident(true);
    try {
      const res = await api.savePaymentIncident(result.simulation_id);
      setSavedIncidentId(res.incident_id);
      showToast({
        type: 'success',
        title: 'Incident Record Created',
        message: `Saved authoritative case #${res.incident_id}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Save Incident Failed',
        message: err.message || 'Unable to persist incident record.',
      });
    } finally {
      setIsSavingIncident(false);
    }
  };

  const resetForm = () => {
    setSelectedPresetIdx(null);
    setVpa('');
    setRecipientName('');
    setAmount('');
    setPurpose('');
    setIsNewRecipient(true);
    setPressurePresent(false);
    setAuthorityClaimed(false);
    setSecrecyDemanded(false);
    setGuaranteedReturns(false);
    setCallState('NONE');
    setIsCheckInOpen(false);
    setResult(null);
    setSavedIncidentId(null);
    setCheckedChecklist({});
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Simulation Sandbox Notice Banner */}
      <SimulationBanner
        title="Pre-Transaction Risk Sandbox"
        message="SIMULATION ONLY: No real banking transaction or UPI debit is executed. Evaluate transfer legitimacy and social engineering pressure safely."
        variant="amber"
        badgeText="SANDBOX ENVIRONMENT"
      />

      <ServiceJourneyHeader
        title="Payment Checkpoint & Coercion Firewall"
        badge="PRE-FLIGHT DEFENSE"
        badgeKind="blue"
        tagline="Pre-transaction psychological cooling-off, recipient VPA verification, and coercive pressure evaluation before funds leave your account."
        inputs="Recipient UPI VPA / phone, transfer amount, purpose, and pressure indicators (active call, secrecy, legal threats)."
        deliverables="Psychometric coercion score, recipient integrity audit, and cooling-off risk decision (Proceed, Pause, or Seek Help)."
        nextAction="Execute safe verified transfer, consult linked Family Shield guardian, or halt transaction immediately."
        icon={Wallet}
      />

      <div className="flex justify-end -mt-3 mb-2">
        <Button
          kind="ghost"
          size="sm"
          renderIcon={Renew}
          onClick={resetForm}
        >
          Clear Inputs
        </Button>
      </div>

      {/* Preset Scenario Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-[#525252] flex items-center gap-1.5">
            <Flash size={14} className="text-[#0f62fe]" />
            <span>Select Test Scenario (Pre-Configured Threat Simulations):</span>
          </label>
          <span className="text-[11px] text-[#8d8d8d]">Click to load parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((p, idx) => {
            const isSelected = selectedPresetIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p, idx)}
                className={`text-left p-3.5 border transition-colors cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-[#0f62fe] bg-[#edf5ff]'
                    : 'border-[#e0e0e0] bg-white hover:border-[#8d8d8d] hover:bg-[#f4f4f4]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Tag type={p.categoryColor} size="sm" className="font-bold uppercase tracking-wider">
                    {p.category}
                  </Tag>
                  <span className="font-mono text-xs font-semibold text-[#161616]">
                    ₹{p.amount.toLocaleString()}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-[#161616] truncate group-hover:text-[#0f62fe] transition-colors">
                  {p.title}
                </h4>
                <p className="text-[11px] font-mono text-[#525252] truncate mt-1">
                  {p.vpa}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form Left, Decision Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Payment Parameters & Coercion Toggles */}
        <Tile className="lg:col-span-7 bg-white border border-[#e0e0e0] p-5 sm:p-6 space-y-5">
          <form onSubmit={handleSimulate} className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0f62fe]"></span>
                <h3 className="text-sm font-semibold text-[#161616]">
                  Pre-Flight Transaction Parameters
                </h3>
              </div>
              <Tag type="blue" size="sm">Interactive Checkpoint</Tag>
            </div>

            {/* Recipient VPA & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#161616] mb-1.5">
                  Recipient Identifier (UPI ID or Account) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#525252] font-mono font-bold text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value)}
                    placeholder="e.g. officer.court@oksbi"
                    className="w-full py-2.5 pl-8 pr-3 text-xs sm:text-sm border border-[#e0e0e0] bg-[#f4f4f4] focus:bg-white focus:outline-none focus:border-[#0f62fe] font-mono text-[#161616] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#161616] mb-1.5">
                  Requested Amount (INR) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#161616] font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full py-2.5 pl-8 pr-3 text-sm border border-[#e0e0e0] bg-[#f4f4f4] focus:bg-white focus:outline-none focus:border-[#0f62fe] font-mono font-bold text-[#161616] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Claimed Beneficiary & Familiarity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#161616] mb-1.5">
                  Claimed Beneficiary Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. CBI Escrow Cell"
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#e0e0e0] bg-[#f4f4f4] focus:bg-white focus:outline-none focus:border-[#0f62fe] text-[#161616] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#161616] mb-1.5">
                  Recipient Familiarity Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewRecipient(true)}
                    className={`py-2 px-3 text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isNewRecipient
                        ? 'bg-[#fef7e0] text-[#483700] border-[#f1c21b]'
                        : 'border-[#e0e0e0] text-[#525252] hover:bg-[#f4f4f4]'
                    }`}
                  >
                    <span>New / Unverified</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewRecipient(false)}
                    className={`py-2 px-3 text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      !isNewRecipient
                        ? 'bg-[#edfcf2] text-[#0e6027] border-[#24a148]'
                        : 'border-[#e0e0e0] text-[#525252] hover:bg-[#f4f4f4]'
                    }`}
                  >
                    <span>Known Contact</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Purpose Input & Suggestions */}
            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1.5">
                Stated Payment Purpose
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Clearance fee to drop PMLA arrest warrant"
                className="w-full py-2.5 px-3.5 text-xs sm:text-sm border border-[#e0e0e0] bg-[#f4f4f4] focus:bg-white focus:outline-none focus:border-[#0f62fe] text-[#161616] transition-colors"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-[#8d8d8d]">Quick picks:</span>
                {PURPOSE_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPurpose(s)}
                    className="text-[10px] px-2 py-0.5 bg-[#f4f4f4] hover:bg-[#e0e0e0] text-[#525252] border border-[#e0e0e0] cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Coercion & Behavioral Indicators */}
            <div className="pt-2 border-t border-[#e0e0e0] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#161616] flex items-center gap-1.5">
                  <WarningFilled size={16} className="text-[#da1e28]" />
                  <span>Coercion &amp; Psychological Pressure Indicators:</span>
                </label>
                <span className="text-[10px] text-[#8d8d8d]">Toggle active factors</span>
              </div>

              <div className="space-y-2">
                {/* 1. Authority Claimed */}
                <div
                  onClick={() => setAuthorityClaimed(!authorityClaimed)}
                  className={`p-3 border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    authorityClaimed
                      ? 'bg-[#fff1f1] border-[#da1e28]'
                      : 'bg-[#f4f4f4] border-[#e0e0e0] hover:bg-[#e0e0e0]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded shrink-0 mt-0.5 ${authorityClaimed ? 'bg-[#ffb3b8] text-[#750e13]' : 'bg-[#e0e0e0] text-[#161616]'}`}>
                      <Locked size={16} />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#161616] block">
                        Authority Claimed (Police, CBI, Customs, Court, Electricity Board)
                      </span>
                      <span className="text-[11px] text-[#525252]">
                        Caller or message author claims official power or legal consequences.
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${authorityClaimed ? 'bg-[#da1e28] border-[#da1e28] text-white' : 'bg-white border-[#8d8d8d]'}`}>
                    {authorityClaimed && <Checkmark size={14} />}
                  </div>
                </div>

                {/* 2. Secrecy Demanded */}
                <div
                  onClick={() => setSecrecyDemanded(!secrecyDemanded)}
                  className={`p-3 border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    secrecyDemanded
                      ? 'bg-[#fff1f1] border-[#da1e28]'
                      : 'bg-[#f4f4f4] border-[#e0e0e0] hover:bg-[#e0e0e0]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded shrink-0 mt-0.5 ${secrecyDemanded ? 'bg-[#ffb3b8] text-[#750e13]' : 'bg-[#e0e0e0] text-[#161616]'}`}>
                      <WarningFilled size={16} />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#161616] block">
                        Secrecy Demanded (&quot;Do not tell family, friends, or bank&quot;)
                      </span>
                      <span className="text-[11px] text-[#525252]">
                        Common isolation tactic designed to prevent family intervention.
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${secrecyDemanded ? 'bg-[#da1e28] border-[#da1e28] text-white' : 'bg-white border-[#8d8d8d]'}`}>
                    {secrecyDemanded && <Checkmark size={14} />}
                  </div>
                </div>

                {/* 3. Urgent Pressure */}
                <div
                  onClick={() => setPressurePresent(!pressurePresent)}
                  className={`p-3 border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    pressurePresent
                      ? 'bg-[#fff1f1] border-[#da1e28]'
                      : 'bg-[#f4f4f4] border-[#e0e0e0] hover:bg-[#e0e0e0]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded shrink-0 mt-0.5 ${pressurePresent ? 'bg-[#ffb3b8] text-[#750e13]' : 'bg-[#e0e0e0] text-[#161616]'}`}>
                      <Time size={16} />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#161616] block">
                        Urgent Coercive Pressure (&quot;Pay in 15 mins or face raid/disconnection&quot;)
                      </span>
                      <span className="text-[11px] text-[#525252]">
                        Artificial urgency disables rational financial verification.
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${pressurePresent ? 'bg-[#da1e28] border-[#da1e28] text-white' : 'bg-white border-[#8d8d8d]'}`}>
                    {pressurePresent && <Checkmark size={14} />}
                  </div>
                </div>

                {/* 4. Guaranteed Returns */}
                <div
                  onClick={() => setGuaranteedReturns(!guaranteedReturns)}
                  className={`p-3 border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                    guaranteedReturns
                      ? 'bg-[#f6f2ff] border-[#8a3ffc]'
                      : 'bg-[#f4f4f4] border-[#e0e0e0] hover:bg-[#e0e0e0]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded shrink-0 mt-0.5 ${guaranteedReturns ? 'bg-[#e8daff] text-[#6929c4]' : 'bg-[#e0e0e0] text-[#161616]'}`}>
                      <Flash size={16} />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#161616] block">
                        Guaranteed Returns Promised (Prepaid Tasks, Crypto, High Yield)
                      </span>
                      <span className="text-[11px] text-[#525252]">
                        Promise of impossible returns or instant deposit multiplication.
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 border flex items-center justify-center shrink-0 ${guaranteedReturns ? 'bg-[#8a3ffc] border-[#8a3ffc] text-white' : 'bg-white border-[#8d8d8d]'}`}>
                    {guaranteedReturns && <Checkmark size={14} />}
                  </div>
                </div>

                {/* 5. Call Context */}
                <fieldset className="p-3 border border-[#e0e0e0] bg-[#f4f4f4] space-y-2">
                  <legend className="sr-only">Call context</legend>
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded shrink-0 mt-0.5 ${callState !== 'NONE' ? 'bg-[#da1e28] text-white' : 'bg-[#e0e0e0] text-[#161616]'}`}>
                      <Phone size={16} />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#161616] block">Call context while paying</span>
                      <span className="text-[11px] text-[#525252]">
                        This prototype never detects calls automatically. Choose what you know, or simulate a device signal for the demo.
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Call context">
                    {([
                      { value: 'NONE', label: 'No call', hint: 'Not on a call' },
                      { value: 'USER_REPORTED_ACTIVE_CALL', label: "I'm on a call", hint: 'You report it' },
                      { value: 'DEMO_SIMULATED_ACTIVE_CALL', label: 'Simulate call signal', hint: 'DEMO ONLY' },
                    ] as { value: CallState; label: string; hint: string }[]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={callState === opt.value}
                        onClick={() => setCallState(opt.value)}
                        className={`min-h-[44px] px-3 py-2 border text-left text-xs font-semibold cursor-pointer transition-colors ${
                          callState === opt.value
                            ? opt.value === 'NONE'
                              ? 'bg-white border-[#0f62fe] text-[#161616]'
                              : 'bg-[#fff1f1] border-[#da1e28] text-[#750e13]'
                            : 'bg-white border-[#e0e0e0] text-[#161616] hover:bg-[#f4f4f4]'
                        }`}
                      >
                        <span className="block">{opt.label}</span>
                        <span className={`block text-[10px] ${opt.value === 'DEMO_SIMULATED_ACTIVE_CALL' ? 'font-bold text-[#6929c4]' : 'text-[#525252]'}`}>
                          {opt.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#8d8d8d]">
                All simulations are recorded in local audit log
              </span>

              <Button
                kind="primary"
                size="md"
                type="submit"
                disabled={simulating}
                renderIcon={ArrowRight}
              >
                {simulating ? 'Analyzing Behavioral Signals...' : 'Run Pre-Flight Risk Assessment'}
              </Button>
            </div>
          </form>
        </Tile>

        {/* Right Column: Assessment Dossier / Terminal */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <Tile className="bg-white p-0 border border-[#e0e0e0] overflow-hidden">
              {/* Outcome Header Banner */}
              <div
                className={`p-5 text-white ${
                  result.outcome === 'SEEK_TRUSTED_HELP'
                    ? 'bg-[#da1e28]'
                    : result.outcome === 'PAUSE_AND_VERIFY'
                    ? 'bg-[#b28600]'
                    : 'bg-[#0f62fe]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-black/20 border border-white/20">
                      SIMULATION #{result.simulation_id}
                    </span>
                    {result.policy_tier && (
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white/20 border border-white/30">
                        TIER: {result.policy_tier}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold">
                    Risk Score: {result.risk_score}/100
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight">
                  {result.outcome.replace(/_/g, ' ')}
                </h3>
                <p className="text-xs text-white/90 mt-1 leading-relaxed">
                  {result.decision_rationale}
                </p>
              </div>

              <div className="p-5 sm:p-6 space-y-5 text-xs">
                {result.risk_signals && result.risk_signals.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#525252] mb-2">
                      Why this result (contributing signals):
                    </h4>
                    <RiskSignalList signals={result.risk_signals} />
                  </div>
                )}

                {/* Verification Checklist */}
                {result.verification_steps && result.verification_steps.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#525252] mb-2">
                      Recommended Verification Protocol:
                    </h4>
                    <div className="space-y-2">
                      {result.verification_steps.map((step, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-[#161616] p-2.5 bg-[#f4f4f4] border border-[#e0e0e0] cursor-pointer hover:bg-[#e0e0e0] transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(checkedChecklist[idx])}
                            onChange={(e) => setCheckedChecklist({ ...checkedChecklist, [idx]: e.target.checked })}
                            className="mt-0.5"
                          />
                          <span className={checkedChecklist[idx] ? 'line-through text-[#8d8d8d]' : 'text-[#161616] font-medium'}>
                            {step}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-[#e0e0e0] flex flex-col gap-2.5">
                  {result.outcome === 'SEEK_TRUSTED_HELP' && (
                    <Button
                      kind="danger"
                      size="md"
                      renderIcon={Phone}
                      onClick={() => navigate('/family-shield')}
                    >
                      Contact Family Shield Guardian Now
                    </Button>
                  )}

                  <Button
                    kind="secondary"
                    size="md"
                    renderIcon={Flash}
                    onClick={() => setIsCheckInOpen(true)}
                  >
                    {result.checkin_status === 'COMPLETED' ? 'Redo Safety Check-in' : 'Start Safety Check-in'} (सुरक्षा जाँच)
                  </Button>

                  {(result.outcome !== 'PROCEED_WITH_CAUTION' || result.guardian_approval_recommended) && (
                    <GuardianApprovalPanel
                      simulationId={result.simulation_id}
                      eligibleGuardianCount={result.eligible_guardian_count ?? 0}
                    />
                  )}

                  {/* Save as Authoritative Incident Dossier */}
                  <Button
                    kind="tertiary"
                    size="md"
                    renderIcon={Save}
                    disabled={isSavingIncident || !!savedIncidentId}
                    onClick={handleSaveIncident}
                  >
                    {isSavingIncident
                      ? 'Saving Authoritative Case...'
                      : savedIncidentId
                      ? `Saved as Incident Case #${savedIncidentId}`
                      : 'Save as Incident Record (Dossier)'}
                  </Button>

                  {result.outcome !== 'PROCEED_WITH_CAUTION' && (
                    <Button
                      kind="primary"
                      size="md"
                      renderIcon={ArrowRight}
                      onClick={() => {
                        const incidentQuery = savedIncidentId ? `?incident_id=${encodeURIComponent(savedIncidentId)}` : '';
                        navigate(`/golden-hour${incidentQuery}`, {
                          state: {
                            incidentId: savedIncidentId || undefined,
                            classification: `Suspicious Coerced Payment (${result.outcome})`,
                            summary: `Simulation #${result.simulation_id}: Recipient ${result.vpa_or_account} for ₹${result.requested_amount.toLocaleString()}. Rationale: ${result.decision_rationale}`,
                            financialLoss: result.requested_amount,
                            recipient: result.vpa_or_account,
                            bankName: result.vpa_or_account.includes('@') ? 'UPI Payment App' : 'Bank Transfer',
                          },
                        });
                      }}
                    >
                      Open Golden Hour Recovery Dossier
                    </Button>
                  )}

                  <p className="text-[11px] text-[#8d8d8d] text-center italic">
                    {result.disclaimer}
                  </p>
                </div>
              </div>
            </Tile>
          ) : (
            /* Terminal Preview */
            <Tile className="bg-white p-6 border border-[#e0e0e0] space-y-4">
              <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-3">
                <span className="text-xs font-semibold text-[#161616]">UPI Transaction Interception Terminal</span>
                <Tag type="cool-gray" size="sm">LIVE PREVIEW</Tag>
              </div>

              <div className="p-4 bg-[#161616] text-white space-y-4">
                <div className="flex items-center justify-between text-[11px] text-[#c6c6c6] border-b border-[#393939] pb-2">
                  <span className="font-semibold text-white">Satark Saathi Guard</span>
                  <span className="font-mono text-[10px]">PRE-FLIGHT</span>
                </div>

                <div className="text-center py-2">
                  <p className="text-[11px] text-[#8d8d8d]">Paying to</p>
                  <h4 className="text-sm font-semibold text-white truncate px-2 mt-0.5">
                    {recipientName || 'Unverified Beneficiary'}
                  </h4>
                  <p className="font-mono text-xs text-[#c6c6c6] mt-0.5">
                    {vpa || 'handle@upi'}
                  </p>

                  <div className="mt-3">
                    <span className="text-2xl font-bold font-mono tracking-tight text-white">
                      ₹ {amount ? parseFloat(amount).toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#262626] border border-[#393939] text-[11px] text-[#c6c6c6] flex items-center justify-between">
                  <span>Transfer Status:</span>
                  <span className="text-[#f1c21b] font-semibold flex items-center gap-1">
                    <Time size={14} />
                    <span>Awaiting Checkpoint</span>
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#f4f4f4] border border-[#e0e0e0] text-xs text-[#525252] space-y-1">
                <p className="font-semibold text-[#161616] flex items-center gap-1.5">
                  <Information size={16} className="text-[#0f62fe]" />
                  <span>How This Protects You:</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  UPI transfers are instantaneous and irreversible. Satark Saathi detects psychological coercion, fraudulent VPA handles, and active call pressure before money leaves your account.
                </p>
              </div>
            </Tile>
          )}

          {/* Past Simulations */}
          {pastSimulations.length > 0 && (
            <Tile className="bg-white p-5 border border-[#e0e0e0]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#161616] mb-3 flex items-center gap-2">
                <Time size={16} className="text-[#0f62fe]" />
                <span>Recent Simulation Runs ({pastSimulations.length})</span>
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {pastSimulations.slice(0, 5).map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() => {
                      setResult(sim);
                      setCheckedChecklist({});
                    }}
                    className="p-2.5 border border-[#e0e0e0] hover:bg-[#f4f4f4] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-[#161616]">{sim.simulation_id}</span>
                        <Tag
                          type={sim.outcome === 'SEEK_TRUSTED_HELP' ? 'red' : sim.outcome === 'PAUSE_AND_VERIFY' ? 'warm-gray' : 'green'}
                          size="sm"
                        >
                          {sim.outcome.replace(/_/g, ' ')}
                        </Tag>
                      </div>
                      <span className="text-[11px] text-[#525252] font-mono block">
                        ₹{sim.requested_amount.toLocaleString()} &bull; {sim.vpa_or_account}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#8d8d8d]">
                      {new Date(sim.checked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </Tile>
          )}
        </div>
      </div>

      {/* Safety Check-in Modal */}
      {isCheckInOpen && result && (
        <Modal
          open={isCheckInOpen}
          modalHeading={`Safety Check-in • ${result.simulation_id}`}
          passiveModal
          onRequestClose={() => {
            setIsCheckInOpen(false);
            fetchPastSimulations();
          }}
          size="md"
        >
          <div className="p-2 max-h-[78vh] overflow-y-auto">
            <SafetyCheckIn
              simulationId={result.simulation_id}
              initialLanguage={toCheckinLanguage(appLanguage)}
              onCompleted={(r) =>
                setResult((prev) => (prev ? { ...prev, checkin_status: 'COMPLETED', checkin_tier: r.final_tier } : prev))
              }
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
