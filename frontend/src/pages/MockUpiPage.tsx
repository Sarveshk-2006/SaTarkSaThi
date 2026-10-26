import React, { useCallback, useEffect, useState } from 'react';
import { AlertOctagon, ArrowLeft, CheckCircle2, Clock, PhoneCall, ShieldCheck, Smartphone, XCircle } from 'lucide-react';
import { api } from '../api/endpoints';
import { CallState, MockLedgerEntry, SdkDecision } from '../api/types';
import { satarkSafetySdk } from '../sdk/satarkSafetySdk';
import { SafetyCheckIn, toCheckinLanguage } from '../components/payment/SafetyCheckIn';
import { GuardianApprovalPanel, RiskSignalList } from '../components/payment/PaymentSafetyWidgets';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

type Stage = 'ENTER' | 'DECISION' | 'DONE';

const QUICK_FILLS = [
  { label: 'Known grocery store', vpa: 'kirana.store@icici', name: 'Sharma General Store', amount: '650', note: 'Groceries', call: 'NONE' as CallState },
  { label: '"CBI officer" on video call', vpa: 'cbi.court.clearance@oksbi', name: 'CBI Escrow Cell', amount: '50000', note: 'Bail to cancel arrest warrant', call: 'DEMO_SIMULATED_ACTIVE_CALL' as CallState },
  { label: 'New landlord deposit', vpa: 'landlord.kapoor@oksbi', name: 'R. Kapoor', amount: '30000', note: 'Rent deposit', call: 'NONE' as CallState },
];

const DECISION_STYLE: Record<string, string> = {
  ALLOW: 'bg-emerald-50 border-emerald-300 text-emerald-950',
  CHECKIN_REQUIRED: 'bg-amber-50 border-amber-300 text-amber-950',
  GUARDIAN_APPROVAL_REQUIRED: 'bg-amber-50 border-amber-300 text-amber-950',
  BLOCK_RECOMMENDED: 'bg-red-50 border-red-300 text-red-950',
};

export const MockUpiPage: React.FC = () => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [stage, setStage] = useState<Stage>('ENTER');
  const [vpa, setVpa] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [callState, setCallState] = useState<CallState>('NONE');
  const [decision, setDecision] = useState<SdkDecision | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');
  const [ledger, setLedger] = useState<MockLedgerEntry[]>([]);
  const [eligibleGuardians, setEligibleGuardians] = useState(0);

  const loadLedger = useCallback(() => {
    api.getMockLedger().then(setLedger).catch(() => setLedger([]));
  }, []);

  useEffect(() => {
    loadLedger();
    api
      .getContacts()
      .then((cs) => setEligibleGuardians(cs.filter((c) => c.is_active && c.consent_granted && c.contact_consent_status === 'ACCEPTED').length))
      .catch(() => setEligibleGuardians(0));
  }, [loadLedger]);

  const refreshDecision = useCallback(async () => {
    if (!decision) return;
    try {
      setDecision(await satarkSafetySdk.getDecision(decision.simulation_id));
    } catch {
      // keep last known decision
    }
  }, [decision]);

  useEffect(() => {
    const onLive = (e: Event) => {
      if ((e as CustomEvent).detail?.type === 'GUARDIAN_APPROVAL_DECIDED') refreshDecision();
    };
    window.addEventListener('satark-live-event', onLive);
    return () => window.removeEventListener('satark-live-event', onLive);
  }, [refreshDecision]);

  const startPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!vpa.trim() || !amt || amt <= 0) {
      showToast({ type: 'warning', title: 'Missing details', message: 'Enter a UPI ID and an amount.' });
      return;
    }
    setBusy(true);
    try {
      const res = await satarkSafetySdk.preTransactionCheck({ payeeVpa: vpa.trim(), payeeName: name.trim() || undefined, amount: amt, note: note.trim() || undefined, callState });
      setDecision(res);
      setStage('DECISION');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Safety check failed', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const finish = async (complete: boolean) => {
    if (!decision) return;
    setBusy(true);
    try {
      const res = complete ? await satarkSafetySdk.complete(decision.simulation_id) : await satarkSafetySdk.cancel(decision.simulation_id);
      setDoneMessage(res.message);
      setStage('DONE');
      loadLedger();
    } catch (err: any) {
      showToast({ type: 'error', title: complete ? 'Payment blocked' : 'Cancel failed', message: err.message });
      refreshDecision();
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStage('ENTER');
    setDecision(null);
    setVpa('');
    setName('');
    setAmount('');
    setNote('');
    setCallState('NONE');
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 flex justify-center">
        {/* Phone frame */}
        <div className="w-full max-w-[380px] rounded-[2.2rem] border-[10px] border-[#0E1E27] bg-white shadow-2xl overflow-hidden" aria-label="Mock UPI app">
          <div className="bg-[#142A36] text-white px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-sm flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" /> Satark Demo UPI
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">MOCK APP</span>
          </div>
          <p className="text-[10px] bg-amber-50 text-amber-950 px-3 py-1.5 border-b border-amber-200">
            Not PhonePe, Google Pay, Paytm, BHIM or a bank app. No real money moves.
          </p>

          <div className="p-4 min-h-[520px]">
            {stage === 'ENTER' && (
              <form onSubmit={startPayment} className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FILLS.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => {
                        setVpa(q.vpa);
                        setName(q.name);
                        setAmount(q.amount);
                        setNote(q.note);
                        setCallState(q.call);
                      }}
                      className="text-[11px] px-2 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <label className="block text-xs font-semibold text-slate-800">
                  Pay to (UPI ID)
                  <input value={vpa} onChange={(e) => setVpa(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 font-mono text-sm" placeholder="name@bank" />
                </label>
                <label className="block text-xs font-semibold text-slate-800">
                  Payee name (optional)
                  <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm" />
                </label>
                <label className="block text-xs font-semibold text-slate-800">
                  Amount (₹)
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" step="any" className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-lg font-bold font-mono" />
                </label>
                <label className="block text-xs font-semibold text-slate-800">
                  Note (optional)
                  <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-300 text-sm" />
                </label>
                <label className="flex items-start gap-2 text-[11px] p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={callState === 'DEMO_SIMULATED_ACTIVE_CALL'}
                    onChange={(e) => setCallState(e.target.checked ? 'DEMO_SIMULATED_ACTIVE_CALL' : 'NONE')}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Demo: simulate an active-call signal.</strong> A real app cannot see calls in other apps; this switch only stands in for an OS signal the host app might be allowed to read.
                  </span>
                </label>
                <button type="submit" disabled={busy} className="w-full min-h-[48px] rounded-xl bg-[#176B58] hover:bg-[#135948] text-white font-bold text-sm cursor-pointer disabled:opacity-50">
                  {busy ? 'Running Satark safety check…' : 'Proceed to pay'}
                </button>
              </form>
            )}

            {stage === 'DECISION' && decision && (
              <div className="space-y-3">
                <button type="button" onClick={reset} className="text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <div className="text-center">
                  <p className="text-xs text-slate-600">Paying {name || vpa}</p>
                  <p className="text-2xl font-bold font-mono">₹{parseFloat(amount).toLocaleString('en-IN')}</p>
                </div>
                <div className={`p-3 rounded-xl border-2 text-sm ${DECISION_STYLE[decision.decision]}`} role="status">
                  <p className="font-bold flex items-center gap-1.5">
                    {decision.decision === 'ALLOW' ? <ShieldCheck className="w-4 h-4" /> : decision.decision === 'BLOCK_RECOMMENDED' ? <AlertOctagon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    Satark: {decision.decision.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs mt-1">{decision.user_message}</p>
                </div>

                {decision.decision === 'CHECKIN_REQUIRED' && (
                  <SafetyCheckIn simulationId={decision.simulation_id} initialLanguage={toCheckinLanguage(language)} onCompleted={() => refreshDecision()} />
                )}

                {(decision.decision === 'GUARDIAN_APPROVAL_REQUIRED' || decision.decision === 'BLOCK_RECOMMENDED') && (
                  <GuardianApprovalPanel simulationId={decision.simulation_id} eligibleGuardianCount={eligibleGuardians} />
                )}

                {decision.decision === 'BLOCK_RECOMMENDED' && (
                  <a href="tel:1930" className="w-full min-h-[44px] rounded-xl bg-[#142A36] text-white text-sm font-bold flex items-center justify-center gap-2">
                    <PhoneCall className="w-4 h-4" /> Call 1930
                  </a>
                )}

                <div className="flex gap-2 pt-1">
                  {decision.can_complete && (
                    <button type="button" disabled={busy} onClick={() => finish(true)} className="flex-1 min-h-[48px] rounded-xl bg-[#176B58] text-white text-sm font-bold cursor-pointer disabled:opacity-50">
                      Confirm mock payment
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => finish(false)} className="flex-1 min-h-[48px] rounded-xl border-2 border-slate-400 bg-white text-sm font-bold cursor-pointer disabled:opacity-50">
                    Cancel payment
                  </button>
                </div>
                <button type="button" onClick={refreshDecision} className="w-full text-[11px] underline text-slate-700 cursor-pointer">
                  Refresh SDK decision
                </button>
              </div>
            )}

            {stage === 'DONE' && (
              <div className="text-center space-y-3 pt-10">
                {doneMessage.toLowerCase().includes('cancel') ? (
                  <XCircle className="w-14 h-14 mx-auto text-slate-500" />
                ) : (
                  <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-600" />
                )}
                <p className="text-sm font-bold">{doneMessage}</p>
                <button type="button" onClick={reset} className="min-h-[44px] px-5 rounded-xl bg-[#142A36] text-white text-sm font-bold cursor-pointer">
                  New payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 text-xs text-slate-700">
          <h2 className="text-sm font-bold text-slate-900">What this demonstrates</h2>
          <p>
            The phone on the left is a <strong>mock</strong> payment app. Before showing a confirm button it calls the
            <code className="mx-1 px-1 rounded bg-slate-100">satarkSafetySdk</code> boundary
            (<code className="px-1 rounded bg-slate-100">POST /api/sdk/v1/pre-transaction-check</code>), which returns ALLOW, CHECKIN_REQUIRED,
            GUARDIAN_APPROVAL_REQUIRED or BLOCK_RECOMMENDED. Completion is refused by the backend unless the decision allows it.
          </p>
          <p>Completed mock payments are added to the demo ledger, so spending-baseline and rapid-payment signals react to what you do here.</p>
          {decision?.integration_notice && <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2">{decision.integration_notice}</p>}
        </section>

        {decision && decision.risk_signals.length > 0 && stage === 'DECISION' && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
            <h2 className="text-sm font-bold text-slate-900">
              SDK risk signals (score {decision.risk_score}/100, tier {decision.policy_tier})
            </h2>
            <RiskSignalList signals={decision.risk_signals} />
          </section>
        )}

        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-2">Mock ledger (demo history)</h2>
          {ledger.length === 0 ? (
            <p className="text-xs text-slate-500">No mock transactions yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-xs max-h-72 overflow-y-auto">
              {ledger.map((t) => (
                <li key={t.id} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="font-mono truncate">{t.payee_vpa}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {t.is_seed_data && <span className="text-[10px] px-1 rounded bg-slate-100 text-slate-600">seed</span>}
                    <span className={t.status === 'COMPLETED' ? 'text-slate-900' : 'text-slate-500 line-through'}>₹{t.amount.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
