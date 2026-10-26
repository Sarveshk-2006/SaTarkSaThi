import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckmarkFilled,
  MisuseOutline,
  Time,
  Phone,
  Security,
  WarningAlt,
  CloseOutline,
} from '@carbon/icons-react';
import { Tile, Button, Tag, TextInput } from '@carbon/react';
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
  ALLOW: 'border-l-4 border-l-[#198038] bg-[#defbe6] text-[#198038]',
  CHECKIN_REQUIRED: 'border-l-4 border-l-[#f1c21b] bg-[#fdf3e1] text-[#b28600]',
  GUARDIAN_APPROVAL_REQUIRED: 'border-l-4 border-l-[#f1c21b] bg-[#fdf3e1] text-[#b28600]',
  BLOCK_RECOMMENDED: 'border-l-4 border-l-[#da1e28] bg-[#fff1f1] text-[#da1e28]',
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
        <div className="w-full max-w-[380px] border-4 border-[#393939] bg-white shadow-2xl overflow-hidden" aria-label="Mock UPI app">
          <div className="bg-[#161616] text-white px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-xs flex items-center gap-1.5">
              <Security size={16} className="text-[#0f62fe]" /> Satark Safety SDK &bull; Host App
            </span>
            <Tag type="warm-gray" size="sm">MOCK UPI</Tag>
          </div>
          <p className="text-[10px] bg-[#fdf3e1] text-[#b28600] px-3 py-1.5 border-b border-[#f1c21b]">
            Simulation boundary. Zero external bank connections or real currency movements.
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
                      className="text-[11px] px-2 py-1 border border-[#e0e0e0] bg-[#f4f4f4] hover:bg-[#e8e8e8] cursor-pointer"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
                <div>
                  <TextInput
                    id="mock-vpa"
                    labelText="Pay to (UPI ID) *"
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value)}
                    placeholder="name@bank"
                  />
                </div>
                <div>
                  <TextInput
                    id="mock-name"
                    labelText="Payee name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <TextInput
                    id="mock-amount"
                    labelText="Amount (INR) *"
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <TextInput
                    id="mock-note"
                    labelText="Transaction purpose note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <label className="flex items-start gap-2 text-[11px] p-2 bg-[#edf5ff] border border-[#a6c8ff] text-[#0043ce] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={callState === 'DEMO_SIMULATED_ACTIVE_CALL'}
                    onChange={(e) => setCallState(e.target.checked ? 'DEMO_SIMULATED_ACTIVE_CALL' : 'NONE')}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Simulate active-call telemetry signal.</strong> Stand-in for OS audio focus / call state permission granted to host app.
                  </span>
                </label>
                <Button
                  type="submit"
                  kind="primary"
                  size="md"
                  className="w-full"
                  disabled={busy}
                >
                  {busy ? 'Running Satark safety check…' : 'Proceed to Pay'}
                </Button>
              </form>
            )}

            {stage === 'DECISION' && decision && (
              <div className="space-y-3">
                <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={ArrowLeft}
                  onClick={reset}
                >
                  Back
                </Button>
                <div className="text-center">
                  <p className="text-xs text-[#525252]">Paying {name || vpa}</p>
                  <p className="text-2xl font-bold font-mono text-[#161616]">₹{parseFloat(amount).toLocaleString('en-IN')}</p>
                </div>
                <div className={`p-3 text-xs ${DECISION_STYLE[decision.decision]}`} role="status">
                  <p className="font-semibold flex items-center gap-1.5">
                    {decision.decision === 'ALLOW' ? <CheckmarkFilled size={16} /> : decision.decision === 'BLOCK_RECOMMENDED' ? <MisuseOutline size={16} /> : <Time size={16} />}
                    Satark Decision: {decision.decision.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs mt-1 text-[#161616]">{decision.user_message}</p>
                </div>

                {decision.decision === 'CHECKIN_REQUIRED' && (
                  <SafetyCheckIn simulationId={decision.simulation_id} initialLanguage={toCheckinLanguage(language)} onCompleted={() => refreshDecision()} />
                )}

                {(decision.decision === 'GUARDIAN_APPROVAL_REQUIRED' || decision.decision === 'BLOCK_RECOMMENDED') && (
                  <GuardianApprovalPanel simulationId={decision.simulation_id} eligibleGuardianCount={eligibleGuardians} />
                )}

                {decision.decision === 'BLOCK_RECOMMENDED' && (
                  <a href="tel:1930" className="cds--btn cds--btn--danger w-full inline-flex items-center justify-center gap-2">
                    <Phone size={16} /> Call 1930 Cyber Fraud Helpline
                  </a>
                )}

                <div className="flex gap-2 pt-1">
                  {decision.can_complete && (
                    <Button
                      kind="primary"
                      size="md"
                      disabled={busy}
                      onClick={() => finish(true)}
                      className="flex-1"
                    >
                      Confirm Mock Payment
                    </Button>
                  )}
                  <Button
                    kind="secondary"
                    size="md"
                    disabled={busy}
                    onClick={() => finish(false)}
                    className="flex-1"
                  >
                    Cancel Payment
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={refreshDecision}
                  className="w-full text-[11px] underline text-[#0f62fe] cursor-pointer text-center"
                >
                  Refresh SDK decision
                </button>
              </div>
            )}

            {stage === 'DONE' && (
              <div className="text-center space-y-4 pt-10">
                {doneMessage.toLowerCase().includes('cancel') ? (
                  <CloseOutline size={48} className="mx-auto text-[#525252]" />
                ) : (
                  <CheckmarkFilled size={48} className="mx-auto text-[#198038]" />
                )}
                <p className="text-sm font-semibold text-[#161616]">{doneMessage}</p>
                <Button kind="primary" size="md" onClick={reset}>
                  New Payment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <Tile className="p-5 space-y-2 text-xs text-[#525252]">
          <h2 className="text-sm font-semibold text-[#161616]">Host App SDK Integration Architecture</h2>
          <p>
            The device view on the left demonstrates a <strong>mock</strong> client payment application. Before presenting the biometric PIN or transaction confirmation screen, the host app calls the
            <code className="mx-1 px-1 bg-[#f4f4f4] text-[#161616]">satarkSafetySdk</code> boundary
            (<code className="px-1 bg-[#f4f4f4] text-[#161616]">POST /api/sdk/v1/pre-transaction-check</code>).
          </p>
          <p>The backend returns policy evaluations (ALLOW, CHECKIN_REQUIRED, GUARDIAN_APPROVAL_REQUIRED, or BLOCK_RECOMMENDED). Payment execution is refused unless the decision allows it.</p>
          {decision?.integration_notice && (
            <div className="p-3 bg-[#fdf3e1] border-l-4 border-l-[#f1c21b] text-xs text-[#161616] mt-2">
              {decision.integration_notice}
            </div>
          )}
        </Tile>

        {decision && decision.risk_signals.length > 0 && stage === 'DECISION' && (
          <Tile className="p-5 space-y-2">
            <h2 className="text-sm font-semibold text-[#161616]">
              SDK Risk Signals (Score {decision.risk_score}/100, Tier {decision.policy_tier})
            </h2>
            <RiskSignalList signals={decision.risk_signals} />
          </Tile>
        )}

        <Tile className="p-5">
          <h2 className="text-sm font-semibold text-[#161616] mb-3">Mock Ledger (Transactional History)</h2>
          {ledger.length === 0 ? (
            <p className="text-xs text-[#525252]">No mock transactions recorded yet.</p>
          ) : (
            <ul className="divide-y divide-[#e0e0e0] text-xs max-h-72 overflow-y-auto">
              {ledger.map((t) => (
                <li key={t.id} className="py-2 flex items-center justify-between gap-2">
                  <span className="font-mono truncate text-[#161616]">{t.payee_vpa}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {t.is_seed_data && <Tag type="warm-gray" size="sm">seed</Tag>}
                    <span className={t.status === 'COMPLETED' ? 'font-semibold text-[#161616]' : 'text-[#8d8d8d] line-through'}>
                      ₹{t.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-[#525252]">{new Date(t.created_at).toLocaleDateString('en-IN')}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tile>
      </div>
    </div>
  );
};
