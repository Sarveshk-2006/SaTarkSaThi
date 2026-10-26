import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flash,
  Renew,
  BareMetalServer,
  DataBase,
  UserFollow,
  Chip,
  Analytics,
  Close,
  Play,
  ArrowRight,
  CheckmarkFilled,
  Information,
} from '@carbon/icons-react';
import { Tile, Button, Tag, InlineNotification } from '@carbon/react';
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
    <div className="fixed inset-0 z-50 bg-[#161616]/70 flex items-center justify-center p-4">
      <div className="bg-white border border-[#393939] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#161616] text-white flex items-center justify-between border-b border-[#393939]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0f62fe] flex items-center justify-center text-white">
              <Flash size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight">Presenter &amp; Evaluator Control Deck</h2>
                <Tag type="teal" size="sm">
                  DEMO ACTIVE
                </Tag>
              </div>
              <p className="text-xs text-[#c6c6c6]">
                Deterministic test vectors, live health telemetry, benchmark evaluation &amp; reset controls.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#c6c6c6] hover:text-white p-1 cursor-pointer"
            title="Close control deck"
          >
            <Close size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-[#e0e0e0] px-6 pt-2 bg-[#f4f4f4]">
          <button
            type="button"
            onClick={() => setActiveTab('SCENARIOS')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'SCENARIOS'
                ? 'border-[#0f62fe] text-[#0f62fe]'
                : 'border-transparent text-[#525252] hover:text-[#161616]'
            }`}
          >
            1-Click Scenarios ({scenarios.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HEALTH')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'HEALTH'
                ? 'border-[#0f62fe] text-[#0f62fe]'
                : 'border-transparent text-[#525252] hover:text-[#161616]'
            }`}
          >
            <BareMetalServer size={14} />
            System &amp; Live Health
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EVALUATION')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'EVALUATION'
                ? 'border-[#0f62fe] text-[#0f62fe]'
                : 'border-transparent text-[#525252] hover:text-[#161616]'
            }`}
          >
            <Analytics size={14} />
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
                  <h3 className="text-sm font-semibold text-[#161616]">Deterministic Demonstration Scenarios</h3>
                  <p className="text-xs text-[#525252]">
                    Pre-configured real-world fraud vectors that execute seamlessly without manual data entry.
                  </p>
                </div>
                <Button
                  kind="secondary"
                  size="sm"
                  renderIcon={Renew}
                  disabled={isResetting}
                  onClick={() => handleResetData(true)}
                >
                  {isResetting ? 'Resetting DB...' : 'Reset Clean Seed Data'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scenarios.map((sc) => (
                  <Tile
                    key={sc.id}
                    className="p-4 border border-[#e0e0e0] bg-white hover:border-[#0f62fe] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-[#161616]">{sc.title}</span>
                        <Tag type="warm-gray" size="sm">
                          {sc.badge}
                        </Tag>
                      </div>
                      <p className="text-xs text-[#525252] leading-relaxed mb-3">
                        {sc.description}
                      </p>
                    </div>
                    <Button
                      kind="primary"
                      size="sm"
                      renderIcon={Play}
                      onClick={() => handleLaunchScenario(sc)}
                      className="w-full"
                    >
                      {sc.actionText}
                    </Button>
                  </Tile>
                ))}
              </div>

              <InlineNotification
                kind="warning"
                title="Presenter Notice"
                subtitle="All demo scenarios utilize synthetic test messages and sandbox payment simulations. No actual banking transfers are initiated, and no live reports are sent to real law enforcement portals."
                hideCloseButton
                lowContrast
              />
            </div>
          )}

          {/* TAB 2: SYSTEM HEALTH & PERSONA */}
          {activeTab === 'HEALTH' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[#161616]">System Architecture Health</h3>
                <p className="text-xs text-[#525252]">Live inspection of local services, models, and WebSocket connection.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Backend Health */}
                <div className="p-3.5 border border-[#e0e0e0] bg-[#f4f4f4]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#525252]">FastAPI Backend</span>
                    <BareMetalServer size={16} className="text-[#0f62fe]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isBackendConnected ? 'bg-[#198038]' : 'bg-[#da1e28]'}`} />
                    <span className="text-sm font-semibold text-[#161616]">
                      {isBackendConnected ? 'Online (Port 8000)' : 'Offline'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#525252] mt-1 block">
                    {backendPing !== null ? `Response time: ${backendPing}ms` : 'Checking endpoint...'}
                  </span>
                </div>

                {/* Database Health */}
                <div className="p-3.5 border border-[#e0e0e0] bg-[#f4f4f4]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#525252]">Database Engine</span>
                    <DataBase size={16} className="text-[#0f62fe]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#198038]" />
                    <span className="text-sm font-semibold text-[#161616]">SQLite (Local File)</span>
                  </div>
                  <span className="text-[11px] text-[#525252] mt-1 block">
                    SQLAlchemy ORM &bull; Transaction Safe
                  </span>
                </div>

                {/* AI Engine Status */}
                <div className="p-3.5 border border-[#e0e0e0] bg-[#f4f4f4]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#525252]">AI Risk Engine</span>
                    <Chip size={16} className="text-[#0f62fe]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#198038]" />
                    <span className="text-sm font-semibold text-[#161616]">
                      {activeProvider === 'watsonx' ? 'IBM watsonx.ai' : 'Rule Engine'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#525252] mt-1 block">
                    {activeProvider === 'watsonx' ? 'Selected adapter (credentials required)' : 'Local deterministic rules (offline)'}
                  </span>
                </div>

                {/* Live WebSocket Transport */}
                <div className="p-3.5 border border-[#e0e0e0] bg-[#f4f4f4]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#525252]">Live Shield WS</span>
                    <Flash size={16} className="text-[#0f62fe]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isWsConnected ? 'bg-[#198038]' : 'bg-[#f1c21b] animate-pulse'}`} />
                    <span className="text-sm font-semibold text-[#161616]">
                      {isWsConnected ? 'Active Connected' : 'Reconnecting'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#525252] mt-1 block">
                    /api/alerts/ws transport
                  </span>
                </div>

                {/* Telecom SMS Gateway */}
                <div className="p-3.5 border border-[#e0e0e0] bg-[#f4f4f4]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#525252]">Telecom SMS Gateway</span>
                    <BareMetalServer size={16} className="text-[#0f62fe]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#198038]" />
                    <span className="text-sm font-semibold text-[#161616]">DLT Carrier Simulator</span>
                  </div>
                  <span className="text-[11px] text-[#525252] mt-1 block">
                    Sender: SATARK &bull; DLT: 140716...
                  </span>
                </div>

                {/* Banking Lien Switch */}
                <div className="p-3.5 border border-[#e0e0e0] bg-[#f4f4f4]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[#525252]">Banking Lien Switch</span>
                    <DataBase size={16} className="text-[#0f62fe]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#198038]" />
                    <span className="text-sm font-semibold text-[#161616]">CFCFRMS / NPCI Nodal</span>
                  </div>
                  <span className="text-[11px] text-[#525252] mt-1 block">
                    Automated Lien Gateway
                  </span>
                </div>
              </div>

              {/* Active Persona Switcher */}
              <Tile className="p-5 border border-[#e0e0e0] bg-white">
                <h4 className="text-xs font-semibold text-[#161616] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <UserFollow size={16} className="text-[#0f62fe]" />
                  Demonstration Persona Switcher
                </h4>
                <p className="text-xs text-[#525252] mb-3">
                  Switch perspectives between primary citizen (victim) and family guardian (recipient) to demonstrate live cross-device notification.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => switchUser('1')}
                    className={`p-4 border text-left transition-all cursor-pointer ${
                      activeUserId === '1'
                        ? 'bg-[#edf5ff] border-[#0f62fe]'
                        : 'border-[#e0e0e0] hover:bg-[#f4f4f4]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#161616]">Rajesh Sharma</div>
                    <div className="text-[11px] text-[#525252]">Father / Primary Citizen (User ID #1)</div>
                    <div className="text-[10px] text-[#0f62fe] font-semibold mt-1">Role: Scans threats, files recovery</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchUser('2')}
                    className={`p-4 border text-left transition-all cursor-pointer ${
                      activeUserId === '2'
                        ? 'bg-[#edf5ff] border-[#0f62fe]'
                        : 'border-[#e0e0e0] hover:bg-[#f4f4f4]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#161616]">Aarav Sharma</div>
                    <div className="text-[11px] text-[#525252]">Son / Trusted Guardian (User ID #2)</div>
                    <div className="text-[10px] text-[#0f62fe] font-semibold mt-1">Role: Receives live alerts &amp; confirms</div>
                  </button>
                </div>
              </Tile>
            </div>
          )}

          {/* TAB 3: BENCHMARK EVALUATION SCORECARD */}
          {activeTab === 'EVALUATION' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#161616]">Forensic Evaluation &amp; Repeatable Benchmark</h3>
                  <p className="text-xs text-[#525252]">
                    Automated testing on 30 balanced ground-truth samples (15 SCAM vs 15 SAFE).
                  </p>
                </div>
                <Button
                  kind="primary"
                  size="sm"
                  renderIcon={Analytics}
                  disabled={isRunningEval}
                  onClick={handleRunEvaluation}
                >
                  {isRunningEval ? 'Running Test Suite...' : 'Run Benchmark (N=30)'}
                </Button>
              </div>

              {evalReport ? (
                <div className="space-y-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[#f4f4f4] border border-[#e0e0e0]">
                      <span className="text-[11px] text-[#525252] block">Precision</span>
                      <span className="text-xl font-bold font-mono text-[#0f62fe]">
                        {Math.round(evalReport.summary.metrics.precision * 100)}%
                      </span>
                      <span className="text-[10px] text-[#525252] block mt-0.5">TP / (TP + FP)</span>
                    </div>

                    <div className="p-3.5 bg-[#f4f4f4] border border-[#e0e0e0]">
                      <span className="text-[11px] text-[#525252] block">Recall</span>
                      <span className="text-xl font-bold font-mono text-[#0f62fe]">
                        {Math.round(evalReport.summary.metrics.recall * 100)}%
                      </span>
                      <span className="text-[10px] text-[#525252] block mt-0.5">TP / (TP + FN)</span>
                    </div>

                    <div className="p-3.5 bg-[#f4f4f4] border border-[#e0e0e0]">
                      <span className="text-[11px] text-[#525252] block">False Positive Rate</span>
                      <span className="text-xl font-bold font-mono text-[#161616]">
                        {Math.round(evalReport.summary.metrics.false_positive_rate * 100)}%
                      </span>
                      <span className="text-[10px] text-[#525252] block mt-0.5">FP / (FP + TN)</span>
                    </div>

                    <div className="p-3.5 bg-[#f4f4f4] border border-[#e0e0e0]">
                      <span className="text-[11px] text-[#525252] block">Avg Latency</span>
                      <span className="text-xl font-bold font-mono text-[#161616]">
                        {evalReport.summary.latency_benchmark.average_latency_ms} ms
                      </span>
                      <span className="text-[10px] text-[#525252] block mt-0.5">
                        Range: {evalReport.summary.latency_benchmark.min_latency_ms} - {evalReport.summary.latency_benchmark.max_latency_ms} ms
                      </span>
                    </div>
                  </div>

                  {/* Confusion Matrix */}
                  <Tile className="p-4 bg-white border border-[#e0e0e0]">
                    <h4 className="text-xs font-semibold text-[#161616] uppercase tracking-wider mb-2">
                      Confusion Matrix Breakdown
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-[#defbe6] border border-[#a7f0ba]">
                        <span className="font-semibold text-[#198038] block">
                          True Positives: {evalReport.summary.confusion_matrix.true_positives} / 15
                        </span>
                        <span className="text-[11px] text-[#198038]">Correctly identified digital scam attempts.</span>
                      </div>
                      <div className="p-3 bg-[#f4f4f4] border border-[#e0e0e0]">
                        <span className="font-semibold text-[#161616] block">
                          True Negatives: {evalReport.summary.confusion_matrix.true_negatives} / 15
                        </span>
                        <span className="text-[11px] text-[#525252]">Correctly passed legitimate transactional SMS/chats.</span>
                      </div>
                      <div className="p-3 bg-[#fdf3e1] border border-[#f1c21b]">
                        <span className="font-semibold text-[#b28600] block">
                          False Positives: {evalReport.summary.confusion_matrix.false_positives}
                        </span>
                        <span className="text-[11px] text-[#b28600]">Legitimate messages flagged as suspicious.</span>
                      </div>
                      <div className="p-3 bg-[#fff1f1] border border-[#ffb3b8]">
                        <span className="font-semibold text-[#da1e28] block">
                          False Negatives: {evalReport.summary.confusion_matrix.false_negatives}
                        </span>
                        <span className="text-[11px] text-[#da1e28]">Scam messages missed by heuristic threshold.</span>
                      </div>
                    </div>
                  </Tile>

                  {/* Workflow Verifications */}
                  <div className="p-4 bg-[#f4f4f4] border border-[#e0e0e0]">
                    <h4 className="text-xs font-semibold text-[#161616] uppercase tracking-wider mb-2">
                      End-to-End Workflow Verifications
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-white border border-[#e0e0e0]">
                        <span className="font-medium text-[#161616]">Family Alert Live Notification Transport</span>
                        <Tag type="green" size="sm">
                          {evalReport.workflow_verifications.family_alert_delivery.status}
                        </Tag>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-white border border-[#e0e0e0]">
                        <span className="font-medium text-[#161616]">Golden Hour Recovery Dossier Generator (1930 / RBI / Police)</span>
                        <Tag type="green" size="sm">
                          {evalReport.workflow_verifications.recovery_dossier_generation.status}
                        </Tag>
                      </div>
                    </div>
                  </div>

                  {/* Methodology Disclaimer */}
                  <div className="text-[11px] text-[#525252] leading-relaxed bg-[#f4f4f4] p-3 border border-[#e0e0e0] italic">
                    {evalReport.methodology_disclaimer}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#8d8d8d]">
                  <Analytics size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Click &quot;Run Benchmark&quot; to execute the 30-sample evaluation suite.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#f4f4f4] border-t border-[#e0e0e0] flex items-center justify-between text-xs text-[#525252]">
          <span>Satark Saathi &bull; IBM Carbon Rebuild &bull; Evaluator Control Deck</span>
          <Button kind="ghost" size="sm" onClick={onClose}>
            Close Deck
          </Button>
        </div>
      </div>
    </div>
  );
};
