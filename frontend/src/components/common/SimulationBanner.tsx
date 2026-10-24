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
  return (
    <div
      role="region"
      aria-label="Simulation Environment Notice"
      className="p-3 sm:p-3.5 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/60 shadow-xs flex items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-1.5 rounded-lg bg-amber-100/90 text-amber-800 shrink-0">
          <Info className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#142A36] text-xs">{title}</span>
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase bg-amber-200/80 text-amber-900 border border-amber-300/80">
              {badgeText}
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug line-clamp-1 sm:line-clamp-none">
            {message}
          </p>
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 shrink-0">
        <span>Protected Safe Environment</span>
      </div>
    </div>
  );
};
