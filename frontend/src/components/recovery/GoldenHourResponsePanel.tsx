import React, { useEffect, useState } from 'react';
import {
  Email,
  Enterprise,
  WarningAlt,
  CheckmarkFilled,
  ChevronDown,
  Launch,
  Renew,
} from '@carbon/icons-react';
import { Tag } from '@carbon/react';
import { GoldenHourAction, GoldenHourResponse } from '../../api/types';

const ICONS: Record<string, React.ReactNode> = {
  CYBERCRIME_CELL: <Email size={20} />,
  BANK_LIEN: <Enterprise size={20} />,
  CYBER_POLICE: <WarningAlt size={20} />,
};

const STEP_DELAY_MS = 900;

const ActionCard: React.FC<{ action: GoldenHourAction; done: boolean; index: number }> = ({ action, done, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <li className={`cds--tile p-4 transition-all ${done ? 'border-l-4 border-l-[#198038] bg-[#defbe6]' : 'border-l-4 border-l-[#8d8d8d] bg-white'}`}>
      <div className="flex items-start gap-3">
        <span className={`p-2 shrink-0 rounded ${done ? 'bg-[#198038] text-white' : 'bg-[#e0e0e0] text-[#525252]'}`}>
          {ICONS[action.key] || <WarningAlt size={20} />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#161616]">
              {index + 1}. {action.title}
            </p>
            {done ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#198038]">
                <CheckmarkFilled size={16} /> Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-[#525252]">
                <Renew size={16} className="animate-spin" /> Transmitting…
              </span>
            )}
          </div>

          {done && (
            <div className="mt-2 space-y-2 text-xs text-[#525252]">
              <p>
                <span className="font-semibold text-[#161616]">Recipient Desk:</span> {action.recipient}
              </p>
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#161616]">Reference Token:</span>
                <span className="font-mono px-2 py-0.5 bg-white border border-[#c6c6c6] text-[#161616]">{action.reference}</span>
                <Tag type="warm-gray" size="sm">Demo Simulation</Tag>
              </p>

              <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="inline-flex items-center gap-1 font-semibold text-[#0f62fe] hover:underline cursor-pointer pt-1"
              >
                <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                {open ? 'Hide dispatched payload' : 'View dispatched payload'}
              </button>
              {open && (
                <div className="border border-[#e0e0e0] bg-[#f4f4f4] p-3 mt-2">
                  <p className="font-semibold text-[#161616]">Subject: {action.subject}</p>
                  <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap font-mono text-[11px] text-[#393939]">{action.body}</pre>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#c6c6c6] mt-2">
                <span className="text-[11px] text-[#161616]">
                  <strong>Official Next Step:</strong> {action.real_next_step}
                </span>
                <a
                  href={action.real_action_url}
                  target={action.real_action_url.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className="cds--btn cds--btn--sm cds--btn--secondary inline-flex items-center gap-1"
                >
                  {action.real_action_label}
                  {action.real_action_url.startsWith('http') && <Launch size={14} className="ml-1" />}
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
    <section className="cds--tile border-l-4 border-l-[#0f62fe] bg-[#f4f4f4] p-5 space-y-4 my-4" aria-live="polite" aria-labelledby="gh-response-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e0e0] pb-3">
        <div>
          <h3 id="gh-response-title" className="text-base font-semibold text-[#161616]">
            {allDone ? 'Golden Hour Multi-Desk Protocols Dispatched' : 'Activating Multi-Desk Dispatch…'}
          </h3>
          <p className="text-xs text-[#525252]">
            Dossier {response.incident_reference || `Draft #${response.draft_id}`} &bull;{' '}
            {new Date(response.activated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <Tag type="warm-gray" size="md">
          Simulation Active
        </Tag>
      </div>

      <ol className="space-y-3">
        {response.actions.map((a, i) => (
          <ActionCard key={a.key} action={a} index={i} done={i < revealed} />
        ))}
      </ol>

      <div className="p-3 bg-[#fdf3e1] border-l-4 border-l-[#f1c21b] text-xs text-[#161616]">
        <strong>Simulation Disclaimer:</strong> {response.simulation_notice}
      </div>
    </section>
  );
};
