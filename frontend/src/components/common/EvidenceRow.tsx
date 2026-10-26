import React from 'react';
import { AlertCircle, Clock, Link2, UserX, Download, DollarSign, ShieldAlert } from 'lucide-react';
import { ScamEvidence } from '../../api/types';

interface EvidenceRowProps {
  evidence: ScamEvidence;
}

export const EvidenceRow: React.FC<EvidenceRowProps> = ({ evidence }) => {
  const getFactorMeta = (factor: string) => {
    switch (factor.toUpperCase()) {
      case 'URGENCY':
      case 'ARTIFICIAL_URGENCY':
        return {
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          label: 'Coercive Urgency',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'AUTHORITY_IMPERSONATION':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-red-600" />,
          label: 'Official Impersonation',
          badgeClass: 'bg-red-50 text-red-800 border-red-200',
        };
      case 'FEAR_AND_INTIMIDATION':
        return {
          icon: <AlertCircle className="w-4 h-4 text-red-600" />,
          label: 'Fear & Intimidation',
          badgeClass: 'bg-red-50 text-red-800 border-red-200',
        };
      case 'SUSPICIOUS_LINK':
        return {
          icon: <Link2 className="w-4 h-4 text-red-600" />,
          label: 'Deceptive Link / Shortener',
          badgeClass: 'bg-red-50 text-red-800 border-red-200',
        };
      case 'UNVERIFIED_SENDER':
        return {
          icon: <UserX className="w-4 h-4 text-amber-600" />,
          label: 'Unverified Personal Sender',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'REMOTE_ACCESS_REQUEST':
        return {
          icon: <Download className="w-4 h-4 text-red-600" />,
          label: 'Screen Share / Trojan App',
          badgeClass: 'bg-red-50 text-red-800 border-red-200',
        };
      case 'FINANCIAL_PRESSURE':
      case 'GREED_EXPLOITATION':
        return {
          icon: <DollarSign className="w-4 h-4 text-amber-600" />,
          label: 'Financial Inducement',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-slate-600" />,
          label: factor.replace(/_/g, ' '),
          badgeClass: 'bg-slate-50 text-slate-800 border-slate-200',
        };
    }
  };

  const meta = getFactorMeta(evidence.factor_type);

  return (
    <div className="p-3.5 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          {meta.icon}
          <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            {meta.label}
          </span>
        </div>
        <span
          className={`text-[11px] font-medium px-2 py-0.5 rounded border uppercase ${
            evidence.severity === 'HIGH'
              ? 'bg-red-50 text-red-700 border-red-200'
              : evidence.severity === 'MEDIUM'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          {evidence.severity} Severity
        </span>
      </div>

      <p className="text-sm text-slate-700 font-normal leading-relaxed">
        {evidence.description}
      </p>

      {evidence.matched_text && (
        <div className="mt-2 text-xs bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 text-slate-600">
          <span className="font-semibold text-slate-700 mr-1.5">Evidence excerpt:</span>
          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
            "{evidence.matched_text}"
          </span>
        </div>
      )}
    </div>
  );
};
