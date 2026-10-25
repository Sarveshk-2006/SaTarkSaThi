import React, { useCallback, useEffect, useState } from 'react';
import { Check, Clock, Inbox, KeyRound, ShieldAlert, X } from 'lucide-react';
import { api } from '../../api/endpoints';
import { ContactInvitation, GuardianApproval } from '../../api/types';
import { useToast } from '../../context/ToastContext';

const REASON_TEXT: Record<string, string> = {
  AUTHORITY_CLAIM: 'Requester claims to be an official',
  SECRECY_DEMAND: 'Told to keep the payment secret',
  GUARANTEED_RETURNS: 'Guaranteed returns promised',
  URGENT_PRESSURE: 'Urgent pressure or threats',
  ACTIVE_CALL: 'Paying during an active call',
  INSTITUTIONAL_KEYWORD_VPA: 'Official-sounding UPI ID',
  PRIVATE_HANDLE_FOR_OFFICIAL_PAYMENT: 'Official payment to a personal UPI handle',
  PURPOSE_RISK_TERMS: 'Purpose matches scam scripts',
  NEW_PAYEE: 'First payment to this payee',
  REPEAT_PAYMENT_TO_RECENT_PAYEE: 'Repeated payment to a recent payee',
  AMOUNT_DEVIATION: 'Unusually large amount for them',
  RAPID_VELOCITY: 'Several payments in a short time',
  HIGH_VALUE: 'High-value transfer',
  ACTIVE_CALL_REPORTED: 'Someone is on a call with them',
  AUTHORITY_REQUEST: 'Request from someone claiming to be an official',
  UNSOLICITED_REQUEST: 'Request from someone who contacted them',
  ONLINE_GROUP_REQUEST: 'Request from an online investment/task group',
  SECRECY_REPORTED: 'Asked to keep it secret',
  THREAT_REPORTED: 'Threatened with a penalty or deadline',
  REMOTE_ACCESS_REQUEST: 'Asked to install an app, share screen or reveal OTP/PIN',
  GUARANTEED_RETURNS_REPORTED: 'Promised guaranteed profits',
  NOT_INDEPENDENTLY_VERIFIED: 'Not verified through a known number',
  POSSIBLE_COACHING: 'Someone may be guiding their answers',
  ANSWERS_CONTRADICT_SIGNALS: 'Answers contradict earlier details',
  FREE_TEXT_RISK_TERMS: 'Their description mentions scam terms',
  PAYMENT_DETAILS_HIGH_RISK: 'Payment details match scam patterns',
};

export const GuardianInbox: React.FC = () => {
  const { showToast } = useToast();
  const [invitations, setInvitations] = useState<ContactInvitation[]>([]);
  const [approvals, setApprovals] = useState<GuardianApproval[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [inv, appr] = await Promise.all([api.getMyInvitations(), api.getGuardianApprovals()]);
      setInvitations(inv);
      setApprovals(appr.filter((a) => a.viewer_role === 'GUARDIAN'));
    } catch {
      // Non-fatal: the rest of Family Shield still works.
    }
  }, []);

  useEffect(() => {
    load();
    const onLive = () => load();
    window.addEventListener('satark-live-event', onLive);
    return () => window.removeEventListener('satark-live-event', onLive);
  }, [load]);

  const respondInvite = async (contactId: number, decision: 'ACCEPT' | 'DECLINE') => {
    try {
      await api.respondToInvitation(contactId, decision);
      showToast({ type: 'success', title: decision === 'ACCEPT' ? 'Invitation accepted' : 'Invitation declined', message: 'Your choice was recorded.' });
      load();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Could not respond', message: err.message });
    }
  };

  const decide = async (ref: string, decision: 'APPROVE' | 'DECLINE') => {
    try {
      await api.decideGuardianApproval(ref, decision, notes[ref]);
      showToast({ type: decision === 'APPROVE' ? 'success' : 'warning', title: `Payment ${decision === 'APPROVE' ? 'approved' : 'declined'}`, message: ref });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Decision failed', message: err.message });
    } finally {
      load();
    }
  };

  const respondWithCode = async (decision: 'ACCEPT' | 'DECLINE') => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const res = await api.respondWithInviteCode(code.trim(), decision);
      showToast({ type: 'success', title: 'Invitation answered', message: `${res.owner_name}'s invitation is now ${res.contact_consent_status}.` });
      setCode('');
    } catch (err: any) {
      showToast({ type: 'error', title: 'Code not accepted', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const pending = approvals.filter((a) => a.status === 'PENDING');
  const decided = approvals.filter((a) => a.status !== 'PENDING').slice(0, 3);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4" aria-labelledby="guardian-inbox-title">
      <div className="flex items-center gap-2">
        <Inbox className="w-5 h-5 text-[#176B58]" />
        <h2 id="guardian-inbox-title" className="text-sm font-bold text-slate-900">
          Your guardian inbox
        </h2>
        {pending.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">{pending.length} waiting</span>
        )}
      </div>

      {pending.length === 0 && invitations.length === 0 && (
        <p className="text-xs text-slate-500">No invitations or payment approvals for you right now.</p>
      )}

      {pending.map((a) => (
        <div key={a.request_ref} className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-bold text-amber-950">
              {a.requester_name} wants to pay ₹{a.amount.toLocaleString('en-IN')} to <span className="font-mono">{a.payee}</span>
            </p>
            <span className="text-[11px] text-amber-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> expires {new Date(a.expires_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {a.guardian_guidance && (
            <p className="text-xs font-bold text-red-900 bg-red-100 border border-red-300 rounded-lg p-2 flex items-start gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {a.guardian_guidance}
            </p>
          )}
          {a.reason_codes.length > 0 && (
            <ul className="text-xs text-amber-950 list-disc pl-5">
              {a.reason_codes.map((c) => (
                <li key={c}>{REASON_TEXT[c] || c}</li>
              ))}
            </ul>
          )}
          <label className="block text-[11px] text-amber-900">
            Note to {a.requester_name} (optional)
            <input
              value={notes[a.request_ref] || ''}
              maxLength={280}
              onChange={(e) => setNotes({ ...notes, [a.request_ref]: e.target.value })}
              className="mt-1 w-full p-2 text-xs rounded-lg border border-amber-300 bg-white"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => decide(a.request_ref, 'APPROVE')}
              className="flex-1 min-h-[44px] rounded-xl bg-[#176B58] hover:bg-[#135948] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Approve after calling them
            </button>
            <button
              type="button"
              onClick={() => decide(a.request_ref, 'DECLINE')}
              className="flex-1 min-h-[44px] rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" /> Decline
            </button>
          </div>
        </div>
      ))}

      {decided.length > 0 && (
        <ul className="text-[11px] text-slate-600 space-y-1">
          {decided.map((a) => (
            <li key={a.request_ref}>
              {a.request_ref}: ₹{a.amount.toLocaleString('en-IN')} to {a.payee} — <strong>{a.status}</strong>
            </li>
          ))}
        </ul>
      )}

      {invitations.map((inv) => (
        <div key={inv.contact_id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-800">
            <strong>{inv.owner_name}</strong> added you as their <strong>{inv.relationship}</strong> guardian.{' '}
            <span className="font-semibold">Status: {inv.contact_consent_status}</span>
          </p>
          <div className="flex gap-2">
            {inv.contact_consent_status !== 'ACCEPTED' && (
              <button
                type="button"
                onClick={() => respondInvite(inv.contact_id, 'ACCEPT')}
                className="min-h-[40px] px-3 rounded-lg bg-[#176B58] text-white text-xs font-bold cursor-pointer"
              >
                Accept
              </button>
            )}
            {inv.contact_consent_status !== 'DECLINED' && (
              <button
                type="button"
                onClick={() => respondInvite(inv.contact_id, 'DECLINE')}
                className="min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold cursor-pointer"
              >
                {inv.contact_consent_status === 'ACCEPTED' ? 'Withdraw' : 'Decline'}
              </button>
            )}
          </div>
        </div>
      ))}

      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-slate-700">
          <KeyRound className="w-3.5 h-3.5 inline mr-1" /> Have an invitation code? (for guardians without an account)
        </summary>
        <div className="mt-2 flex flex-wrap gap-2">
          <label htmlFor="invite-code" className="sr-only">Invitation code</label>
          <input
            id="invite-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. 7KQ2M9XWPA"
            className="flex-1 min-w-[160px] p-2 rounded-lg border border-slate-300 font-mono"
          />
          <button type="button" disabled={busy} onClick={() => respondWithCode('ACCEPT')} className="min-h-[40px] px-3 rounded-lg bg-[#176B58] text-white font-bold cursor-pointer disabled:opacity-50">
            Accept
          </button>
          <button type="button" disabled={busy} onClick={() => respondWithCode('DECLINE')} className="min-h-[40px] px-3 rounded-lg border border-slate-300 bg-white font-semibold cursor-pointer disabled:opacity-50">
            Decline
          </button>
        </div>
      </details>
    </section>
  );
};
