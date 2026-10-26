import React from 'react';
import { Tag } from '@carbon/react';
import { Information, Security } from '@carbon/icons-react';

interface SimulationBannerProps {
  title?: string;
  message: string;
  variant?: 'amber' | 'blue' | 'slate';
  badgeText?: string;
}

export const SimulationBanner: React.FC<SimulationBannerProps> = ({
  title = 'Simulation Sandbox',
  message,
  badgeText = 'SIMULATION ONLY',
}) => {
  return (
    <div
      role="region"
      aria-label="Simulation Environment Notice"
      className="cds--simulation-banner p-3.5 bg-[#f4f4f4] border-l-4 border-l-[#f1c21b] border border-[#e0e0e0] flex items-center justify-between gap-3 text-xs mb-4"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[#8d6b00] shrink-0" aria-hidden="true">
          <Information size={20} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#161616] text-xs">{title}</span>
            <Tag type="warm-gray" size="sm" className="font-mono uppercase font-bold tracking-wider">
              {badgeText}
            </Tag>
          </div>
          <p className="text-[12px] text-[#525252] mt-0.5 leading-snug">
            {message}
          </p>
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-[#525252] shrink-0">
        <Security size={16} className="text-[#0f62fe]" />
        <span>Protected Safe Environment</span>
      </div>
    </div>
  );
};
