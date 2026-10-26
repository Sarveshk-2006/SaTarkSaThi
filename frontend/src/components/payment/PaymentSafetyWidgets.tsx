import React, { useCallback, useEffect, useState } from 'react';
import { Clock, RefreshCw, ShieldCheck, ShieldX, Users } from 'lucide-react';
import { api } from '../../api/endpoints';
import { GuardianApproval, RiskSignal } from '../../api/types';

const SOURCE_LABELS: Record<string, string> = {
  USER_REPORTED: 'You reported',
  RECIPIENT_PATTERN: 'Recipient pattern',
  TRANSACTION_HISTORY: 'Your transaction history',
  AMOUNT_CONTEXT: 'Amount',
  DEMO_SIMULATED_DEVICE_SIGNAL: 'Demo-simulated signal',
  PAYMENT_PURPOSE_TEXT: 'Payment purpose',
};

export const RiskSignalList: React.FC<{ signals: RiskSignal[] }> = ({ signals }) => {
  if (!signals.length) return null;
  const sorted = [...signals].sort((a, b) => b.points - a.points);
  return (
    <ul className="space-y-1.5" aria-label="Contributing risk signals">
      {sorted.map((s, i) => (
        <li
          key={`${s.code}-${i}`}
          className={`text-xs p-2.5 rounded-xl border ${
            s.points > 0 ? 'bg-red-50/80 border-red-200 text-red-950' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-bold">{s.label}</span>
            <span className="flex items-center gap-1.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                  s.source === 'DEMO_SIMULATED_DEVICE_SIGNAL'
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {SOURCE_LABELS[s.source] || s.source}
              </span>
              <span className="font-mono font-bold">+{s.points}</span>
            </span>
          </div>
          <p className="mt-1 leading-relaxed">{s.explanation}</p>
        </li>
      ))}
    </ul>
  );
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-50 border-amber-300 text-amber-950',
  APPROVED: 'bg-emerald-50 border-emerald-300 text-emerald-950',
  DECLINED: 'bg-red-50 border-red-300 text-red-950',
  EXPIRED: 'bg-slate-50 border-slate-300 text-slate-800',
  CANCELLED: 'bg-slate-50 border-slate-300 text-slate-800',
};

/** Requester-side view of a guardian approval for one payment check. */
export const GuardianApprovalPanel: React.FC<{ simulationId: string; eligibleGuardianCount: number }> = ({
  simulationId,
  eligibleGuardianCount,
}) => {
  const [approval, setApproval] = useState<GuardianApproval | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setApproval(await api.getGuardianApprovalStatus(simulationId));
    } catch {
      setApproval(null);
    }
  }, [simulationId]);

  useEffect(() => {
    setError(null);
    refresh();
    const onLive = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type?.startsWith('GUARDIAN_APPROVAL')) refresh();
    };
    window.addEventListener('satark-live-event', onLive);
    return () => window.removeEventListener('satark-live-event', onLive);
  }, [refresh]);

  const request = async () => {
    setBusy(true);
    setError(null);
    try {
      setApproval(await api.requestGuardianApproval(simulationId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!approval || approval.status === 'EXPIRED') {
    return (
      <div className="space-y-2">
        {approval?.status === 'EXPIRED' && (
          <p className="text-xs text-slate-700">The previous guardian request expired without a decision.</p>
        )}
        <button
          type="button"
          onClick={request}
          disabled={busy || eligibleGuardianCount === 0}
          className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#142A36] hover:bg-[#1E334E] text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Users className="w-4 h-4" />
          {busy ? 'Sending request…' : 'Ask a guardian to approve this payment'}
        </button>
        {eligibleGuardianCount === 0 && (
          <p className="text-[11px] text-[#64748B]">
            No eligible guardian yet: a guardian must be active, consented by you, and must have accepted your invitation.
          </p>
        )}
        {error && <p className="text-[11px] text-red-700">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${STATUS_STYLE[approval.status]}`} role="status">
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold flex items-center gap-1.5">
          {approval.status === 'APPROVED' ? (
            <ShieldCheck className="w-4 h-4" />
          ) : approval.status === 'DECLINED' ? (
            <ShieldX className="w-4 h-4" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          Guardian approval {approval.request_ref}: {approval.status}
        </span>
        <button type="button" onClick={refresh} className="p-1 rounded hover:bg-black/5 cursor-pointer" aria-label="Refresh approval status">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      {approval.status === 'PENDING' && (
        <p>Waiting for an accepted guardian. Expires {new Date(approval.expires_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.</p>
      )}
      {approval.decision_note && <p>Guardian note: “{approval.decision_note}”</p>}
    </div>
  );
};
