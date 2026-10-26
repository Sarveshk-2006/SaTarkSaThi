import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useViewMode, ViewMode } from '../../context/ViewModeContext';

const OPTIONS: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: 'web', label: 'Web', icon: <Monitor className="w-3.5 h-3.5" /> },
  { value: 'app', label: 'App', icon: <Smartphone className="w-3.5 h-3.5" /> },
];

/** Web dashboard ⇄ mobile app (mock UPI) experience. Web is the default. */
export const ViewModeToggle: React.FC<{ dark?: boolean }> = ({ dark = false }) => {
  const { viewMode, setViewMode } = useViewMode();
  return (
    <div
      role="radiogroup"
      aria-label="Display mode"
      className={`inline-flex items-center p-0.5 rounded-xl border ${dark ? 'bg-white/10 border-white/20' : 'bg-[#EAECE6] border-[#E2E8F0]'}`}
    >
      {OPTIONS.map((o) => {
        const active = viewMode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setViewMode(o.value)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              active
                ? 'bg-[#176B58] text-white shadow-subtle'
                : dark
                ? 'text-slate-200 hover:text-white'
                : 'text-[#142A36] hover:bg-white'
            }`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
};
