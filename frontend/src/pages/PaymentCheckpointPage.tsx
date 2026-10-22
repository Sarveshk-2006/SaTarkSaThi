import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckSquare,
  Square,
  HelpCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  UserCheck,
  UserX,
  PhoneCall,
  History,
  Lock,
  Info,
  CheckCircle2,
  AlertOctagon,
  LifeBuoy,
} from 'lucide-react';
import { api } from '../api/endpoints';
import { PaymentSimulation, PaymentOutcome } from '../api/types';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';

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

  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<PaymentSimulation | null>(null);
  const [pastSimulations, setPastSimulations] = useState<PaymentSimulation[]>([]);
  const [checkedChecklist, setCheckedChecklist] = useState<{ [idx: number]: boolean }>({});

  const fetchPastSimulations = async () => {
    try {
      const data = await api.getPaymentSimulations();
      setPastSimulations(data);
    } catch (err) {
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
    setResult(null);
    setCheckedChecklist({});
  };

  return (
    <div className="space-y-8">
      {/* Simulation Banner Notice (Mandatory Requirement) */}
      <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-900">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-amber-500/20 text-amber-700">
            <Info className="w-5 h-5" />
          </span>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-800">
              Pre-Transaction Risk Sandbox
            </h4>
            <p className="text-xs text-amber-900 font-semibold mt-0.5">
              SIMULATION ONLY: no real money has been moved or blocked.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-300">
          Educational Sandbox
        </span>
      </div>

      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-teal-800" />
          Payment Checkpoint
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Evaluate high-risk transfer pressures before authorizing UPI debits. Identifies coercion, authority claims, and deceptive handles.
        </p>
      </div>

      {/* Preset Test Scenarios */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
          Load Pre-Configured Test Simulations:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-teal-700 hover:bg-teal-50/40 transition-all bg-white shadow-xs cursor-pointer group"
            >
              <span className="text-xs font-bold text-slate-900 block group-hover:text-teal-900">
                {p.title}
              </span>
              <span className="text-[11px] font-mono text-slate-500 block mt-1">
                ₹{p.amount.toLocaleString()} &bull; {p.vpa}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Simulation Input Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSimulate} className="space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-teal-800" />
              Hypothetical Payment Parameters
            </h2>

            {/* Recipient VPA & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Recipient Identifier (UPI ID or Account) *
                </label>
                <input
                  type="text"
                  required
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value)}
                  placeholder="e.g. officer.court@oksbi"
                  className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                  className="w-full py-2.5 px-3.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono font-bold"
                />
              </div>
            </div>

            {/* Beneficiary Name & Beneficiary Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Claimed Beneficiary Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. CBI Escrow Cell"
                  className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Recipient Relationship
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewRecipient(true)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isNewRecipient
                        ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                    New Recipient
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewRecipient(false)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isNewRecipient
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Existing Contact
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Purpose */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Stated Payment Purpose
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Security deposit to avoid arrest warrant"
                className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {/* Social Engineering / Coercion Factors Section */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 block flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Coercion & Behavioral Risk Indicators (Check all that apply):
              </label>

              <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorityClaimed}
                    onChange={(e) => setAuthorityClaimed(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Authority Claimed (Police, CBI, Customs, Court, Electricity Board)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      The caller or message author claims official law enforcement or utility power.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secrecyDemanded}
                    onChange={(e) => setSecrecyDemanded(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Secrecy Demanded (&quot;Do not tell family, friends, or lawyer&quot;)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Common isolation tactic designed to prevent family intervention.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pressurePresent}
                    onChange={(e) => setPressurePresent(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Urgent Coercive Pressure (&quot;Pay within 15 minutes or face raid/disconnection&quot;)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Artificial urgency induces panic and disables rational financial verification.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guaranteedReturns}
                    onChange={(e) => setGuaranteedReturns(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Guaranteed Returns Promised (Prepaid Tasks, Crypto Trading, High Yield)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Promise of unrealistic returns or instant cashback upon deposit.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Reset Inputs
              </button>
              <button
                type="submit"
                disabled={simulating}
                className="px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {/* Outcome Header Banner */}
              <div
                className={`p-6 text-white ${
                  result.outcome === 'SEEK_TRUSTED_HELP'
                    ? 'bg-gradient-to-r from-red-700 to-rose-700'
                    : result.outcome === 'PAUSE_AND_VERIFY'
                    ? 'bg-gradient-to-r from-amber-600 to-yellow-600'
                    : 'bg-gradient-to-r from-emerald-700 to-teal-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/20 border border-white/20">
                    SIMULATION #{result.simulation_id}
                  </span>
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
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Detected Coercion Factors:
                    </h4>
                    <ul className="space-y-1.5">
                      {result.evidence_factors.map((factor, idx) => (
                        <li key={idx} className="text-xs text-slate-800 flex items-start gap-2 bg-red-50/70 p-2.5 rounded-xl border border-red-100">
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
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Recommended Verification Protocol:
                    </h4>
                    <div className="space-y-2">
                      {result.verification_steps.map((step, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-slate-700 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(checkedChecklist[idx])}
                            onChange={(e) => setCheckedChecklist({ ...checkedChecklist, [idx]: e.target.checked })}
                            className="mt-0.5 rounded text-teal-800 focus:ring-teal-700"
                          />
                          <span className={checkedChecklist[idx] ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                            {step}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
                  {result.outcome === 'SEEK_TRUSTED_HELP' && (
                    <button
                      onClick={() => navigate('/family-shield')}
                      className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Contact Family Shield Guardian Now
                    </button>
                  )}
                  {result.outcome !== 'PROCEED_WITH_CAUTION' && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/golden-hour', {
                          state: {
                            classification: `Suspicious Coerced Payment (${result.outcome})`,
                            summary: `Simulation #${result.simulation_id}: Recipient ${result.vpa_or_account} for ₹${result.requested_amount.toLocaleString()}. Rationale: ${result.decision_rationale}`,
                            financialLoss: result.requested_amount,
                            recipient: result.vpa_or_account,
                            bankName: result.vpa_or_account.includes('@') ? 'UPI Payment App' : 'Bank Transfer',
                          },
                        })
                      }
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <LifeBuoy className="w-4 h-4 text-amber-400" />
                      Open Golden Hour Recovery Dossier &rarr;
                    </button>
                  )}
                  <p className="text-[11px] text-slate-400 text-center italic">
                    {result.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500">
              <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">No Simulation Run Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Fill in the hypothetical transfer inputs or pick one of the test scenarios to test fraud risk scoring.
              </p>
            </div>
          )}

          {/* Past Simulations Ledger */}
          {pastSimulations.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-800" />
                Past Simulation Runs ({pastSimulations.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {pastSimulations.slice(0, 5).map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() => {
                      setResult(sim);
                      setCheckedChecklist({});
                    }}
                    className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-900">{sim.simulation_id}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          sim.outcome === 'SEEK_TRUSTED_HELP' ? 'bg-red-100 text-red-800' : sim.outcome === 'PAUSE_AND_VERIFY' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sim.outcome.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        ₹{sim.requested_amount.toLocaleString()} &bull; {sim.vpa_or_account}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(sim.checked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
