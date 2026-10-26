import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, ChevronDown, ExternalLink, Loader2, Mail, ShieldAlert, Siren } from 'lucide-react';
import { GoldenHourAction, GoldenHourResponse } from '../../api/types';

const ICONS: Record<string, React.ReactNode> = {
  CYBERCRIME_CELL: <Mail className="w-5 h-5" />,
  BANK_LIEN: <Building2 className="w-5 h-5" />,
  CYBER_POLICE: <Siren className="w-5 h-5" />,
};

const STEP_DELAY_MS = 900;

const ActionCard: React.FC<{ action: GoldenHourAction; done: boolean; index: number }> = ({ action, done, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <li className={`rounded-2xl border-2 p-4 transition-colors ${done ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <span className={`p-2 rounded-xl shrink-0 ${done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {ICONS[action.key] || <ShieldAlert className="w-5 h-5" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-900">
              {index + 1}. {action.title}
            </p>
            {done ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4" /> Done
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Sending…
              </span>
            )}
          </div>

          {done && (
            <div className="mt-2 space-y-2 text-xs text-slate-700">
              <p>
                <span className="font-semibold">To:</span> {action.recipient}
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">Reference:</span>
                <span className="font-mono px-2 py-0.5 rounded bg-white border border-emerald-300">{action.reference}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-300 text-slate-950">Demo simulation</span>
              </p>

              <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="inline-flex items-center gap-1 font-semibold text-[#176B58] underline cursor-pointer"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                {open ? 'Hide message' : 'View message that was prepared'}
              </button>
              {open && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="font-semibold text-slate-900">Subject: {action.subject}</p>
                  <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-slate-700">{action.body}</pre>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200">
                <span className="text-[11px] text-slate-800">
                  <strong>Real step:</strong> {action.real_next_step}
                </span>
                <a
                  href={action.real_action_url}
                  target={action.real_action_url.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#142A36] text-white text-[11px] font-bold"
                >
                  {action.real_action_label}
                  {action.real_action_url.startsWith('http') && <ExternalLink className="w-3 h-3" />}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

/** Shows the one-tap response, revealing each dispatch in sequence. */
export const GoldenHourResponsePanel: React.FC<{ response: GoldenHourResponse }> = ({ response }) => {
  const [revealed, setRevealed] = useState(response.already_activated ? response.actions.length : 0);

  useEffect(() => {
    if (revealed >= response.actions.length) return;
    const t = setTimeout(() => setRevealed((n) => n + 1), STEP_DELAY_MS);
    return () => clearTimeout(t);
  }, [revealed, response.actions.length]);

  const allDone = revealed >= response.actions.length;

  return (
    <section className="mx-6 mt-6 rounded-2xl border-2 border-[#176B58] bg-[#F3F8F5] p-5 space-y-4" aria-live="polite" aria-labelledby="gh-response-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="gh-response-title" className="text-base font-bold text-slate-900">
            {allDone ? 'Golden Hour response activated' : 'Activating Golden Hour response…'}
          </h3>
          <p className="text-xs text-slate-600">
            Case {response.incident_reference || `draft #${response.draft_id}`} &bull;{' '}
            {new Date(response.activated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-300 text-slate-950">
          Demo simulation
        </span>
      </div>

      <ol className="space-y-3">
        {response.actions.map((a, i) => (
          <ActionCard key={a.key} action={a} index={i} done={i < revealed} />
        ))}
      </ol>

      <p className="text-[11px] font-semibold text-amber-950 bg-amber-100 border border-amber-300 rounded-xl p-3">
        {response.simulation_notice}
      </p>
    </section>
  );
};
