import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanSearch,
  CreditCard,
  LifeBuoy,
  ShieldCheck,
  ShieldAlert,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  PhoneCall,
  Activity,
  FileText,
  Info,
} from 'lucide-react';
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
  const [alerts, setAlerts] = useState<FamilyAlert[]>([]);
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
        <div className="border-b border-[#E2E8F0] pb-4">
          <h1 className="text-xl font-bold text-[#142A36]">Security Overview</h1>
          <p className="text-xs text-[#64748B] mt-1">Aggregated protection metrics for your family</p>
        </div>
        <LoadingSkeleton rows={5} />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchOverviewData} />;
  }

  const isEmpty = !stats || (stats.total_analyses === 0 && stats.total_incidents === 0);

  // Prepare meaningful chart data for risk distribution
  const riskDistributionData = stats
    ? [
        { name: 'High Risk Threats', count: stats.high_risk_analyses, color: '#B91C1C' },
        { name: 'Caution / Unverified', count: stats.caution_analyses, color: '#B45309' },
        { name: 'Standard / Low Risk', count: stats.safe_analyses, color: '#15803D' },
      ]
    : [];

  const recoveryCasesAttention = stats?.recent_incidents.filter(
    (i) => i.status === 'UNDER_REVIEW' || i.status === 'REPORTED_1930'
  ) || [];

  return (
    <div className="space-y-6">
      {/* Top Operational Command Desk with Quick Scanner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2E8F0] shadow-card space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-bold text-[#142A36] tracking-wider uppercase">
                Digital Safety Perimeter &amp; Family Defense Desk
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1 max-w-xl leading-relaxed">
              {currentMeta.tagline} — Verify suspicious messages, protect family accounts before sending money, and initiate immediate 1930 recovery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/payment-checkpoint')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#142A36] bg-[#F7F8F4] hover:bg-[#EEF2F6] border border-[#E2E8F0] rounded-xl transition-all cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#176B58]" />
              <span>UPI Checkpoint</span>
            </button>
            <button
              onClick={() => navigate('/golden-hour')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-all cursor-pointer"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-amber-700" />
              <span>1930 Recovery Desk</span>
            </button>
          </div>
        </div>

        {/* Quick Scan Input Bar */}
        <div className="pt-3 border-t border-[#F1F5F9] flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <ScanSearch className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Paste suspicious SMS, WhatsApp message, or URL to inspect right now..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  navigate('/scanner', { state: { text: e.currentTarget.value.trim() } });
                }
              }}
              className="w-full py-2.5 pl-10 pr-4 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] text-[#142A36] transition-colors"
            />
          </div>
          <button
            onClick={() => navigate('/scanner')}
            className="px-5 py-2.5 rounded-xl bg-[#176B58] hover:bg-[#135948] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-subtle cursor-pointer transition-all shrink-0"
          >
            <span>Scan Threat Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Explicit Demo Mode Callout Notice */}
      {isDemoMode && (
        <div className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#142A36] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#176B58] shrink-0" />
            <span className="text-[#64748B]">
              <strong className="font-semibold text-[#142A36]">Demo Dataset Active:</strong> Records shown are curated local scenarios (Digital Arrest, Electricity Phishing) for platform evaluation. They do not represent live police data or real user accounts.
            </span>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="text-[11px] font-semibold text-[#176B58] hover:text-[#135948] underline shrink-0 cursor-pointer"
          >
            Database Settings
          </button>
        </div>
      )}

      {/* Empty State for Clean User Workspace */}
      {isEmpty ? (
        <div className="py-6 space-y-4">
          <EmptyState
            icon={<ShieldCheck className="w-8 h-8 text-[#176B58]" />}
            title="Clean Family Workspace — No Threats Logged"
            description="Your family security perimeter is currently clear. Scan your first suspicious SMS or WhatsApp forward, or explore platform capabilities using sample scenarios."
            actionText="Analyse First Message"
            onAction={() => navigate('/scanner')}
          />
          <div className="text-center">
            <button
              onClick={handleSeedDemo}
              className="inline-flex items-center gap-1.5 text-xs text-[#176B58] hover:text-[#135948] font-semibold underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load sample Indian scam records for testing</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Core Metric Cards (Derived from SQLite Records) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Analyzed Incidents */}
            <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between text-[#64748B] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Messages Analyzed</span>
                <div className="w-7 h-7 rounded-lg bg-[#F7F8F4] border border-[#E2E8F0] flex items-center justify-center">
                  <ScanSearch className="w-3.5 h-3.5 text-[#176B58]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#142A36]">{stats.total_analyses}</span>
                <span className="text-[11px] text-[#64748B] font-medium">total verified</span>
              </div>
              <div className="mt-2 text-[11px] text-[#64748B] flex items-center gap-1.5">
                <span className="text-emerald-700 font-semibold">{stats.safe_analyses} safe</span>
                <span>•</span>
                <span className="text-amber-700 font-semibold">{stats.caution_analyses} caution</span>
              </div>
            </div>

            {/* 2. High-Risk Threats */}
            <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between text-[#64748B] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">High-Risk Scams</span>
                <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-700">{stats.high_risk_analyses}</span>
                <span className="text-[11px] text-red-600 font-medium">action flagged</span>
              </div>
              <p className="mt-2 text-[11px] text-[#64748B]">
                Coercive threats blocked by pattern recognition
              </p>
            </div>

            {/* 3. Family Alerts Delivered */}
            <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between text-[#64748B] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Family Alerts Sent</span>
                <div className="w-7 h-7 rounded-lg bg-[#DCEDE5] border border-[#B8DED0] flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-[#176B58]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#142A36]">{stats.total_family_alerts}</span>
                <span className="text-[11px] text-[#64748B] font-medium">notifications</span>
              </div>
              <p className="mt-2 text-[11px] text-[#64748B]">
                {stats.active_trusted_contacts} active guardians in Family Shield
              </p>
            </div>

            {/* 4. Recovery Cases & Disputed Loss */}
            <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-card">
              <div className="flex items-center justify-between text-[#64748B] mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Recovery Cases</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <LifeBuoy className="w-3.5 h-3.5 text-amber-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#142A36]">{stats.total_incidents}</span>
                <span className="text-[11px] text-[#64748B] font-medium">disputes logged</span>
              </div>
              <div className="mt-2 text-[11px] text-[#64748B] font-medium">
                {stats.total_loss_recorded > 0 ? (
                  <span className="text-red-700 font-bold">
                    ₹{stats.total_loss_recorded.toLocaleString('en-IN')} disputed
                  </span>
                ) : (
                  <span className="text-[#94A3B8]">₹0.00 disputed</span>
                )}
              </div>
            </div>
          </div>

          {/* Guided First-Time Onboarding Workflow */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 border-b border-[#F1F5F9] pb-3 gap-2">
              <div>
                <h3 className="text-xs font-bold text-[#142A36] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#176B58]" />
                  <span>Essential Protection Steps for Indian Families</span>
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Follow this 4-step security checklist to establish full household protection against digital extortion.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#176B58] bg-[#DCEDE5] px-2.5 py-0.5 rounded-full border border-[#B8DED0] shrink-0">
                {stats.active_trusted_contacts > 0 && stats.total_analyses > 0 ? '3 of 4 Ready' : 'Setup in Progress'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div
                onClick={() => navigate('/family-shield')}
                className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] hover:bg-[#DCEDE5]/50 hover:border-[#B8DED0] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#142A36]">1. Add Guardians</span>
                  {stats.active_trusted_contacts > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] text-amber-700 font-semibold">Pending</span>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Add children, spouse, or sibling to receive emergency warnings.
                </p>
              </div>

              <div
                onClick={() => navigate('/scanner')}
                className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] hover:bg-[#DCEDE5]/50 hover:border-[#B8DED0] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#142A36]">2. Test Scam Analyzer</span>
                  {stats.total_analyses > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] text-amber-700 font-semibold">Pending</span>
                  )}
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Run a sample Digital Arrest or Power Cut threat to test the engine.
                </p>
              </div>

              <div
                onClick={() => navigate('/payment-checkpoint')}
                className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] hover:bg-[#DCEDE5]/50 hover:border-[#B8DED0] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#142A36]">3. Verify UPI VPAs</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Scan recipient handles before entering your UPI PIN.
                </p>
              </div>

              <div
                onClick={() => navigate('/golden-hour')}
                className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F7F8F4] hover:bg-[#DCEDE5]/50 hover:border-[#B8DED0] cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#142A36]">4. Know 1930 Helpline</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Save 1930 in phone contacts for the 2-hour Golden Hour window.
                </p>
              </div>
            </div>
          </div>

          {/* Middle Row: Compact Risk Distribution Visualization & Protection Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Risk Distribution Chart (7 cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2.5 mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#142A36] uppercase tracking-wider">
                      Analyzed Threat Distribution
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Actual classification ratio across all analyzed messages in your database
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-[#64748B]">
                    Total: {stats.total_analyses} scans
                  </span>
                </div>

                {/* Compact Recharts Horizontal Bar Visualization */}
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={riskDistributionData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={130}
                        tick={{ fontSize: 11, fill: '#142A36' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#142A36',
                          borderColor: '#1E334E',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                        {riskDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between text-[11px] text-[#64748B] gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" />
                  <span>High Risk (Extortion/Phishing)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
                  <span>Caution (Urgent Promo)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
                  <span>Safe (Legitimate SMS)</span>
                </span>
              </div>
            </div>

            {/* Current Protection Status & Golden Hour Alerts (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Protection Status Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-card">
                <h3 className="text-xs font-bold text-[#142A36] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#176B58]" />
                  <span>Current Protection Health</span>
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F8F4] border border-[#E2E8F0]">
                    <span className="text-[#64748B] font-medium">Family Shield Status</span>
                    <span className="font-bold text-[#176B58] bg-[#DCEDE5] px-2 py-0.5 rounded-md border border-[#B8DED0]">
                      Active ({stats.active_trusted_contacts} Guardians)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F8F4] border border-[#E2E8F0]">
                    <span className="text-[#64748B] font-medium">Scam Detection Engine</span>
                    <span className="font-semibold text-[#142A36]">
                      Satark Heuristic (watsonx ready)
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F8F4] border border-[#E2E8F0]">
                    <span className="text-[#64748B] font-medium">National Helpline Link</span>
                    <span className="font-mono text-[#142A36] font-bold">1930 Verified</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex justify-between items-center text-xs">
                  <span className="text-[#64748B] text-[11px]">Primary Banking Partner:</span>
                  <span className="font-semibold text-[#142A36]">State Bank of India</span>
                </div>
              </div>

              {/* Recovery Cases Requiring Attention */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200/80 bg-amber-50/40 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <LifeBuoy className="w-4 h-4 text-amber-700" />
                    <span>Active 1930 Recovery Cases ({recoveryCasesAttention.length})</span>
                  </span>
                  <button
                    onClick={() => navigate('/golden-hour')}
                    className="text-[11px] font-semibold text-[#176B58] hover:text-[#135948] cursor-pointer"
                  >
                    Manage
                  </button>
                </div>

                {recoveryCasesAttention.length === 0 ? (
                  <p className="text-xs text-[#64748B]">
                    No active recovery cases requiring follow-up.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {recoveryCasesAttention.map((inc) => (
                      <div
                        key={inc.id}
                        className="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between gap-2 shadow-subtle"
                      >
                        <div className="truncate">
                          <p className="font-bold text-[#142A36] truncate">{inc.title}</p>
                          <span className="text-[11px] font-mono text-red-700 font-semibold">
                            Loss: ₹{inc.financial_loss.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 shrink-0">
                          {inc.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Recent Incident & Scan Activity Table */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#142A36]">Recent Incident & Scan Activity</h3>
                <p className="text-[11px] text-[#64748B]">
                  Full forensic log of analyzed messages, red flag severity, and recovery case statuses
                </p>
              </div>
              <button
                onClick={() => navigate('/incident-history')}
                className="text-xs font-bold text-[#176B58] hover:text-[#135948] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View All History</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F8F4] border-b border-[#E2E8F0] text-[#64748B] font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Incident / Scan Title</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Disputed Amount</th>
                    <th className="px-4 py-3">Recorded Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[#142A36]">
                  {stats.recent_incidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-[#F7F8F4]/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#142A36]">
                        <div>
                          <span>{incident.title}</span>
                          <span className="block text-[11px] text-[#64748B] font-normal">
                            {incident.scam_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RiskSeverityBadge severity={incident.severity} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-md border border-[#E2E8F0] bg-[#F7F8F4] text-[#142A36]">
                          {incident.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {incident.financial_loss > 0 ? (
                          <span className="text-red-700 font-bold">
                            ₹{incident.financial_loss.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">₹0.00</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {new Date(incident.incident_date || incident.created_at).toLocaleDateString(
                          'en-IN',
                          { day: 'numeric', month: 'short', year: 'numeric' }
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedIncident(incident)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#142A36] hover:text-[#142A36] border border-[#E2E8F0] hover:border-slate-300 rounded-lg bg-white transition-colors cursor-pointer shadow-subtle"
                        >
                          Inspect Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Incident Inspect Details Modal */}
      {selectedIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-dropdown border border-[#E2E8F0] max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Incident Details</span>
                <h3 className="text-base font-bold text-[#142A36] mt-0.5">{selectedIncident.title}</h3>
              </div>
              <RiskSeverityBadge severity={selectedIncident.severity} size="sm" />
            </div>

            <div className="mt-4 space-y-3 text-xs text-[#142A36]">
              <div className="grid grid-cols-2 gap-3 bg-[#F7F8F4] p-3 rounded-xl border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block">Scam Type:</span>
                  <span className="font-semibold text-[#142A36]">{selectedIncident.scam_type}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Financial Loss:</span>
                  <span className="font-semibold text-red-700">
                    ₹{selectedIncident.financial_loss.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Bank Involved:</span>
                  <span className="font-medium text-[#142A36]">
                    {selectedIncident.bank_name || 'State Bank of India'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Transaction Ref (UTR):</span>
                  <span className="font-mono text-[#142A36]">
                    {selectedIncident.transaction_ref || 'Pending'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#142A36] block mb-1">Incident Narrative:</span>
                <p className="p-3 bg-[#F7F8F4] rounded-xl border border-[#E2E8F0] leading-relaxed text-[#142A36]">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.suspect_contact && (
                <div>
                  <span className="font-semibold text-[#142A36] block mb-1">Suspect Identifier / Handle:</span>
                  <span className="font-mono bg-[#F7F8F4] px-2.5 py-1 rounded-md border border-[#E2E8F0] text-[#142A36] inline-block">
                    {selectedIncident.suspect_contact}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
              <button
                onClick={() => {
                  setSelectedIncident(null);
                  navigate('/golden-hour');
                }}
                className="text-xs font-semibold text-[#176B58] hover:text-[#135948] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Generate 1930 Legal Drafts</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-3.5 py-1.5 text-xs font-medium bg-[#F7F8F4] hover:bg-[#EEF2F6] text-[#142A36] border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
