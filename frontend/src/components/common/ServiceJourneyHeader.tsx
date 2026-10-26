import React from 'react';
import { Tag } from '@carbon/react';
import { CheckmarkFilled, Security } from '@carbon/icons-react';

interface ServiceJourneyHeaderProps {
  title: string;
  badge: string;
  badgeKind?: 'teal' | 'blue' | 'red' | 'warm-gray' | 'green' | 'purple';
  tagline: string;
  inputs: string;
  deliverables: string;
  nextAction: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export const ServiceJourneyHeader: React.FC<ServiceJourneyHeaderProps> = ({
  title,
  badge,
  badgeKind = 'teal',
  tagline,
  inputs,
  deliverables,
  nextAction,
  icon: Icon = Security,
}) => {
  return (
    <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-xl p-4 sm:p-5 mb-5 space-y-4">
      {/* Top Value Proposition */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E6F4F2] text-[#0F766E] flex items-center justify-center shrink-0 border border-[#BCE3DE]">
            <Icon size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-[#182230] tracking-tight">
                {title}
              </h1>
              <Tag type={badgeKind} size="sm" className="font-mono uppercase font-bold text-[10px]">
                {badge}
              </Tag>
            </div>
            <p className="text-xs text-[#586474] mt-0.5 leading-relaxed">
              {tagline}
            </p>
          </div>
        </div>
      </div>

      {/* 3-Pillar Service Expectations (Inputs -> Deliverables -> Next Action) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Pillar 1: Inputs */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F766E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            <span>1. What You Provide</span>
          </div>
          <p className="text-xs text-[#182230] font-medium leading-snug">
            {inputs}
          </p>
        </div>

        {/* Pillar 2: Deliverables */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F62FE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F62FE]" />
            <span>2. What You Receive</span>
          </div>
          <p className="text-xs text-[#182230] font-medium leading-snug">
            {deliverables}
          </p>
        </div>

        {/* Pillar 3: Next Action */}
        <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#D92D20]">
            <CheckmarkFilled size={12} className="text-[#D92D20]" />
            <span>3. Recommended Next Step</span>
          </div>
          <p className="text-xs text-[#182230] font-medium leading-snug">
            {nextAction}
          </p>
        </div>
      </div>
    </div>
  );
};
