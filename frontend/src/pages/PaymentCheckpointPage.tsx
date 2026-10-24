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
  HelpCircle,
} from 'lucide-react';
import { api } from '../api/endpoints';
import { PaymentSimulation } from '../api/types';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { SimulationBanner } from '../components/common/SimulationBanner';

interface PresetSimulation {
  title: string;
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
    title: 'Digital Arrest Bail Deposit (Severe Extortion)',
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
    title: 'Electricity Bill Disconnection Scam',
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
    title: 'Telegram Guaranteed Return Scheme',
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
    vpa: 'kirana.store@icici',
    name: 'Sharma General Store',
    amount: 650,
    purpose: 'Monthly grocery provisions',
    is_new: false,
    pressure: false,
    authority: false,
    secrecy: false,
    returns: false,
  },
];

export const PaymentCheckpointPage: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Inputs
  const [vpa, setVpa] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState('');
  const [isNewRecipient, setIsNewRecipient] = useState(true);

  // Behavioral coercion inputs
  const [pressurePresent, setPressurePresent] = useState(false);
  const [authorityClaimed, setAuthorityClaimed] = useState(false);
  const [secrecyDemanded, setSecrecyDemanded] = useState(false);
  const [guaranteedReturns, setGuaranteedReturns] = useState(false);
  const [isOnCall, setIsOnCall] = useState(false);
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

  const handleApplyPreset = (preset: PresetSimulation) => {
    setVpa(preset.vpa);
    setRecipientName(preset.name);
    setAmount(preset.amount.toString());
    setPurpose(preset.purpose);
    setIsNewRecipient(preset.is_new);
    setPressurePresent(preset.pressure);
    setAuthorityClaimed(preset.authority);
    setSecrecyDemanded(preset.secrecy);
    setGuaranteedReturns(preset.returns);
    setResult(null);
    setSavedIncidentId(null);
    setCheckedChecklist({});
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!vpa.trim()) {
      showToast({ type: 'warning', title: 'UPI ID Required', message: 'Enter a valid recipient handle or account number.' });
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast({ type: 'error', title: 'Invalid Amount', message: 'Payment amount must be greater than zero.' });
      return;
    }

    setSimulating(true);
    setCheckedChecklist({});
    setSavedIncidentId(null);
    try {
      const res = await api.simulatePayment({
        vpa_or_account: vpa.trim(),
        recipient_name: recipientName.trim() || undefined,
        is_new_recipient: isNewRecipient,
        requested_amount: parsedAmount,
        purpose: purpose.trim() || undefined,
        pressure_present: pressurePresent,
        authority_claimed: authorityClaimed,
        secrecy_demanded: secrecyDemanded,
        guaranteed_returns: guaranteedReturns,
      });

      setResult(res);
      fetchPastSimulations();

      showToast({
        type: res.outcome === 'SEEK_TRUSTED_HELP' ? 'error' : res.outcome === 'PAUSE_AND_VERIFY' ? 'warning' : 'success',
        title: `Simulation Outcome: ${res.outcome.replace(/_/g, ' ')}`,
        message: `Assessed Risk Score: ${res.risk_score}/100`,
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
      if (res.already_persisted) {
        showToast({
          type: 'info',
          title: 'Already Saved',
          message: `This simulation is already saved as Incident Case #${res.incident_id}.`,
        });
      } else {
        showToast({
          type: 'success',
          title: 'Incident Record Created',
          message: `Saved authoritative case #${res.incident_id} with loss ₹${res.financial_loss.toLocaleString()}.`,
        });
      }
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
    <div className="space-y-6">
      {/* Simulation Banner Notice */}
      <SimulationBanner
        title="Pre-Transaction Risk Sandbox"
        message="SIMULATION ONLY: No real banking transaction or UPI transfer will ever be executed. Test suspicious payment requests and evaluate coercion risk safely."
        variant="amber"
        badgeText="PROTOTYPE SIMULATION"
      />

      {/* Page Title */}
      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-xl font-bold text-[#142A36] flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#176B58]" />
          <span>Payment Checkpoint</span>
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Evaluate high-risk transfer pressures before authorizing UPI debits. Identifies coercion, authority claims, and deceptive handles.
        </p>
      </div>

      {/* Preset Test Scenarios */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2.5 block">
          Load Pre-Configured Test Simulations:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-left p-3.5 rounded-2xl border border-[#E2E8F0] hover:border-[#176B58] hover:bg-[#DCEDE5]/40 transition-all bg-white shadow-card cursor-pointer group"
            >
              <span className="text-xs font-bold text-[#142A36] block group-hover:text-[#176B58]">
                {p.title}
              </span>
              <span className="text-[11px] font-mono text-[#64748B] block mt-1">
                ₹{p.amount.toLocaleString()} &bull; {p.vpa}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Simulation Input Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-card">
          <form onSubmit={handleSimulate} className="space-y-5">
            <h2 className="text-sm font-bold text-[#142A36] flex items-center gap-2 border-b border-[#F1F5F9] pb-3">
              <Sparkles className="w-4 h-4 text-[#176B58]" />
              <span>Hypothetical Payment Parameters</span>
            </h2>

            {/* Recipient VPA & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#142A36] mb-1.5">
                  Recipient Identifier (UPI ID or Account) *
                </label>
                <input
                  type="text"
                  required
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value)}
                  placeholder="e.g. officer.court@oksbi"
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] font-mono text-[#142A36]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#142A36] mb-1.5">
                  Requested Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] font-mono font-bold text-[#142A36]"
                />
              </div>
            </div>

            {/* Beneficiary Name & Beneficiary Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#142A36] mb-1.5">
                  Claimed Beneficiary Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. CBI Escrow Cell"
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] text-[#142A36]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#142A36] mb-1.5">
                  Recipient Relationship
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewRecipient(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isNewRecipient
                        ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-subtle'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F7F8F4]'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                    <span>New Recipient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewRecipient(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isNewRecipient
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-subtle'
                        : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F7F8F4]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Existing Contact</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Purpose */}
            <div>
              <label className="block text-xs font-semibold text-[#142A36] mb-1.5">
                Stated Payment Purpose
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Security deposit to avoid arrest warrant"
                className="w-full py-2.5 px-3.5 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] text-[#142A36]"
              />
            </div>

            {/* Social Engineering / Coercion Factors Section */}
            <div className="pt-2 border-t border-[#F1F5F9]">
              <label className="text-xs font-bold uppercase tracking-wider text-[#142A36] mb-3 block flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-600" />
                <span>Coercion & Behavioral Risk Indicators (Check all that apply):</span>
              </label>

              <div className="space-y-2.5 bg-[#F7F8F4] p-4 rounded-xl border border-[#E2E8F0]">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorityClaimed}
                    onChange={(e) => setAuthorityClaimed(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#142A36] block">
                      Authority Claimed (Police, CBI, Customs, Court, Electricity Board)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      The caller or message author claims official law enforcement or utility power.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secrecyDemanded}
                    onChange={(e) => setSecrecyDemanded(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#142A36] block">
                      Secrecy Demanded (&quot;Do not tell family, friends, or lawyer&quot;)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Common isolation tactic designed to prevent family intervention.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pressurePresent}
                    onChange={(e) => setPressurePresent(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#142A36] block">
                      Urgent Coercive Pressure (&quot;Pay within 15 minutes or face raid/disconnection&quot;)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Artificial urgency induces panic and disables rational financial verification.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guaranteedReturns}
                    onChange={(e) => setGuaranteedReturns(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#142A36] block">
                      Guaranteed Returns Promised (Prepaid Tasks, Crypto Trading, High Yield)
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Promise of unrealistic returns or instant cashback upon deposit.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer bg-red-50/60 p-2.5 rounded-lg border border-red-200">
                  <input
                    type="checkbox"
                    checked={isOnCall}
                    onChange={(e) => {
                      setIsOnCall(e.target.checked);
                      if (e.target.checked) setPressurePresent(true);
                    }}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-red-900 block flex items-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                      Active Phone or Video Call in Progress
                    </span>
                    <span className="text-[11px] text-red-800">
                      You are currently on a call while attempting this transaction (hallmark of live Digital Arrest coercion).
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#142A36] hover:bg-[#F7F8F4] rounded-xl transition-colors cursor-pointer"
              >
                Reset Inputs
              </button>
              <button
                type="submit"
                disabled={simulating}
                className="px-6 py-2.5 rounded-xl bg-[#176B58] hover:bg-[#135948] text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {simulating ? 'Analyzing Risk...' : 'Run Sandbox Risk Assessment'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Risk Assessment Result Card */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
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
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        result.policy_tier === 'RED'
                          ? 'bg-red-950/80 text-red-200 border border-red-400/40'
                          : result.policy_tier === 'AMBER'
                          ? 'bg-amber-950/80 text-amber-200 border border-amber-400/40'
                          : 'bg-emerald-950/80 text-emerald-200 border border-emerald-400/40'
                      }`}>
                        Tier: {result.policy_tier}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold">
                    Risk Score: {result.risk_score}/100
                  </span>
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  {result.outcome.replace(/_/g, ' ')}
                </h3>
                <p className="text-xs text-white/90 mt-1 leading-relaxed">
                  {result.decision_rationale}
                </p>
              </div>

              <div className="p-6 space-y-5">
                {/* Evidence Factors */}
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
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
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
            <div className="bg-white rounded-2xl border-2 border-dashed border-[#CBD5E1] p-8 text-center text-[#64748B]">
              <ShieldAlert className="w-10 h-10 text-[#94A3B8] mx-auto mb-3" />
              <h4 className="font-bold text-[#142A36] text-sm">No Simulation Run Yet</h4>
              <p className="text-xs text-[#64748B] mt-1 max-w-xs mx-auto leading-relaxed">
                Fill in the hypothetical transfer inputs or pick one of the test scenarios to test fraud risk scoring.
              </p>
            </div>
          )}

          {/* Past Simulations Ledger */}
          {pastSimulations.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#142A36] mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-[#176B58]" />
                <span>Past Simulation Runs ({pastSimulations.length})</span>
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
                    <span>DIAGNOSIS: Active Digital Arrest & Extortion Coercion</span>
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
