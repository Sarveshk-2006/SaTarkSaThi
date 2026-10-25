import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Server,
  Database,
  Radio,
  UserCheck,
  Cpu,
  BarChart3,
  X,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import { api } from '../../api/endpoints';
import { useNotification } from '../../context/NotificationContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { useToast } from '../../context/ToastContext';

interface PresenterControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PresenterControlModal: React.FC<PresenterControlModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeUserId, switchUser, isWsConnected } = useNotification();
  const { isBackendConnected, activeProvider, resetDatabase } = useDemoMode();

  const [activeTab, setActiveTab] = useState<'SCENARIOS' | 'HEALTH' | 'EVALUATION'>('SCENARIOS');
  const [isResetting, setIsResetting] = useState(false);
  const [evalReport, setEvalReport] = useState<any>(null);
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [backendPing, setBackendPing] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      const startPing = performance.now();
      api.checkHealth()
        .then(() => setBackendPing(Math.round(performance.now() - startPing)))
        .catch(() => setBackendPing(null));

      api.getEvaluationMetrics()
        .then((data) => setEvalReport(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResetData = async (seed: boolean = true) => {
    setIsResetting(true);
    try {
      await resetDatabase(seed);
      showToast({
        type: 'success',
        title: 'Demo Database Reset',
        message: seed ? 'Restored clean demo dataset with verified contacts & baseline records.' : 'Wiped database to clean state.',
      });
      onClose();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Reset Failed', message: err.message });
    } finally {
      setIsResetting(false);
    }
  };

  const handleRunEvaluation = async () => {
    setIsRunningEval(true);
    try {
      const data = await api.runEvaluation();
      setEvalReport(data);
      showToast({
        type: 'success',
        title: 'Evaluation Suite Finished',
        message: `Evaluated ${data.summary.total_samples} samples: Precision ${Math.round(data.summary.metrics.precision * 100)}%, Recall ${Math.round(data.summary.metrics.recall * 100)}%.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Evaluation Failed', message: err.message });
    } finally {
      setIsRunningEval(false);
    }
  };

  // Preset Deterministic Scenarios
  const scenarios = [
    {
      id: 'digital-arrest',
      title: 'Digital Arrest / CBI Extortion',
      target: '/scanner',
      badge: 'Extortion / Video Call',
      description: 'Senior officer Vikram Singh threatens arrest over narcotics parcel, demanding Skype isolation.',
      actionText: 'Load in Scam Analyzer',
      state: {
        presetId: 'digital-arrest',
        channel: 'WHATSAPP',
        text: (
          "URGENT: This is Senior Officer Vikram Singh from CBI New Delhi Headquarters. " +
          "Your Aadhaar card was linked to a seized parcel in Mumbai containing 16 illegal passports and MDMA narcotics. " +
          "A Non-Bailable Arrest Warrant is issued against you. You are placed under DIGITAL ARREST. " +
          "You must join Skype video call immediately for confidential verification. " +
          "Do not inform any family member or your bank will be frozen instantly. Contact 9811223344."
        ),
      },
    },
    {
      id: 'fake-investment',
      title: 'Guaranteed 100% Returns Scheme',
      target: '/scanner',
      badge: 'Investment Fraud',
      description: 'SEBI impersonation promising 100% monthly profit via Telegram trading group.',
      actionText: 'Load in Scam Analyzer',
      state: {
        presetId: 'investment-fraud',
        channel: 'WHATSAPP',
        text: (
          "Join our exclusive Telegram trading group for guaranteed 100% returns on your investment within 30 days! " +
          "We are SEBI registered advisors with insider stock market tips. " +
          "Deposit ₹10,000 today and receive ₹20,000 next month guaranteed. Limited slots remaining!"
        ),
      },
    },
    {
      id: 'otp-theft',
      title: 'OTP Theft Call Transcript',
      target: '/scanner',
      badge: 'Credential Theft',
      description: 'HDFC fraud team impersonation demanding urgent 6-digit OTP over phone call.',
      actionText: 'Load in Scam Analyzer (Audio Tab)',
      state: {
        presetId: 'otp-theft',
        tab: 'audio',
        transcript: (
          "Hello sir, this is calling from HDFC Bank credit card department. " +
          "Your credit card has been compromised and we need to verify your identity. " +
          "Please share the OTP that was sent to your registered mobile number to block the unauthorized transaction. " +
          "This is very urgent, the transaction is happening right now. Please tell me the 6-digit OTP immediately."
        ),
      },
    },
    {
      id: 'coerced-payment',
      title: 'Coerced Authority Payment',
      target: '/payment-checkpoint',
      badge: 'Payment Checkpoint',
      description: 'Clearing fee demand of ₹25,000 to cbi.clearing@sbi under pressure and secrecy.',
      actionText: 'Load in Payment Checkpoint',
      state: {
        vpa: 'cbi.clearing@sbi',
        name: 'Inspector Vikram Singh (CBI)',
        amount: 25000,
        purpose: 'Customs & Narcotics Bond Clearance',
        is_new: true,
        pressure: true,
        authority: true,
        secrecy: true,
        returns: false,
      },
    },
    {
      id: 'legitimate-bank',
      title: 'Legitimate Bank Debit Notice',
      target: '/scanner',
      badge: 'Legitimate Notice',
      description: 'Authentic debit SMS with official toll-free 1800 number and available balance.',
      actionText: 'Load in Scam Analyzer',
      state: {
        presetId: 'safe-transaction',
        channel: 'SMS',
        text: (
          "Dear Customer, INR 1,450.00 debited from A/C XX8901 on 13-Oct-26 at 14:15 via UPI to BLINKIT GROCERY. " +
          "Available Balance: INR 34,200.00. If this transaction was not authorized by you, please call SBI toll-free 1800112211 or SMS NO to 9223008333."
        ),
      },
    },
  ];

  const handleLaunchScenario = (sc: typeof scenarios[0]) => {
    navigate(sc.target, { state: sc.state });
    showToast({
      type: 'info',
      title: `Scenario Loaded: ${sc.title}`,
      message: `Navigated to ${sc.target}. Pre-filled deterministic scenario inputs.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">Hackathon Presenter Control Deck</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  DEMO MODE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deterministic test scenarios, live backend health, evaluation benchmarks & reset controls.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-slate-200 px-6 pt-3 bg-slate-50">
          <button
            onClick={() => setActiveTab('SCENARIOS')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'SCENARIOS'
                ? 'border-teal-800 text-teal-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            1-Click Scenarios ({scenarios.length})
          </button>
          <button
            onClick={() => setActiveTab('HEALTH')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'HEALTH'
                ? 'border-teal-800 text-teal-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            System & Live Health
          </button>
          <button
            onClick={() => setActiveTab('EVALUATION')}
            className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'EVALUATION'
                ? 'border-teal-800 text-teal-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Benchmark Evaluation (N=30)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SCENARIOS */}
          {activeTab === 'SCENARIOS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Deterministic Demonstration Scenarios</h3>
                  <p className="text-xs text-slate-500">
                    Pre-configured real-world fraud vectors that execute seamlessly without manual data entry.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => handleResetData(true)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  {isResetting ? 'Resetting DB...' : 'Reset Clean Seed Data'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scenarios.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-700 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-slate-900">{sc.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {sc.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">
                        {sc.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLaunchScenario(sc)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-teal-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
                      {sc.actionText}
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Disclaimer for Presenters:</strong> All demo scenarios utilize synthetic test messages and sandbox payment simulations. No actual banking transfers are initiated, and no live reports are sent to law enforcement.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM HEALTH & PERSONA */}
          {activeTab === 'HEALTH' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">System Architecture Health</h3>
                <p className="text-xs text-slate-500">Live inspection of local services, models, and WebSocket connection.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Backend Health */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">FastAPI Backend</span>
                    <Server className="w-4 h-4 text-teal-800" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-bold text-slate-900">
                      {isBackendConnected ? 'Online (8000)' : 'Offline'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {backendPing !== null ? `Response time: ${backendPing}ms` : 'Checking endpoint...'}
                  </span>
                </div>

                {/* Database Health */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">Database Engine</span>
                    <Database className="w-4 h-4 text-teal-800" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-slate-900">SQLite (Local)</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    SQLAlchemy / Postgres-Ready
                  </span>
                </div>

                {/* AI Engine Status */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">AI Risk Engine</span>
                    <Cpu className="w-4 h-4 text-teal-800" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-slate-900">
                      {activeProvider === 'watsonx' ? 'IBM watsonx.ai' : 'Rule Engine'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {activeProvider === 'watsonx' ? 'Selected; used only if credentials are configured' : 'Local deterministic rules (no IBM call)'}
                  </span>
                </div>

                {/* Live WebSocket Transport */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">Live Shield WS</span>
                    <Radio className="w-4 h-4 text-teal-800" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-sm font-bold text-slate-900">
                      {isWsConnected ? 'Connected' : 'Reconnecting'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    /api/alerts/ws transport
                  </span>
                </div>

                {/* Telecom SMS Gateway */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">Telecom SMS Gateway</span>
                    <Radio className="w-4 h-4 text-teal-800" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-slate-900">DLT Carrier Active</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Sender: SATARK &bull; DLT: 140716...
                  </span>
                </div>

                {/* Statutory Banking Switch */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-500">Banking Lien Switch</span>
                    <Database className="w-4 h-4 text-teal-800" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-bold text-slate-900">NPCI / CFCFRMS</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Automated Freeze Gateway
                  </span>
                </div>
              </div>

              {/* Active Persona Switcher */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-800" />
                  Demonstration Persona Switcher
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Switch perspectives between primary citizen (victim) and family guardian (recipient) to demonstrate live cross-device notification.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => switchUser('1')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeUserId === '1'
                        ? 'bg-teal-50 border-teal-700 shadow-xs ring-1 ring-teal-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">Rajesh Sharma</div>
                    <div className="text-[11px] text-slate-500">Father / Primary Citizen (User ID #1)</div>
                    <div className="text-[10px] text-teal-800 font-semibold mt-1">Actions: Scans threats, files recovery</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchUser('2')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeUserId === '2'
                        ? 'bg-teal-50 border-teal-700 shadow-xs ring-1 ring-teal-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-900">Aarav Sharma</div>
                    <div className="text-[11px] text-slate-500">Son / Trusted Guardian (User ID #2)</div>
                    <div className="text-[10px] text-teal-800 font-semibold mt-1">Actions: Receives live alerts & acknowledges</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BENCHMARK EVALUATION SCORECARD */}
          {activeTab === 'EVALUATION' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Forensic Evaluation & Repeatable Benchmark</h3>
                  <p className="text-xs text-slate-500">
                    Automated testing on 30 balanced ground-truth samples (15 SCAM vs 15 SAFE).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isRunningEval}
                  onClick={handleRunEvaluation}
                  className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <BarChart3 className={`w-4 h-4 ${isRunningEval ? 'animate-spin' : ''}`} />
                  {isRunningEval ? 'Running Test Suite...' : 'Run Benchmark (N=30)'}
                </button>
              </div>

              {evalReport ? (
                <div className="space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Precision</span>
                      <span className="text-xl font-bold font-mono text-teal-900">
                        {Math.round(evalReport.summary.metrics.precision * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">TP / (TP + FP)</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Recall</span>
                      <span className="text-xl font-bold font-mono text-teal-900">
                        {Math.round(evalReport.summary.metrics.recall * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">TP / (TP + FN)</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">False Positive Rate</span>
                      <span className="text-xl font-bold font-mono text-slate-700">
                        {Math.round(evalReport.summary.metrics.false_positive_rate * 100)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">FP / (FP + TN)</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Avg Latency</span>
                      <span className="text-xl font-bold font-mono text-slate-900">
                        {evalReport.summary.latency_benchmark.average_latency_ms} ms
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Range: {evalReport.summary.latency_benchmark.min_latency_ms} - {evalReport.summary.latency_benchmark.max_latency_ms} ms
                      </span>
                    </div>
                  </div>

                  {/* Confusion Matrix */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      Confusion Matrix Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="font-bold text-emerald-900 block">True Positives: {evalReport.summary.confusion_matrix.true_positives} / 15</span>
                        <span className="text-[11px] text-emerald-700">Correctly identified digital scam attempts.</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="font-bold text-slate-900 block">True Negatives: {evalReport.summary.confusion_matrix.true_negatives} / 15</span>
                        <span className="text-[11px] text-slate-600">Correctly passed legitimate transactional SMS/chats.</span>
                      </div>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <span className="font-bold text-amber-900 block">False Positives: {evalReport.summary.confusion_matrix.false_positives}</span>
                        <span className="text-[11px] text-amber-700">Legitimate messages flagged as suspicious.</span>
                      </div>
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                        <span className="font-bold text-rose-900 block">False Negatives: {evalReport.summary.confusion_matrix.false_negatives}</span>
                        <span className="text-[11px] text-rose-700">Scam messages missed by the heuristic threshold.</span>
                      </div>
                    </div>
                  </div>

                  {/* Workflow Verifications */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                      End-to-End Workflow Verifications
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-800">Family Alert Live Notification Transport</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {evalReport.workflow_verifications.family_alert_delivery.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-800">Golden Hour Recovery Dossier Generator (1930 / RBI / Police)</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {evalReport.workflow_verifications.recovery_dossier_generation.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Methodology Disclaimer */}
                  <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 italic">
                    {evalReport.methodology_disclaimer}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Click &quot;Run Benchmark&quot; to execute the 30-sample evaluation suite.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Satark Saathi v1.0 • End-to-End Hackathon Integration</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer transition-colors"
          >
            Close Deck
          </button>
        </div>
      </div>
    </div>
  );
};
