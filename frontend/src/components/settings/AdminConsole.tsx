import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, MessageCircle, RefreshCw, ScrollText, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { api } from '../../api/endpoints';
import { AdminAuditEvent, AdminUser, MyAccess, ProviderVerifyResult } from '../../api/types';
import { useToast } from '../../context/ToastContext';

const VERIFY_BADGE: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  NOT_CONFIGURED: 'bg-slate-100 text-slate-800 border-slate-300',
};

const card = 'bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3';
const heading = 'flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3';
const btn =
  'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer';

const VerifyRow: React.FC<{ label: string; run: () => Promise<ProviderVerifyResult> }> = ({ label, run }) => {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProviderVerifyResult | null>(null);
  const go = async () => {
    setBusy(true);
    try {
      setResult(await run());
    } catch (e: any) {
      setResult({ status: 'FAILED', detail: e.message || 'Request failed' });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <button type="button" onClick={go} disabled={busy} className={btn}>
        <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> Verify {label}
      </button>
      {result && (
        <>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${VERIFY_BADGE[result.status] || 'bg-amber-50 text-amber-900 border-amber-300'}`}>
            {result.status.replace(/_/g, ' ')}
          </span>
          <span className="text-slate-600">
            {result.detail}
            {typeof result.latency_ms === 'number' && result.latency_ms > 0 ? ` (${result.latency_ms} ms)` : ''}
          </span>
        </>
      )}
    </div>
  );
};

export const AdminConsole: React.FC = () => {
  const { showToast } = useToast();
  const [access, setAccess] = useState<MyAccess | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [events, setEvents] = useState<AdminAuditEvent[]>([]);
  const [form, setForm] = useState({ full_name: '', phone_number: '', passcode: '', access_role: 'OPERATOR' });
  const [waText, setWaText] = useState('');
  const [waReply, setWaReply] = useState('');

  const load = useCallback(async () => {
    try {
      const me = await api.getMyAccess();
      setAccess(me);
      if (me.is_operator) setEvents(await api.adminAuditEvents(30));
      if (me.is_admin) setUsers(await api.adminListUsers());
    } catch {
      setAccess(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!access) return null;

  const updateUser = async (id: number, data: { access_role?: string; is_active?: boolean }) => {
    try {
      await api.adminUpdateUser(id, data);
      showToast({ type: 'success', title: 'Account updated', message: 'Change recorded in the audit log.' });
      load();
    } catch (e: any) {
      showToast({ type: 'error', title: 'Update refused', message: e.message });
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.adminCreateUser(form);
      showToast({ type: 'success', title: 'Account created', message: `${form.full_name} can now sign in with their passcode.` });
      setForm({ full_name: '', phone_number: '', passcode: '', access_role: 'OPERATOR' });
      load();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Could not create account', message: err.message });
    }
  };

  const purge = async () => {
    try {
      const r = await api.adminRetentionPurge();
      showToast({ type: 'info', title: 'Retention purge complete', message: `${r.redacted_analyses} old scans redacted (policy: ${r.retention_days} days).` });
      load();
    } catch (e: any) {
      showToast({ type: 'error', title: 'Purge failed', message: e.message });
    }
  };

  const simulateWhatsApp = async () => {
    try {
      setWaReply((await api.whatsappSimulate(waText)).reply);
    } catch (e: any) {
      setWaReply(`Error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className={card}>
        <div className={heading}>
          <MessageCircle className="w-4 h-4 text-[#176B58]" />
          <span>WhatsApp bot preview (simulated — no message is sent)</span>
        </div>
        <textarea
          value={waText}
          onChange={(e) => setWaText(e.target.value)}
          rows={3}
          placeholder="Paste a message someone forwarded to the Satark WhatsApp number…"
          className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
        />
        <button type="button" disabled={waText.trim().length < 5} onClick={simulateWhatsApp} className={btn}>
          Preview bot reply
        </button>
        {waReply && <pre className="whitespace-pre-wrap text-xs bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-slate-800">{waReply}</pre>}
      </div>

      {access.is_operator && (
        <div className={card}>
          <div className={heading}>
            <ShieldCheck className="w-4 h-4 text-[#176B58]" />
            <span>Admin console</span>
            <span className="ml-auto px-1.5 py-0.5 rounded border text-[10px] font-bold bg-slate-100 border-slate-300">
              You: {access.access_role}
            </span>
          </div>

          {access.is_admin && (
            <>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Live provider verification (keys stay on the server)
              </h5>
              <VerifyRow label="IBM Bob" run={api.verifyBob} />
              <VerifyRow label="IBM watsonx.ai" run={api.verifyWatsonx} />

              <h5 className="pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Accounts &amp; roles
              </h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="py-1 pr-2">Name</th>
                      <th className="py-1 pr-2">Phone</th>
                      <th className="py-1 pr-2">Role</th>
                      <th className="py-1 pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-slate-100">
                        <td className="py-1.5 pr-2 font-semibold text-slate-900">{u.full_name}</td>
                        <td className="py-1.5 pr-2 text-slate-600">{u.phone_masked}</td>
                        <td className="py-1.5 pr-2">
                          <select
                            value={u.access_role}
                            disabled={u.is_bootstrap_admin}
                            onChange={(e) => updateUser(u.id, { access_role: e.target.value })}
                            className="text-xs border border-slate-300 rounded-lg px-1.5 py-1"
                          >
                            <option value="USER">USER</option>
                            <option value="OPERATOR">OPERATOR</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="py-1.5 pr-2">
                          <button
                            type="button"
                            disabled={u.is_bootstrap_admin || u.id <= 2}
                            onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                            className={`text-[11px] font-semibold ${u.is_active ? 'text-emerald-700' : 'text-rose-700'} disabled:opacity-60`}
                          >
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input required minLength={2} placeholder="Full name" value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="text-xs p-2 rounded-xl border border-slate-300" />
                <input required minLength={8} placeholder="Phone (+91 …)" value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  className="text-xs p-2 rounded-xl border border-slate-300" />
                <input required minLength={6} type="password" placeholder="Initial passcode (min 6)" value={form.passcode}
                  onChange={(e) => setForm({ ...form, passcode: e.target.value })}
                  className="text-xs p-2 rounded-xl border border-slate-300" />
                <select value={form.access_role} onChange={(e) => setForm({ ...form, access_role: e.target.value })}
                  className="text-xs p-2 rounded-xl border border-slate-300">
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="USER">USER</option>
                </select>
                <button type="submit" className={`${btn} sm:col-span-2 justify-center`}>
                  <UserPlus className="w-3.5 h-3.5" /> Create account
                </button>
              </form>

              <button type="button" onClick={purge} className={btn}>
                Run evidence retention purge
              </button>
            </>
          )}

          <h5 className="pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <ScrollText className="w-3.5 h-3.5" /> Recent audit events
          </h5>
          <ul className="max-h-56 overflow-y-auto space-y-1 text-[11px]">
            {events.length === 0 && <li className="text-slate-500">No audit events yet.</li>}
            {events.map((ev) => (
              <li key={ev.id} className="flex gap-2 border-b border-slate-100 py-1">
                <span className="font-mono text-slate-500 shrink-0">{ev.timestamp ? new Date(ev.timestamp).toLocaleString() : '—'}</span>
                <span className="font-bold text-slate-800 shrink-0">{ev.event_type}</span>
                <span className="text-slate-600 truncate">{ev.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
