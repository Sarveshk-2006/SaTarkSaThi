import React, { useCallback, useEffect, useState } from 'react';
import { Time, Renew, CheckmarkFilled, MisuseOutline, UserMultiple } from '@carbon/icons-react';
import { Tag } from '@carbon/react';
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
    <ul className="space-y-2" aria-label="Contributing risk signals">
      {sorted.map((s, i) => (
        <li
          key={`${s.code}-${i}`}
          className={`text-xs p-3 border ${
            s.points > 0 ? 'bg-[#fff1f1] border-[#ffb3b8] text-[#da1e28]' : 'bg-[#f4f4f4] border-[#e0e0e0] text-[#161616]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="font-semibold text-[#161616]">{s.label}</span>
            <div className="flex items-center gap-1.5">
              <Tag
                type={s.source === 'DEMO_SIMULATED_DEVICE_SIGNAL' ? 'purple' : 'gray'}
                size="sm"
              >
                {SOURCE_LABELS[s.source] || s.source}
              </Tag>
              <span className="font-mono font-bold text-[#da1e28]">+{s.points}</span>
            </div>
          </div>
          <p className="mt-1 leading-relaxed text-[#525252]">{s.explanation}</p>
        </li>
      ))}
    </ul>
  );
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'border-l-4 border-l-[#f1c21b] bg-[#fdf3e1] text-[#b28600]',
  APPROVED: 'border-l-4 border-l-[#198038] bg-[#defbe6] text-[#198038]',
  DECLINED: 'border-l-4 border-l-[#da1e28] bg-[#fff1f1] text-[#da1e28]',
  EXPIRED: 'border-l-4 border-l-[#8d8d8d] bg-[#f4f4f4] text-[#525252]',
  CANCELLED: 'border-l-4 border-l-[#8d8d8d] bg-[#f4f4f4] text-[#525252]',
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
          <p className="text-xs text-[#525252]">The previous guardian request expired without a decision.</p>
        )}
        <button
          type="button"
          onClick={request}
          disabled={busy || eligibleGuardianCount === 0}
          className="cds--btn cds--btn--secondary w-full inline-flex items-center justify-center gap-2"
        >
          <UserMultiple size={16} />
          {busy ? 'Sending request…' : 'Ask a guardian to approve this payment'}
        </button>
        {eligibleGuardianCount === 0 && (
          <p className="text-[11px] text-[#8d8d8d]">
            No eligible guardian yet: a guardian must be active, consented by you, and must have accepted your invitation.
          </p>
        )}
        {error && <p className="text-[11px] text-[#da1e28]">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`p-3 text-xs space-y-1.5 ${STATUS_STYLE[approval.status]}`} role="status">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold flex items-center gap-1.5">
          {approval.status === 'APPROVED' ? (
            <CheckmarkFilled size={16} />
          ) : approval.status === 'DECLINED' ? (
            <MisuseOutline size={16} />
          ) : (
            <Time size={16} />
          )}
          Guardian approval {approval.request_ref}: {approval.status}
        </span>
        <button
          type="button"
          onClick={refresh}
          className="p-1 hover:bg-black/5 cursor-pointer"
          aria-label="Refresh approval status"
        >
          <Renew size={14} />
        </button>
      </div>
      {approval.status === 'PENDING' && (
        <p>Waiting for an accepted guardian. Expires {new Date(approval.expires_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}.</p>
      )}
      {approval.decision_note && <p>Guardian note: &ldquo;{approval.decision_note}&rdquo;</p>}
    </div>
  );
};
