import React from 'react';
import { Info, ShieldAlert } from 'lucide-react';

interface SimulationBannerProps {
  title?: string;
  message: string;
  variant?: 'amber' | 'blue' | 'slate';
  badgeText?: string;
}

export const SimulationBanner: React.FC<SimulationBannerProps> = ({
  title = 'Simulation Sandbox',
  message,
  variant = 'amber',
  badgeText = 'SIMULATION ONLY',
}) => {
  const styles = {
    amber: {
      container: 'bg-amber-50/80 border-amber-200/80 text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: 'text-amber-700',
    },
    blue: {
      container: 'bg-sky-50/80 border-sky-200/80 text-sky-950',
      badge: 'bg-sky-100 text-sky-800 border-sky-300',
      icon: 'text-sky-700',
    },
    slate: {
      container: 'bg-slate-50 border-slate-200 text-slate-800',
      badge: 'bg-slate-200 text-slate-700 border-slate-300',
      icon: 'text-slate-600',
    },
  }[variant];

  return (
    <div
      role="region"
      aria-label="Simulation Environment Notice"
      className={`p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 shadow-subtle ${styles.container}`}
    >
      <Info className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 ${styles.icon}`} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-bold text-[#142A36]">{title}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${styles.badge}`}
          >
            {badgeText}
          </span>
        </div>
        <p className="text-xs leading-relaxed opacity-90">{message}</p>
      </div>
    </div>
  );
};
