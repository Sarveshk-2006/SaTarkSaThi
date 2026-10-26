import React from 'react';
import { Tag } from '@carbon/react';
import {
  WarningFilled,
  WarningAltFilled,
  CheckmarkFilled,
  MisuseOutline,
} from '@carbon/icons-react';
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

  const getTagType = (): 'red' | 'magenta' | 'warm-gray' | 'green' => {
    if (isCritical) return 'red';
    if (isHigh) return 'red';
    if (isCaution) return 'warm-gray';
    return 'green';
  };

  const getLabel = () => {
    if (isCritical) return 'Critical Risk';
    if (isHigh) return 'High Risk';
    if (isCaution) return 'Caution';
    return 'Safe';
  };

  const tagSize = size === 'sm' ? 'sm' : 'md';

  return (
    <Tag
      type={getTagType()}
      size={tagSize}
      className="cds--risk-badge inline-flex items-center gap-1 font-semibold"
    >
      {showIcon && (
        <span className="inline-flex shrink-0 mr-1" aria-hidden="true">
          {isCritical && <MisuseOutline size={16} />}
          {isHigh && !isCritical && <WarningFilled size={16} />}
          {isCaution && <WarningAltFilled size={16} />}
          {isSafe && <CheckmarkFilled size={16} />}
        </span>
      )}
      <span>{getLabel()}</span>
      {score !== undefined && (
        <span className="cds--risk-score ml-1 font-mono font-normal opacity-90">({score}/100)</span>
      )}
    </Tag>
  );
};
