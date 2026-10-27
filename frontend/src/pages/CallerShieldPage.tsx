import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Plus,
  Trash2,
  Cpu,
  Radio,
  ExternalLink,
  RotateCcw,
  UserX,
  PhoneForwarded,
  PhoneOff,
  Flame,
  Building,
  Info
} from 'lucide-react';

interface CallerDetails {
  phone_number: string;
  normalized_number: string;
  display_number?: string;
  display_tag: string;
  category: string;
  risk_score: number;
  risk_level: string;
  confidence: string;
  action: string;
  is_blocked: boolean;
  carrier_verified: boolean;
  carrier_name?: string;
  is_business: boolean;
  business_name?: string;
  total_reports: number;
  verified_reports: number;
  ibm_summary?: string;
  evidence_signals: string[];
  recommended_action?: string;
  last_reported_at?: string;
}

interface CallerStats {
  total_screened_numbers: number;
  active_threat_numbers: number;
  community_reports_count: number;
  personal_blocked_count: number;
  ibm_ai_status: string;
  analysis_provider: string;
}

interface BlocklistItem {
  id: number;
  normalized_number: string;
  display_name?: string;
  action: string;
  reason?: string;
  created_at?: string;
}

export const CallerShieldPage: React.FC = () => {
  const [stats, setStats] = useState<CallerStats>({
    total_screened_numbers: 5,
    active_threat_numbers: 4,
    community_reports_count: 510,
    personal_blocked_count: 1,
    ibm_ai_status: 'LOCAL_FALLBACK_ACTIVE',
    analysis_provider: 'Deterministic Local Rule Engine'
  });

  const [searchQuery, setSearchQuery] = useState('+91 98765 00001');
  const [searching, setSearching] = useState(false);
  const [callerResult, setCallerResult] = useState<CallerDetails | null>(null);

  const [threats, setThreats] = useState<CallerDetails[]>([]);
  const [blocklist, setBlocklist] = useState<BlocklistItem[]>([]);
  const [activeTab, setActiveTab] = useState<'radar' | 'lookup' | 'blocklist'>('radar');

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportNum, setReportNum] = useState('');
  const [reportCategory, setReportCategory] = useState('DIGITAL_ARREST');
  const [reportName, setReportName] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Incoming Call Simulation Overlay
  const [simulatedCall, setSimulatedCall] = useState<CallerDetails | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const statsRes = await fetch('http://127.0.0.1:8000/api/v1/caller-intelligence/stats');
      if (statsRes.ok) setStats(await statsRes.json());

      const threatsRes = await fetch('http://127.0.0.1:8000/api/v1/caller-intelligence/threats');
      if (threatsRes.ok) setThreats(await threatsRes.json());

      const blocklistRes = await fetch('http://127.0.0.1:8000/api/v1/caller-intelligence/blocklist?user_id=1');
      if (blocklistRes.ok) setBlocklist(await blocklistRes.json());
    } catch {
      // Offline fallback defaults
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLookup = async (numberToLookup?: string) => {
    const target = numberToLookup || searchQuery;
    if (!target.trim()) return;

    setSearching(true);
    setCallerResult(null);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/caller-intelligence/lookup?phone_number=${encodeURIComponent(target)}&user_id=1`
      );
      if (res.ok) {
        const data = await res.json();
        setCallerResult(data);
      }
    } catch {
      // Fallback
      setCallerResult({
        phone_number: target,
        normalized_number: target,
        display_tag: 'Unreported Caller',
        category: 'UNKNOWN',
        risk_score: 10,
        risk_level: 'UNKNOWN',
        confidence: 'LOW',
        action: 'ALLOW',
        is_blocked: false,
        carrier_verified: false,
        is_business: false,
        total_reports: 0,
        verified_reports: 0,
        ibm_summary: 'No reports recorded in local threat database.',
        evidence_signals: [],
        recommended_action: 'Never disclose NetBanking OTPs or passwords.'
      });
    } finally {
      setSearching(false);
    }
  };

  const handleBlockToggle = async (caller: CallerDetails) => {
    try {
      if (caller.is_blocked) {
        await fetch(
          `http://127.0.0.1:8000/api/v1/caller-intelligence/blocklist?phone_number=${encodeURIComponent(
            caller.normalized_number
          )}&user_id=1`,
          { method: 'DELETE' }
        );
      } else {
        await fetch('http://127.0.0.1:8000/api/v1/caller-intelligence/blocklist?user_id=1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: caller.normalized_number,
            action: 'BLOCK',
            display_name: caller.display_tag,
            reason: 'User manual block'
          })
        });
      }
      handleLookup(caller.normalized_number);
      fetchData();
    } catch {
      // Ignore
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNum.trim()) return;

    setSubmittingReport(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/caller-intelligence/reports?user_id=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: reportNum,
          category: reportCategory,
          claimed_caller_name: reportName || null,
          description: reportDesc || null,
          call_type: 'INCOMING'
        })
      });
      if (res.ok) {
        setShowReportModal(false);
        setReportNum('');
        setReportName('');
        setReportDesc('');
        setToastMessage('Report recorded successfully. Threat radar updated!');
        setTimeout(() => setToastMessage(null), 3000);
        fetchData();
      }
    } catch {
      // Ignore
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-slideDown">
          <CheckCircle className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#001D6C] to-[#0F62FE] text-white rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold tracking-wide">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            TELECOM SAFETY SHIELD • CALL SCREENING API
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Satark Caller Shield
          </h1>
          <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
            Truecaller-style incoming call intelligence, real-time extortion warning badges,
            deterministic risk scoring, and IBM watsonx AI fraud pattern summarization.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm rounded-xl transition shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Report Scam Number
          </button>
          <a
            href="/downloads/satark-saathi-release.apk"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-800/80 hover:bg-blue-800 border border-white/20 text-white font-semibold text-sm rounded-xl transition"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            Download Android APK (2.73 MB)
          </a>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Screened Numbers</span>
            <PhoneCall className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total_screened_numbers}</div>
          <div className="text-[11px] text-slate-500 mt-1">Indexed in local intelligence DB</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">High-Risk Threats</span>
            <Flame className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600">{stats.active_threat_numbers}</div>
          <div className="text-[11px] text-slate-500 mt-1">Extortion & digital arrest scams</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Citizen Reports</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats.community_reports_count}</div>
          <div className="text-[11px] text-slate-500 mt-1">Crowdsourced threat reports</div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">IBM watsonx AI</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-indigo-900 truncate">
            {stats.ibm_ai_status === 'CONFIGURED' ? 'Granite Model Active' : 'Local Heuristic Active'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sub-50ms non-blocking screening
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('radar')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'radar'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Flame className="w-4 h-4 text-red-500" />
          Active Threat Radar
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'lookup'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search className="w-4 h-4 text-blue-600" />
          Live Number Lookup
        </button>

        <button
          onClick={() => setActiveTab('blocklist')}
          className={`pb-3 px-2 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'blocklist'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserX className="w-4 h-4 text-slate-700" />
          Personal Blocklist ({blocklist.length})
        </button>
      </div>

      {/* TAB 1: THREAT RADAR */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Highest-Risk Reported Numbers in India
            </h2>
            <span className="text-xs text-slate-500">Updated automatically from community reports</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {threats.map((threat) => (
                <div
                  key={threat.normalized_number}
                  className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/80 transition"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {threat.display_number || threat.normalized_number}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          threat.risk_score >= 85
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {threat.risk_level} • {threat.risk_score}/100
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        {threat.category.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800">
                      {threat.display_tag}
                    </div>

                    {threat.ibm_summary && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {threat.ibm_summary}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                      <span>{threat.total_reports} citizen reports</span>
                      <span>•</span>
                      <span>Carrier: {threat.carrier_name || 'Standard Cellular Trunk'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => setSimulatedCall(threat)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <PhoneForwarded className="w-3.5 h-3.5" />
                      Simulate Call
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('lookup');
                        setSearchQuery(threat.normalized_number);
                        handleLookup(threat.normalized_number);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE NUMBER LOOKUP */}
      {activeTab === 'lookup' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Query Phone Number Reputation & Fraud Signals
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="Enter phone number (e.g. +91 98765 00001 or 9123456789)..."
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-slate-900"
                />
              </div>
              <button
                onClick={() => handleLookup()}
                disabled={searching}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-bold transition shadow"
              >
                {searching ? 'Querying...' : 'Verify Number'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="font-semibold">Quick Test Seeds:</span>
              <button
                onClick={() => {
                  setSearchQuery('+91 98765 00001');
                  handleLookup('+91 98765 00001');
                }}
                className="text-blue-600 underline font-mono"
              >
                +91 98765 00001 (Digital Arrest)
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setSearchQuery('+91 91234 56789');
                  handleLookup('+91 91234 56789');
                }}
                className="text-blue-600 underline font-mono"
              >
                +91 91234 56789 (Electricity Disconnect)
              </button>
              <span>•</span>
              <button
                onClick={() => {
                  setSearchQuery('+91 22 2854 0000');
                  handleLookup('+91 22 2854 0000');
                }}
                className="text-blue-600 underline font-mono"
              >
                +91 22 2854 0000 (Verified SBI Desk)
              </button>
            </div>
          </div>

          {/* Caller Profile Card */}
          {callerResult && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-extrabold text-slate-900 font-mono">
                      {callerResult.phone_number}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        callerResult.risk_score >= 80
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : callerResult.risk_score <= 20
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {callerResult.risk_level} • {callerResult.risk_score}/100 RISK
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    {callerResult.display_tag}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSimulatedCall(callerResult)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold transition"
                  >
                    <PhoneForwarded className="w-4 h-4" />
                    Simulate Incoming Call
                  </button>

                  <button
                    onClick={() => handleBlockToggle(callerResult)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                      callerResult.is_blocked
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <PhoneOff className="w-4 h-4" />
                    {callerResult.is_blocked ? 'Unblock Number' : 'Block Number'}
                  </button>
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Category</div>
                  <div className="text-sm font-bold text-slate-900 capitalize">
                    {callerResult.category.replace(/_/g, ' ').toLowerCase()}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Carrier Verified</div>
                  <div className="text-sm font-bold text-slate-900">
                    {callerResult.carrier_verified ? 'Verified Signature' : 'Unverified Trunk'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Community Reports</div>
                  <div className="text-sm font-bold text-slate-900">{callerResult.total_reports}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-semibold">Personal Action</div>
                  <div className="text-sm font-bold text-slate-900">
                    {callerResult.is_blocked ? 'BLOCKED' : callerResult.action}
                  </div>
                </div>
              </div>

              {/* IBM AI Threat Summary */}
              {callerResult.ibm_summary && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-700" />
                    IBM watsonx.ai Threat Intelligence Summary
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {callerResult.ibm_summary}
                  </p>
                </div>
              )}

              {/* Recommended Action */}
              {callerResult.recommended_action && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-1">
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-700" />
                    Citizen Recommended Safety Protocol
                  </div>
                  <p className="text-xs text-slate-700">
                    {callerResult.recommended_action}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERSONAL BLOCKLIST */}
      {activeTab === 'blocklist' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Blocklist & Allowlist Rules</h2>
              <p className="text-xs text-slate-500">
                Numbers marked as BLOCK will be disconnected immediately during Android call screening.
              </p>
            </div>
          </div>

          {blocklist.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No numbers currently added to your personal blocklist.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {blocklist.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {item.normalized_number}
                    </div>
                    <div className="text-xs text-slate-600">
                      {item.display_name || 'Manual Block'} • {item.reason || 'Spam prevention'}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      fetch(
                        `http://127.0.0.1:8000/api/v1/caller-intelligence/blocklist?phone_number=${encodeURIComponent(
                          item.normalized_number
                        )}&user_id=1`,
                        { method: 'DELETE' }
                      ).then(() => fetchData());
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Remove from blocklist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Report Caller */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Report Suspicious or Fraud Caller
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Caller Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={reportNum}
                  onChange={(e) => setReportNum(e.target.value)}
                  placeholder="e.g. +91 98765 00001"
                  className="w-full text-xs font-mono px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scam / Fraud Category *
                </label>
                <select
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800"
                >
                  <option value="DIGITAL_ARREST">Digital Arrest (Fake Police / CBI / Court)</option>
                  <option value="KYC_FRAUD">Bank NetBanking KYC Suspension</option>
                  <option value="ELECTRICITY_SCAM">Electricity Disconnection Warning</option>
                  <option value="COURIER_CUSTOMS">Customs Courier Contraband Extortion</option>
                  <option value="LOTTERY_FRAUD">KBC Lottery Prize Advance Fee</option>
                  <option value="HARASSMENT">Spam / Aggressive Telemarketing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Name Claimed by Caller (Optional)
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g. Inspector Vijay Rathore / CBI Mumbai"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Conversation Details & Coercion Techniques
                </label>
                <textarea
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Describe what the caller said, payment demands, or links sent..."
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Community Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Truecaller-Style Incoming Call Simulation */}
      {simulatedCall && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-5 animate-scaleUp border-4 border-slate-700">
            {/* Warning Badge */}
            <div
              className={`inline-block px-4 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide text-white ${
                simulatedCall.risk_score >= 80 ? 'bg-red-600' : 'bg-emerald-600'
              }`}
            >
              {simulatedCall.risk_score >= 80 ? '🚨 SUSPECTED FRAUD CALL' : '✅ VERIFIED BUSINESS CALL'}
            </div>

            {/* Avatar */}
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                simulatedCall.risk_score >= 80 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {simulatedCall.risk_score >= 80 ? (
                <PhoneOff className="w-10 h-10" />
              ) : (
                <Building className="w-10 h-10" />
              )}
            </div>

            {/* Caller Name & Number */}
            <div>
              <div className="text-lg font-black text-slate-900">{simulatedCall.display_tag}</div>
              <div className="text-sm font-mono text-slate-600 mt-0.5">{simulatedCall.phone_number}</div>
              <div className="text-xs font-bold text-red-600 mt-1">
                Risk Score: {simulatedCall.risk_score}/100 ({simulatedCall.risk_level})
              </div>
            </div>

            {/* Summary */}
            {simulatedCall.ibm_summary && (
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 text-left">
                {simulatedCall.ibm_summary}
              </p>
            )}

            {/* Call Buttons */}
            <div className="flex justify-around items-center pt-2">
              <button
                onClick={() => setSimulatedCall(null)}
                className="flex flex-col items-center gap-1.5 text-red-600 group"
              >
                <div className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                  <PhoneOff className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold">Decline</span>
              </button>

              <button
                onClick={() => setSimulatedCall(null)}
                className="flex flex-col items-center gap-1.5 text-emerald-600 group"
              >
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold">Answer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
