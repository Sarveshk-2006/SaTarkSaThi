import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  UserCheck,
  UserX,
  PhoneCall,
  History,
  Info,
  CheckCircle2,
  AlertOctagon,
  LifeBuoy,
  Save,
  X,
  Lock,
  Clock,
  TrendingUp,
  Zap,
  Check,
  RotateCcw,
  Smartphone,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { api } from '../api/endpoints';
import { PaymentSimulation } from '../api/types';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { SimulationBanner } from '../components/common/SimulationBanner';

interface PresetSimulation {
  title: string;
  category: string;
  categoryColor: string;
  vpa: string;
  name: string;
  amount: number;
  purpose: string;
  is_new: boolean;
  pressure: boolean;
  authority: boolean;
  secrecy: boolean;
  returns: boolean;
}

const PRESETS: PresetSimulation[] = [
  {
    title: 'Digital Arrest Bail Deposit',
    category: 'ACUTE EXTORTION',
    categoryColor: 'bg-red-100 text-red-800 border-red-300',
    vpa: 'cbi.court.clearance@oksbi',
    name: 'CBI Escrow Cell',
    amount: 50000,
    purpose: 'Clearance fee to drop PMLA arrest warrant',
    is_new: true,
    pressure: true,
    authority: true,
    secrecy: true,
    returns: false,
  },
  {
    title: 'Electricity Bill Disconnection',
    category: 'UTILITY FRAUD',
    categoryColor: 'bg-amber-100 text-amber-800 border-amber-300',
    vpa: 'officer.bses.bill@ybl',
    name: 'BSES Electricity Officer',
    amount: 12500,
    purpose: 'Pending utility bill to stop disconnection tonight',
    is_new: true,
    pressure: true,
    authority: false,
    secrecy: false,
    returns: false,
  },
  {
    title: 'Telegram Guaranteed Return',
    category: 'TASK SCAM',
    categoryColor: 'bg-purple-100 text-purple-800 border-purple-300',
    vpa: '9810123456@paytm',
    name: 'VIP Investment Desk',
    amount: 25000,
    purpose: 'Crypto arbitrage investment task',
    is_new: true,
    pressure: false,
    authority: false,
    secrecy: false,
    returns: true,
  },
  {
    title: 'Legitimate Grocery Store QR',
    category: 'BENIGN MERCHANT',
    categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    vpa: 'kirana.store@icici',
    name: 'Sharma General Store',
    amount: 650,
    purpose: 'Weekly grocery supplies payment',
    is_new: false,
    pressure: false,
    authority: false,
    secrecy: false,
    returns: false,
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
  const navigate = useNavigate();
  const location = useLocation();

  // Primary payment parameters
  const [vpa, setVpa] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isNewRecipient, setIsNewRecipient] = useState(true);

  // Behavioral coercion inputs
  const [pressurePresent, setPressurePresent] = useState(false);
  const [authorityClaimed, setAuthorityClaimed] = useState(false);
  const [secrecyDemanded, setSecrecyDemanded] = useState(false);
  const [guaranteedReturns, setGuaranteedReturns] = useState(false);
  const [isOnCall, setIsOnCall] = useState(false);

  // AI Safety Check-in states
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInQ1, setCheckInQ1] = useState<boolean | null>(null);
  const [checkInQ2, setCheckInQ2] = useState<boolean | null>(null);
  const [checkInQ3, setCheckInQ3] = useState<boolean | null>(null);

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
    setIsOnCall(preset.authority || preset.pressure);
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
        pressure_present: pressurePresent || isOnCall,
        authority_claimed: authorityClaimed,
        secrecy_demanded: secrecyDemanded,
        guaranteed_returns: guaranteedReturns,
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
    setIsOnCall(false);
    setIsCheckInOpen(false);
    setCheckInQ1(null);
    setCheckInQ2(null);
    setCheckInQ3(null);
    setResult(null);
    setSavedIncidentId(null);
    setCheckedChecklist({});
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Simulation Sandbox Notice Banner */}
      <SimulationBanner
        title="Pre-Transaction Risk Sandbox"
        message="SIMULATION ONLY: No real banking transaction or UPI debit is executed. Evaluate transfer legitimacy and social engineering pressure safely."
        variant="amber"
        badgeText="SANDBOX ENVIRONMENT"
      />

      {/* Header Bar */}
      <div className="border-b border-[#E2E8F0] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#176B58] text-white">
              <CreditCard className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-bold text-[#142A36] tracking-tight">
              Payment Checkpoint &amp; Coercion Firewall
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Intercept suspicious UPI transfers before authorization. Evaluates psychological pressure, authority claims, and unverified VPA handles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F7F8F4] text-[#64748B] hover:text-[#142A36] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Inputs</span>
          </button>
        </div>
      </div>

      {/* Linear-Style Preset Scenario Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#176B58]" />
            <span>Select Test Scenario (Pre-Configured Threat Simulations):</span>
          </label>
          <span className="text-[11px] text-[#94A3B8]">Click to load parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((p, idx) => {
            const isSelected = selectedPresetIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p, idx)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'border-[#176B58] bg-[#DCEDE5]/30 shadow-subtle ring-1 ring-[#176B58]'
                    : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F7F8F4] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${p.categoryColor}`}>
                    {p.category}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#142A36]">
                    ₹{p.amount.toLocaleString()}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[#142A36] truncate group-hover:text-[#176B58] transition-colors">
                  {p.title}
                </h4>
                <p className="text-[11px] font-mono text-[#64748B] truncate mt-1">
                  {p.vpa}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Form Left, Radar Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Payment Parameters & Coercion Toggles */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-5 sm:p-6 shadow-card space-y-5">
          <form onSubmit={handleSimulate} className="space-y-5">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#176B58]"></span>
                <h3 className="text-sm font-bold text-[#142A36]">
                  Pre-Flight Transaction Parameters
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-[#176B58] bg-[#DCEDE5] px-2 py-0.5 rounded-full">
                Interactive Checkpoint
              </span>
            </div>

            {/* Recipient VPA & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#142A36] mb-1.5">
                  Recipient Identifier (UPI ID or Account) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B] font-mono font-bold text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value)}
                    placeholder="e.g. officer.court@oksbi"
                    className="w-full py-2.5 pl-8 pr-3 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] font-mono text-[#142A36] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142A36] mb-1.5">
                  Requested Amount (INR) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#142A36] font-bold text-sm">
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
                    className="w-full py-2.5 pl-8 pr-3 text-sm rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] font-mono font-bold text-[#142A36] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Claimed Beneficiary & Relationship */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#142A36] mb-1.5">
                  Claimed Beneficiary Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. CBI Escrow Cell"
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] text-[#142A36] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142A36] mb-1.5">
                  Recipient Familiarity Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewRecipient(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isNewRecipient
                        ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F7F8F4]'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                    <span>New / Unverified</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewRecipient(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isNewRecipient
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F7F8F4]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Known Contact</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Purpose Input & Suggestions */}
            <div>
              <label className="block text-xs font-bold text-[#142A36] mb-1.5">
                Stated Payment Purpose
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Clearance fee to drop PMLA arrest warrant"
                className="w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] text-[#142A36] transition-colors"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-[#94A3B8]">Quick picks:</span>
                {PURPOSE_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPurpose(s)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#F7F8F4] hover:bg-[#EAECE6] text-[#64748B] border border-[#E2E8F0] cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Linear-Style Coercion & Behavioral Indicators */}
            <div className="pt-2 border-t border-[#F1F5F9] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#142A36] flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  <span>Coercion &amp; Psychological Pressure Indicators:</span>
                </label>
                <span className="text-[10px] text-[#94A3B8]">Toggle active factors</span>
              </div>

              <div className="space-y-2">
                {/* 1. Authority Claimed */}
                <div
                  onClick={() => setAuthorityClaimed(!authorityClaimed)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    authorityClaimed
                      ? 'bg-red-50/70 border-red-300 ring-1 ring-red-400/20'
                      : 'bg-[#F7F8F4] border-[#E2E8F0] hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${authorityClaimed ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#142A36] block">
                        Authority Claimed (Police, CBI, Customs, Court, Electricity Board)
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Caller or message author claims official power or legal consequences.
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${authorityClaimed ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-slate-300'}`}>
                    {authorityClaimed && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* 2. Secrecy Demanded */}
                <div
                  onClick={() => setSecrecyDemanded(!secrecyDemanded)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    secrecyDemanded
                      ? 'bg-red-50/70 border-red-300 ring-1 ring-red-400/20'
                      : 'bg-[#F7F8F4] border-[#E2E8F0] hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${secrecyDemanded ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#142A36] block">
                        Secrecy Demanded (&quot;Do not tell family, friends, or bank&quot;)
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Common isolation tactic designed to prevent family intervention.
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${secrecyDemanded ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-slate-300'}`}>
                    {secrecyDemanded && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* 3. Urgent Pressure */}
                <div
                  onClick={() => setPressurePresent(!pressurePresent)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    pressurePresent
                      ? 'bg-red-50/70 border-red-300 ring-1 ring-red-400/20'
                      : 'bg-[#F7F8F4] border-[#E2E8F0] hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${pressurePresent ? 'bg-red-200 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                      <Clock className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#142A36] block">
                        Urgent Coercive Pressure (&quot;Pay in 15 mins or face raid/disconnection&quot;)
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Artificial urgency disables rational financial verification.
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${pressurePresent ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-slate-300'}`}>
                    {pressurePresent && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* 4. Guaranteed Returns */}
                <div
                  onClick={() => setGuaranteedReturns(!guaranteedReturns)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    guaranteedReturns
                      ? 'bg-purple-50/70 border-purple-300 ring-1 ring-purple-400/20'
                      : 'bg-[#F7F8F4] border-[#E2E8F0] hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${guaranteedReturns ? 'bg-purple-200 text-purple-800' : 'bg-slate-200 text-slate-700'}`}>
                      <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#142A36] block">
                        Guaranteed Returns Promised (Prepaid Tasks, Crypto, High Yield)
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        Promise of impossible returns or instant deposit multiplication.
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${guaranteedReturns ? 'bg-purple-600 border-purple-700 text-white' : 'bg-white border-slate-300'}`}>
                    {guaranteedReturns && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* 5. Active Call in Progress (Signature Digital Arrest Feature) */}
                <div
                  onClick={() => {
                    const next = !isOnCall;
                    setIsOnCall(next);
                    if (next) setPressurePresent(true);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isOnCall
                      ? 'bg-red-100/90 border-red-400 ring-2 ring-red-500/30 shadow-xs'
                      : 'bg-[#F7F8F4] border-[#E2E8F0] hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isOnCall ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'}`}>
                      <PhoneCall className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-950">
                          Active Phone or Video Call in Progress
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-600 text-white uppercase tracking-wider">
                          LIVE COERCION
                        </span>
                      </div>
                      <span className="text-[11px] text-red-900">
                        Caller is on the line right now instructing you to make this payment.
                      </span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${isOnCall ? 'bg-red-600 border-red-700 text-white' : 'bg-white border-slate-300'}`}>
                    {isOnCall && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#94A3B8]">
                All simulations are recorded in local audit log
              </span>

              <button
                type="submit"
                disabled={simulating}
                className="px-6 py-3 rounded-xl bg-[#176B58] hover:bg-[#135948] text-white font-bold text-xs transition-all shadow-subtle flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{simulating ? 'Analyzing Behavioral Signals...' : 'Run Pre-Flight Risk Assessment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Interactive UPI Terminal & Assessment Dossier */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            /* Authoritative Decision Dossier */
            <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-card animate-in fade-in duration-200">
              {/* Outcome Header Banner */}
              <div
                className={`p-5 text-white ${
                  result.outcome === 'SEEK_TRUSTED_HELP'
                    ? 'bg-[#B91C1C]'
                    : result.outcome === 'PAUSE_AND_VERIFY'
                    ? 'bg-[#B45309]'
                    : 'bg-[#176B58]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/20 border border-white/20">
                      SIMULATION #{result.simulation_id}
                    </span>
                    {result.policy_tier && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-white/20 border border-white/30">
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

              <div className="p-5 sm:p-6 space-y-5">
                {/* Detected Factors */}
                {result.evidence_factors && result.evidence_factors.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                      Detected Coercion Factors:
                    </h4>
                    <ul className="space-y-1.5">
                      {result.evidence_factors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-red-950 flex items-start gap-2 bg-red-50/80 p-2.5 rounded-xl border border-red-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Verification Checklist */}
                {result.verification_steps && result.verification_steps.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                      Recommended Verification Protocol:
                    </h4>
                    <div className="space-y-2">
                      {result.verification_steps.map((step, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-[#142A36] p-2.5 rounded-xl bg-[#F7F8F4] border border-[#E2E8F0] cursor-pointer hover:bg-slate-100/70 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(checkedChecklist[idx])}
                            onChange={(e) => setCheckedChecklist({ ...checkedChecklist, [idx]: e.target.checked })}
                            className="mt-0.5 rounded text-[#176B58] focus:ring-[#176B58]"
                          />
                          <span className={checkedChecklist[idx] ? 'line-through text-[#94A3B8]' : 'text-[#142A36] font-medium'}>
                            {step}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-[#F1F5F9] flex flex-col gap-2.5">
                  {result.outcome === 'SEEK_TRUSTED_HELP' && (
                    <button
                      onClick={() => navigate('/family-shield')}
                      className="w-full py-2.5 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Contact Family Shield Guardian Now</span>
                    </button>
                  )}

                  {result.outcome !== 'PROCEED_WITH_CAUTION' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCheckInQ1(isOnCall ? true : authorityClaimed ? true : null);
                        setCheckInQ2(authorityClaimed || secrecyDemanded ? true : null);
                        setCheckInQ3(guaranteedReturns ? true : null);
                        setIsCheckInOpen(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Start 30-Second AI Safety Check-in (AI सुरक्षा संवाद)</span>
                    </button>
                  )}

                  {/* Save as Authoritative Incident Dossier */}
                  <button
                    type="button"
                    onClick={handleSaveIncident}
                    disabled={isSavingIncident || !!savedIncidentId}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      savedIncidentId
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-default'
                        : 'bg-[#176B58] hover:bg-[#135948] text-white shadow-xs'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {isSavingIncident
                      ? 'Saving Authoritative Case...'
                      : savedIncidentId
                      ? `Saved as Incident Case #${savedIncidentId}`
                      : 'Save as Incident Record (Dossier)'}
                  </button>

                  {result.outcome !== 'PROCEED_WITH_CAUTION' && (
                    <button
                      type="button"
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
                      className="w-full py-2.5 px-4 rounded-xl bg-[#142A36] hover:bg-[#1E334E] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <LifeBuoy className="w-4 h-4 text-amber-400" />
                      <span>Open Golden Hour Recovery Dossier &rarr;</span>
                    </button>
                  )}

                  <p className="text-[11px] text-[#94A3B8] text-center italic">
                    {result.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Pre-Flight Smartphone UPI Interception Preview Terminal */
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#176B58]" />
                  <span className="text-xs font-bold text-[#142A36]">UPI Transaction Interception Terminal</span>
                </div>
                <span className="text-[10px] font-mono text-[#94A3B8]">LIVE PREVIEW</span>
              </div>

              {/* Simulated Phone UI Screen */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#142A36] to-[#0E1E27] text-white space-y-4 shadow-sm">
                <div className="flex items-center justify-between text-[11px] text-[#DCEDE5] border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold">Satark Saathi Guard</span>
                  </div>
                  <span className="font-mono text-[10px]">PRE-FLIGHT</span>
                </div>

                <div className="text-center py-2">
                  <p className="text-[11px] text-slate-300">Paying to</p>
                  <h4 className="text-sm font-bold text-white truncate px-2 mt-0.5">
                    {recipientName || 'Unverified Beneficiary'}
                  </h4>
                  <p className="font-mono text-xs text-[#DCEDE5] mt-0.5">
                    {vpa || 'handle@upi'}
                  </p>

                  <div className="mt-3">
                    <span className="text-2xl font-bold font-mono tracking-tight text-white">
                      ₹ {amount ? parseFloat(amount).toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Transfer Status:</span>
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Awaiting Checkpoint</span>
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F8F4] border border-[#E2E8F0] text-xs text-[#64748B] space-y-1.5">
                <p className="font-semibold text-[#142A36] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#176B58]" />
                  <span>How This Protects You:</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  UPI transfers are instantaneous and irreversible. Satark Saathi detects psychological coercion, fraudulent VPA handles, and active call pressure before money leaves your account.
                </p>
              </div>
            </div>
          )}

          {/* Past Simulations Ledger */}
          {pastSimulations.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#142A36] mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-[#176B58]" />
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
                    className="p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F7F8F4] transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#142A36]">{sim.simulation_id}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          sim.outcome === 'SEEK_TRUSTED_HELP' ? 'bg-red-100 text-red-800' : sim.outcome === 'PAUSE_AND_VERIFY' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sim.outcome.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] font-mono block">
                        ₹{sim.requested_amount.toLocaleString()} &bull; {sim.vpa_or_account}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#94A3B8]">
                      {new Date(sim.checked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 30-Second AI Safety Check-in Modal (AI सुरक्षा संवाद) */}
      {isCheckInOpen && (
        <div className="fixed inset-0 z-50 bg-[#142A36]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E2E8F0] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="p-5 bg-[#142A36] text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-[#176B58] text-white">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-white">
                    30-Second AI Safety Check-in
                  </h3>
                </div>
                <p className="text-xs text-[#DCEDE5] mt-1 font-hindi">
                  AI सुरक्षा संवाद &bull; 30 seconds to break cognitive tunnel vision
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckInOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-[#64748B] leading-relaxed">
                When scammers create panic or secrecy, your brain enters fight-or-flight mode. Answer these 3 questions truthfully to verify your situation:
              </p>

              {/* Q1 */}
              <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] space-y-2">
                <p className="text-xs font-bold text-[#142A36]">
                  1. Is someone on a phone call or video call telling you to make this payment right now?
                </p>
                <p className="text-[11px] text-[#64748B]">
                  क्या कोई कॉल पर रहकर आपसे अभी पैसे भेजने को कह रहा है?
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCheckInQ1(true)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      checkInQ1 === true
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white text-[#142A36] border border-[#E2E8F0] hover:bg-red-50'
                    }`}
                  >
                    YES (हाँ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckInQ1(false)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      checkInQ1 === false
                        ? 'bg-[#176B58] text-white shadow-xs'
                        : 'bg-white text-[#142A36] border border-[#E2E8F0] hover:bg-emerald-50'
                    }`}
                  >
                    NO (नहीं)
                  </button>
                </div>
              </div>

              {/* Q2 */}
              <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] space-y-2">
                <p className="text-xs font-bold text-[#142A36]">
                  2. Did someone claim to be police, CBI, customs, or bank officials and tell you NOT to tell anyone?
                </p>
                <p className="text-[11px] text-[#64748B]">
                  क्या किसी ने पुलिस या CBI बनकर किसी को न बताने की धमकी दी है?
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCheckInQ2(true)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      checkInQ2 === true
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white text-[#142A36] border border-[#E2E8F0] hover:bg-red-50'
                    }`}
                  >
                    YES (हाँ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckInQ2(false)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      checkInQ2 === false
                        ? 'bg-[#176B58] text-white shadow-xs'
                        : 'bg-white text-[#142A36] border border-[#E2E8F0] hover:bg-emerald-50'
                    }`}
                  >
                    NO (नहीं)
                  </button>
                </div>
              </div>

              {/* Q3 */}
              <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] space-y-2">
                <p className="text-xs font-bold text-[#142A36]">
                  3. Were you promised guaranteed high returns, a task reward, or told your power will be cut in 15 mins?
                </p>
                <p className="text-[11px] text-[#64748B]">
                  क्या बिना जोखिम बड़े मुनाफे का लालच या बिजली कटने का डर दिखाया गया है?
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCheckInQ3(true)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      checkInQ3 === true
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white text-[#142A36] border border-[#E2E8F0] hover:bg-red-50'
                    }`}
                  >
                    YES (हाँ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckInQ3(false)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      checkInQ3 === false
                        ? 'bg-[#176B58] text-white shadow-xs'
                        : 'bg-white text-[#142A36] border border-[#E2E8F0] hover:bg-emerald-50'
                    }`}
                  >
                    NO (नहीं)
                  </button>
                </div>
              </div>

              {/* Diagnosis Feedback */}
              {(checkInQ1 === true || checkInQ2 === true) ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-2">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
                    <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
                    <span>DIAGNOSIS: Active Digital Arrest &amp; Extortion Coercion</span>
                  </div>
                  <p className="text-xs text-red-950 leading-relaxed">
                    <strong>DO NOT TRANSFER MONEY.</strong> Real police, CBI, or Supreme Court judges NEVER issue arrest warrants over Skype or WhatsApp, and NEVER demand bail deposits into personal UPI IDs.
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCheckInOpen(false);
                        navigate('/family-shield');
                      }}
                      className="py-2 px-3 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs text-center cursor-pointer"
                    >
                      Alert Family Guardian
                    </button>
                    <a
                      href="tel:1930"
                      className="py-2 px-3 rounded-lg bg-[#142A36] hover:bg-black text-white font-bold text-xs text-center cursor-pointer"
                    >
                      Call Cyber Helpline 1930
                    </a>
                  </div>
                </div>
              ) : checkInQ3 === true ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>DIAGNOSIS: High-Probability Investment or Utility Scam</span>
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    <strong>STOP.</strong> Genuine investment firms or electricity distribution boards do not collect payments into individual personal UPI handles or offer 200% returns for clicking Telegram links.
                  </p>
                </div>
              ) : (checkInQ1 === false && checkInQ2 === false && checkInQ3 === false) ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No Immediate Coercion Detected</span>
                  </div>
                  <p className="text-xs text-emerald-950">
                    Always verify the exact VPA name before entering your UPI PIN. Never share your OTP or screen.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Select YES or NO for all 3 questions to evaluate psychological coercion.</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-[#F7F8F4] border-t border-[#E2E8F0] flex justify-end">
              <button
                type="button"
                onClick={() => setIsCheckInOpen(false)}
                className="py-2 px-4 rounded-xl bg-[#142A36] hover:bg-[#1E334E] text-white font-semibold text-xs cursor-pointer transition-colors"
              >
                Return to Checkpoint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
