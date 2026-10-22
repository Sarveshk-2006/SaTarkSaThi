import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';
import { RiskSeverity } from '../../api/types';

interface RiskSeverityBadgeProps {
  severity: RiskSeverity;
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
  const isHigh = severity === 'HIGH_RISK';
  const isCaution = severity === 'CAUTION';
  const isSafe = severity === 'SAFE';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const getStyle = () => {
    if (isHigh) {
      return 'bg-red-50 text-red-800 border-red-200';
    }
    if (isCaution) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  const label = isHigh ? 'High Risk' : isCaution ? 'Caution' : 'Safe';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-semibold tracking-wide ${getStyle()} ${
        sizeClasses[size]
      }`}
    >
      {showIcon && (
        <>
          {isHigh && <ShieldAlert className={iconSizes[size]} />}
          {isCaution && <AlertTriangle className={iconSizes[size]} />}
          {isSafe && <ShieldCheck className={iconSizes[size]} />}
        </>
      )}
      <span>{label}</span>
      {score !== undefined && (
        <span className="font-mono opacity-80 pl-0.5 font-normal">({score}/100)</span>
      )}
    </span>
  );
};
