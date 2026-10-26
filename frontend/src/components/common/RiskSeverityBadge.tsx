import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { RiskSeverity } from '../../api/types';

interface RiskSeverityBadgeProps {
  severity: RiskSeverity | string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskSeverityBadge: React.FC<RiskSeverityBadgeProps> = ({
  severity,
  score,
  size = 'md',
  showIcon = true,
}) => {
  const norm = String(severity || '').toUpperCase();
  const isCritical = norm === 'CRITICAL';
  const isHigh = norm === 'HIGH_RISK' || norm === 'HIGH' || norm === 'RED';
  const isCaution = norm === 'CAUTION' || norm === 'MEDIUM' || norm === 'AMBER' || norm === 'ELEVATED';
  const isSafe = !isCritical && !isHigh && !isCaution;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3 shrink-0',
    md: 'w-3.5 h-3.5 shrink-0',
    lg: 'w-4 h-4 shrink-0',
  };

  const getStyle = () => {
    if (isCritical) {
      return 'bg-red-50 text-red-900 border-red-300 ring-1 ring-red-400/20';
    }
    if (isHigh) {
      return 'bg-red-50 text-red-800 border-red-200';
    }
    if (isCaution) {
      return 'bg-amber-50 text-amber-900 border-amber-300';
    }
    return 'bg-emerald-50 text-emerald-900 border-emerald-300';
  };

  const getLabel = () => {
    if (isCritical) return 'Critical Risk';
    if (isHigh) return 'High Risk';
    if (isCaution) return 'Caution';
    return 'Safe';
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border font-semibold tracking-wide ${getStyle()} ${
        sizeClasses[size]
      }`}
    >
      {showIcon && (
        <>
          {isCritical && <AlertOctagon className={iconSizes[size]} />}
          {isHigh && !isCritical && <ShieldAlert className={iconSizes[size]} />}
          {isCaution && <AlertTriangle className={iconSizes[size]} />}
          {isSafe && <ShieldCheck className={iconSizes[size]} />}
        </>
      )}
      <span>{getLabel()}</span>
      {score !== undefined && (
        <span className="font-mono opacity-80 pl-0.5 font-normal">({score}/100)</span>
      )}
    </span>
  );
};
