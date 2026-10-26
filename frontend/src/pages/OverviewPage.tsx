import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scan,
  Wallet,
  Help,
  UserMultiple,
  ArrowRight,
  Renew,
  CheckmarkFilled,
  WarningFilled,
  Activity,
  Information,
  Launch,
} from '@carbon/icons-react';
import {
  Tile,
  Button,
  Tag,
  Modal,
} from '@carbon/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { api } from '../api/endpoints';
import { OverviewStats, Incident, FamilyAlert } from '../api/types';
import { RiskSeverityBadge } from '../components/common/RiskSeverityBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { useDemoMode } from '../context/DemoModeContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isDemoMode, resetDatabase } = useDemoMode();
  const { currentMeta } = useLanguage();

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [, setAlerts] = useState<FamilyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, alertsData] = await Promise.all([
        api.getOverviewStats(),
        api.getAlerts(),
      ]);
      setStats(statsData);
      setAlerts(alertsData);
    } catch (err: any) {
      setError(err.message || 'Unable to load operational security metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleSeedDemo = async () => {
    try {
      await resetDatabase(true);
      showToast({ type: 'success', title: 'Demo Data Loaded', message: 'Realistic Indian scam scenarios initialized.' });
      fetchOverviewData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load demo data', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#e0e0e0] pb-4">
          <h1 className="text-xl font-semibold text-[#161616]">Security Overview</h1>
          <p className="text-xs text-[#525252] mt-1">Aggregated protection metrics for your family</p>
        </div>
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchOverviewData} />;
  }

  const isEmpty = !stats || (stats.total_analyses === 0 && stats.total_incidents === 0);

  const riskDistributionData = stats
    ? [
        { name: 'High Risk Threats', count: stats.high_risk_analyses, color: '#da1e28' },
        { name: 'Caution / Unverified', count: stats.caution_analyses, color: '#f1c21b' },
        { name: 'Standard / Low Risk', count: stats.safe_analyses, color: '#24a148' },
      ]
    : [];

  const recoveryCasesAttention = stats?.recent_incidents.filter(
    (i) => i.status === 'UNDER_REVIEW' || i.status === 'REPORTED_1930'
  ) || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Operational Command Desk with Quick Scanner */}
      <Tile className="bg-white p-5 border border-[#e0e0e0] space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#24a148] animate-pulse" />
              <h2 className="text-xs font-semibold text-[#161616] tracking-wider uppercase">
                Digital Safety Perimeter &amp; Family Defense Desk
              </h2>
            </div>
            <p className="text-xs text-[#525252] mt-1 max-w-xl leading-relaxed">
              {currentMeta.tagline} — Verify suspicious messages, protect family accounts before sending money, and initiate immediate 1930 recovery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              kind="tertiary"
              size="sm"
              renderIcon={Wallet}
              onClick={() => navigate('/payment-checkpoint')}
            >
              UPI Checkpoint
            </Button>
            <Button
              kind="danger--tertiary"
              size="sm"
              renderIcon={Help}
              onClick={() => navigate('/golden-hour')}
            >
              1930 Recovery Desk
            </Button>
          </div>
        </div>

        {/* Quick Scan Input Bar */}
        <div className="pt-3 border-t border-[#e0e0e0] flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Scan size={18} className="text-[#525252] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Paste suspicious SMS, WhatsApp message, or URL to inspect right now..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  navigate('/scanner', { state: { text: e.currentTarget.value.trim() } });
                }
              }}
              className="w-full py-2.5 pl-10 pr-4 text-xs sm:text-sm border border-[#e0e0e0] bg-[#f4f4f4] focus:bg-white focus:outline-none focus:border-[#0f62fe] text-[#161616] transition-colors"
            />
          </div>
          <Button
            kind="primary"
            size="md"
            renderIcon={ArrowRight}
            onClick={() => navigate('/scanner')}
            className="shrink-0"
          >
            Scan Threat Now
          </Button>
        </div>
      </Tile>

      {/* Explicit Demo Mode Callout Notice */}
      {isDemoMode && (
        <div className="px-4 py-2.5 border-l-4 border-l-[#0f62fe] border border-[#e0e0e0] bg-white text-[#161616] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Information size={18} className="text-[#0f62fe] shrink-0" />
            <span className="text-[#525252]">
              <strong className="font-semibold text-[#161616]">Demo Dataset Active:</strong> Records shown are curated local scenarios (Digital Arrest, Electricity Phishing) for platform evaluation. They do not represent live police data or real user accounts.
            </span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="text-[11px] font-semibold text-[#0f62fe] hover:underline shrink-0 cursor-pointer"
          >
            Database Settings
          </button>
        </div>
      )}

      {/* Empty State for Clean User Workspace */}
      {isEmpty ? (
        <div className="py-6 space-y-4">
          <EmptyState
            icon={<CheckmarkFilled size={32} className="text-[#24a148]" />}
            title="Clean Family Workspace — No Threats Logged"
            description="Your family security perimeter is currently clear. Scan your first suspicious SMS or WhatsApp forward, or explore platform capabilities using sample scenarios."
            actionText="Analyse First Message"
            onAction={() => navigate('/scanner')}
          />
          <div className="text-center">
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Renew}
              onClick={handleSeedDemo}
            >
              Load sample Indian scam records for testing
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Core Metric Tiles (Derived from SQLite Records) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Analyzed Incidents */}
            <Tile className="p-4 bg-white border border-[#e0e0e0]">
              <div className="flex items-center justify-between text-[#525252] mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Messages Analyzed</span>
                <div className="w-7 h-7 bg-[#f4f4f4] border border-[#e0e0e0] flex items-center justify-center">
                  <Scan size={16} className="text-[#0f62fe]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#161616]">{stats.total_analyses}</span>
                <span className="text-[11px] text-[#525252] font-medium">total verified</span>
              </div>
              <div className="mt-2 text-[11px] text-[#525252] flex items-center gap-1.5">
                <Tag type="green" size="sm">{stats.safe_analyses} safe</Tag>
                <Tag type="warm-gray" size="sm">{stats.caution_analyses} caution</Tag>
              </div>
            </Tile>

            {/* 2. High-Risk Threats */}
            <Tile className="p-4 bg-white border border-[#e0e0e0]">
              <div className="flex items-center justify-between text-[#525252] mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">High-Risk Scams</span>
                <div className="w-7 h-7 bg-[#fff1f1] border border-[#ffb3b8] flex items-center justify-center">
                  <WarningFilled size={16} className="text-[#da1e28]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#da1e28]">{stats.high_risk_analyses}</span>
                <Tag type="red" size="sm">action flagged</Tag>
              </div>
              <p className="mt-2 text-[11px] text-[#525252]">
                Coercive threats blocked by pattern recognition
              </p>
            </Tile>

            {/* 3. Family Alerts Delivered */}
            <Tile className="p-4 bg-white border border-[#e0e0e0]">
              <div className="flex items-center justify-between text-[#525252] mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Family Alerts Sent</span>
                <div className="w-7 h-7 bg-[#edf5ff] border border-[#d0e2ff] flex items-center justify-center">
                  <UserMultiple size={16} className="text-[#0f62fe]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#161616]">{stats.total_family_alerts}</span>
                <span className="text-[11px] text-[#525252] font-medium">notifications</span>
              </div>
              <p className="mt-2 text-[11px] text-[#525252]">
                {stats.active_trusted_contacts} active guardians in Family Shield
              </p>
            </Tile>

            {/* 4. Recovery Cases & Disputed Loss */}
            <Tile className="p-4 bg-white border border-[#e0e0e0]">
              <div className="flex items-center justify-between text-[#525252] mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Recovery Cases</span>
                <div className="w-7 h-7 bg-[#fef7e0] border border-[#f1c21b] flex items-center justify-center">
                  <Help size={16} className="text-[#b28600]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#161616]">{stats.total_incidents}</span>
                <span className="text-[11px] text-[#525252] font-medium">disputes logged</span>
              </div>
              <div className="mt-2 text-[11px] text-[#525252] font-medium">
                {stats.total_loss_recorded > 0 ? (
                  <span className="text-[#da1e28] font-bold">
                    ₹{stats.total_loss_recorded.toLocaleString('en-IN')} disputed
                  </span>
                ) : (
                  <span className="text-[#8d8d8d]">₹0.00 disputed</span>
                )}
              </div>
            </Tile>
          </div>

          {/* Guided Protection Steps Checklist */}
          <Tile className="bg-white p-5 border border-[#e0e0e0]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 border-b border-[#e0e0e0] pb-3 gap-2">
              <div>
                <h3 className="text-xs font-semibold text-[#161616] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckmarkFilled size={16} className="text-[#0f62fe]" />
                  <span>Essential Protection Steps for Indian Families</span>
                </h3>
                <p className="text-[11px] text-[#525252] mt-0.5">
                  Follow this 4-step security checklist to establish full household protection against digital extortion.
                </p>
              </div>
              <Tag type="blue" size="sm">
                {stats.active_trusted_contacts > 0 && stats.total_analyses > 0 ? '3 of 4 Ready' : 'Setup in Progress'}
              </Tag>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div
                onClick={() => navigate('/scanner')}
                className="p-3.5 border border-[#e0e0e0] bg-[#f8fafc] hover:bg-[#edf5ff] hover:border-[#0f62fe] cursor-pointer transition-all rounded-lg space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#161616]">1. Scam Analyzer</span>
                    {stats.total_analyses > 0 ? (
                      <CheckmarkFilled size={16} className="text-[#24a148]" />
                    ) : (
                      <Tag type="warm-gray" size="sm">Active</Tag>
                    )}
                  </div>
                  <p className="text-[11px] text-[#525252] leading-relaxed">
                    Paste suspicious SMS, link or QR &bull; Receive instant explainable risk tier and bank verification.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#e0e0e0]/70 flex items-center justify-between text-[11px] font-semibold text-[#0f62fe]">
                  <span>Analyze Message</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              <div
                onClick={() => navigate('/payment-checkpoint')}
                className="p-3.5 border border-[#e0e0e0] bg-[#f8fafc] hover:bg-[#edf5ff] hover:border-[#0f62fe] cursor-pointer transition-all rounded-lg space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#161616]">2. UPI Checkpoint</span>
                    <Tag type="blue" size="sm">Pre-Flight</Tag>
                  </div>
                  <p className="text-[11px] text-[#525252] leading-relaxed">
                    Test transfer VPA and coercive pressure before entering your PIN to halt extortion.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#e0e0e0]/70 flex items-center justify-between text-[11px] font-semibold text-[#0f62fe]">
                  <span>Verify Payment</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              <div
                onClick={() => navigate('/family-shield')}
                className="p-3.5 border border-[#e0e0e0] bg-[#f8fafc] hover:bg-[#edf5ff] hover:border-[#0f62fe] cursor-pointer transition-all rounded-lg space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#161616]">3. Family Shield</span>
                    {stats.active_trusted_contacts > 0 ? (
                      <CheckmarkFilled size={16} className="text-[#24a148]" />
                    ) : (
                      <Tag type="warm-gray" size="sm">Setup</Tag>
                    )}
                  </div>
                  <p className="text-[11px] text-[#525252] leading-relaxed">
                    Link elderly parents with two-way consent to broadcast real-time threat alerts to guardians.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#e0e0e0]/70 flex items-center justify-between text-[11px] font-semibold text-[#0f62fe]">
                  <span>Manage Guardians</span>
                  <ArrowRight size={14} />
                </div>
              </div>

              <div
                onClick={() => navigate('/golden-hour')}
                className="p-3.5 border border-[#e0e0e0] bg-[#f8fafc] hover:bg-[#fff1f1] hover:border-[#da1e28] cursor-pointer transition-all rounded-lg space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#161616]">4. 1930 Recovery Desk</span>
                    <Tag type="red" size="sm">Emergency</Tag>
                  </div>
                  <p className="text-[11px] text-[#525252] leading-relaxed">
                    Within 2–3 hours of fraud, generate simultaneous 1930 complaint, bank lien, and police filings.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#e0e0e0]/70 flex items-center justify-between text-[11px] font-semibold text-[#da1e28]">
                  <span>Launch Recovery</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </Tile>

          {/* Middle Row: Threat Distribution & Protection Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Risk Distribution Chart (7 cols) */}
            <Tile className="lg:col-span-7 bg-white p-5 border border-[#e0e0e0] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#e0e0e0] pb-2.5 mb-3">
                  <div>
                    <h3 className="text-xs font-semibold text-[#161616] uppercase tracking-wider">
                      Analyzed Threat Distribution
                    </h3>
                    <p className="text-[11px] text-[#525252]">
                      Actual classification ratio across all analyzed messages in your database
                    </p>
                  </div>
                  <Tag type="cool-gray" size="sm" className="font-mono">
                    Total: {stats.total_analyses} scans
                  </Tag>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={riskDistributionData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#525252' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={130}
                        tick={{ fontSize: 11, fill: '#161616' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#161616',
                          borderColor: '#393939',
                          borderRadius: '0px',
                          color: '#ffffff',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 2, 2, 0]} barSize={20}>
                        {riskDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#e0e0e0] flex flex-wrap items-center justify-between text-[11px] text-[#525252] gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#da1e28]" />
                  <span>High Risk (Extortion/Phishing)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f1c21b]" />
                  <span>Caution (Urgent Promo)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#24a148]" />
                  <span>Safe (Legitimate SMS)</span>
                </span>
              </div>
            </Tile>

            {/* Current Protection Status & Golden Hour Attention (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Tile className="bg-white p-5 border border-[#e0e0e0]">
                <h3 className="text-xs font-semibold text-[#161616] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity size={16} className="text-[#0f62fe]" />
                  <span>Current Protection Health</span>
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-[#f4f4f4] border border-[#e0e0e0]">
                    <span className="text-[#525252] font-medium">Family Shield Status</span>
                    <Tag type="blue" size="sm">
                      Active ({stats.active_trusted_contacts} Guardians)
                    </Tag>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-[#f4f4f4] border border-[#e0e0e0]">
                    <span className="text-[#525252] font-medium">Scam Detection Engine</span>
                    <span className="font-semibold text-[#161616]">
                      Satark rule engine (local)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-[#f4f4f4] border border-[#e0e0e0]">
                    <span className="text-[#525252] font-medium">National Helpline Link</span>
                    <span className="font-mono text-[#161616] font-bold">1930 Verified</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#e0e0e0] flex justify-between items-center text-xs">
                  <span className="text-[#525252] text-[11px]">Primary Banking Partner:</span>
                  <span className="font-semibold text-[#161616]">State Bank of India</span>
                </div>
              </Tile>

              {/* Recovery Cases Requiring Attention */}
              <Tile className="bg-white p-5 border-l-4 border-l-[#f1c21b] border border-[#e0e0e0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#161616] uppercase tracking-wider flex items-center gap-1.5">
                    <Help size={16} className="text-[#b28600]" />
                    <span>Active 1930 Recovery Cases ({recoveryCasesAttention.length})</span>
                  </span>
                  <Button
                    kind="ghost"
                    size="sm"
                    onClick={() => navigate('/golden-hour')}
                  >
                    Manage
                  </Button>
                </div>

                {recoveryCasesAttention.length === 0 ? (
                  <p className="text-xs text-[#525252]">
                    No active recovery cases requiring follow-up.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {recoveryCasesAttention.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-2.5 bg-[#f4f4f4] border border-[#e0e0e0] flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <p className="font-semibold text-[#161616] truncate">{inc.title}</p>
                          <span className="text-[11px] font-mono text-[#da1e28] font-semibold">
                            Loss: ₹{inc.financial_loss.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <Tag type="warm-gray" size="sm">
                          {inc.status.replace(/_/g, ' ')}
                        </Tag>
                      </div>
                    ))}
                  </div>
                )}
              </Tile>
            </div>
          </div>

          {/* Bottom Row: Recent Incident & Scan Activity Table */}
          <Tile className="bg-white p-0 border border-[#e0e0e0] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e0e0e0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#161616]">Recent Incident & Scan Activity</h3>
                <p className="text-[11px] text-[#525252]">
                  Full forensic log of analyzed messages, red flag severity, and recovery case statuses
                </p>
              </div>
              <Button
                kind="ghost"
                size="sm"
                renderIcon={ArrowRight}
                onClick={() => navigate('/incident-history')}
              >
                View All History
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs cds--data-table cds--data-table--compact">
                <thead className="bg-[#f4f4f4] border-b border-[#e0e0e0] text-[#525252] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Incident / Scan Title</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Disputed Amount</th>
                    <th className="px-4 py-3">Recorded Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0] text-[#161616]">
                  {stats.recent_incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-[#f4f4f4] transition-colors">
                      <td className="px-4 py-3 font-medium text-[#161616]">
                        <div>
                          <span>{incident.title}</span>
                          <span className="block text-[11px] text-[#525252] font-normal">
                            {incident.scam_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RiskSeverityBadge severity={incident.severity} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <Tag type="cool-gray" size="sm">
                          {incident.status.replace(/_/g, ' ')}
                        </Tag>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {incident.financial_loss > 0 ? (
                          <span className="text-[#da1e28] font-semibold">
                            ₹{incident.financial_loss.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[#8d8d8d]">₹0.00</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#525252]">
                        {new Date(incident.incident_date || incident.created_at).toLocaleDateString(
                          'en-IN',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          kind="ghost"
                          size="sm"
                          onClick={() => setSelectedIncident(incident)}
                        >
                          Inspect Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Tile>
        </>
      )}

      {/* Incident Inspect Details Modal */}
      {selectedIncident && (
        <Modal
          open={!!selectedIncident}
          modalHeading={selectedIncident.title}
          primaryButtonText="Generate 1930 Legal Drafts"
          secondaryButtonText="Close"
          onRequestSubmit={() => {
            setSelectedIncident(null);
            navigate('/golden-hour');
          }}
          onRequestClose={() => setSelectedIncident(null)}
          size="md"
        >
          <div className="space-y-3 text-xs text-[#161616] pt-2">
            <div className="flex items-center justify-between pb-2">
              <span className="text-[11px] uppercase font-semibold text-[#525252]">
                Scam Classification: {selectedIncident.scam_type}
              </span>
              <RiskSeverityBadge severity={selectedIncident.severity} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-3 bg-[#f4f4f4] p-3 border border-[#e0e0e0]">
              <div>
                <span className="text-[#525252] block">Financial Loss:</span>
                <span className="font-semibold text-[#da1e28]">
                  ₹{selectedIncident.financial_loss.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[#525252] block">Bank Involved:</span>
                <span className="font-medium text-[#161616]">
                  {selectedIncident.bank_name || 'State Bank of India'}
                </span>
              </div>
              <div>
                <span className="text-[#525252] block">Transaction Ref (UTR):</span>
                <span className="font-mono text-[#161616]">
                  {selectedIncident.transaction_ref || 'Pending'}
                </span>
              </div>
              <div>
                <span className="text-[#525252] block">Incident Date:</span>
                <span className="text-[#161616]">
                  {new Date(selectedIncident.incident_date || selectedIncident.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-[#161616] block mb-1">Incident Narrative:</span>
              <p className="p-3 bg-[#f4f4f4] border border-[#e0e0e0] leading-relaxed text-[#161616]">
                {selectedIncident.description}
              </p>
            </div>

            {selectedIncident.suspect_contact && (
              <div>
                <span className="font-semibold text-[#161616] block mb-1">Suspect Identifier / Handle:</span>
                <span className="font-mono bg-[#f4f4f4] px-2.5 py-1 border border-[#e0e0e0] text-[#161616] inline-block">
                  {selectedIncident.suspect_contact}
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
