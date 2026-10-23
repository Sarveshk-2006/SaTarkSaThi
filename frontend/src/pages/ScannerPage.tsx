import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ScanSearch,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Share2,
  LifeBuoy,
  History,
  Link2,
  FileText,
  Image as ImageIcon,
  Mic,
  Upload,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Cpu,
  Layers,
} from 'lucide-react';
import { api } from '../api/endpoints';
import {
  AnalysisResult,
  PresetSample,
  ChannelType,
  TrustedContact,
} from '../api/types';
import { useToast } from '../context/ToastContext';

type ActiveTab = 'text' | 'url' | 'image' | 'audio';

export const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Active input tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('text');

  // Text inputs
  const [text, setText] = useState('');
  const [channel, setChannel] = useState<ChannelType>('SMS');

  // URL inputs
  const [urlInput, setUrlInput] = useState('');

  // Image inputs
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageOcrText, setImageOcrText] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Audio inputs
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioTranscript, setAudioTranscript] = useState('');
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Presets and history
  const [presets, setPresets] = useState<PresetSample[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);

  // Execution states
  const [analyzing, setAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Alert modal state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [alertSending, setAlertSending] = useState(false);

  useEffect(() => {
    // Check if navigated from Presenter Deck with state
    const state = location.state as any;
    if (state?.text) {
      setActiveTab('text');
      setText(state.text);
      if (state.channel) setChannel(state.channel);
      setCurrentAnalysis(null);
    } else if (state?.transcript) {
      setActiveTab('audio');
      setAudioTranscript(state.transcript);
      setCurrentAnalysis(null);
    } else if (state?.url) {
      setActiveTab('url');
      setUrlInput(state.url);
      setCurrentAnalysis(null);
    }

    // Load presets, contacts, and seed history
    api.getPresets().then(setPresets).catch(() => {});
    api.getContacts().then((data) => {
      setContacts(data);
      setSelectedContacts(data.filter((c) => c.is_active).map((c) => c.id));
    }).catch(() => {});
  }, [location.state]);

  // Handle Preset selection
  const handleSelectPreset = (preset: PresetSample) => {
    setActiveTab('text');
    setText(preset.text);
    setChannel(preset.channel);
  };

  // Handle Image File selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast({
        type: 'error',
        title: 'Invalid file type',
        message: 'Please upload a JPG, PNG, or WebP screenshot.',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'File too large',
        message: 'Screenshot size must not exceed 10 MB.',
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageOcrText('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Handle Audio File selection
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      showToast({
        type: 'error',
        title: 'Unsupported audio format',
        message: 'Please upload an MP3, WAV, M4A, OGG, or AAC recording.',
      });
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'File too large',
        message: 'Audio size must not exceed 25 MB.',
      });
      return;
    }

    setAudioFile(file);
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setAudioTranscript('');
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  // Unified Reset / Clear action
  const handleReset = () => {
    if (activeTab === 'text') setText('');
    if (activeTab === 'url') setUrlInput('');
    if (activeTab === 'image') handleRemoveImage();
    if (activeTab === 'audio') handleRemoveAudio();
  };

  // Unified Analyze handler
  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAnalyzing(true);

    try {
      let result: AnalysisResult;

      if (activeTab === 'text') {
        const trimmed = text.trim();
        if (trimmed.length < 5) {
          showToast({
            type: 'warning',
            title: 'Input too short',
            message: 'Please provide at least 5 characters to analyze.',
          });
          setAnalyzing(false);
          return;
        }
        if (trimmed.length > 10000) {
          showToast({
            type: 'warning',
            title: 'Input too long',
            message: 'Message length exceeds 10,000 characters. Please provide a shorter excerpt.',
          });
          setAnalyzing(false);
          return;
        }
        result = await api.analyzeText(trimmed, channel);
      } else if (activeTab === 'url') {
        const trimmed = urlInput.trim();
        if (!trimmed) {
          showToast({
            type: 'warning',
            title: 'URL required',
            message: 'Please enter a URL to inspect.',
          });
          setAnalyzing(false);
          return;
        }
        result = await api.analyzeUrl(trimmed);
      } else if (activeTab === 'image') {
        if (!imageFile && !imageOcrText.trim()) {
          showToast({
            type: 'warning',
            title: 'Screenshot required',
            message: 'Please upload an image or paste extracted text to analyze.',
          });
          setAnalyzing(false);
          return;
        }

        if (imageFile) {
          const uploadRes = await api.analyzeImage(imageFile, imageOcrText.trim() || undefined);
          if (uploadRes.analysis) {
            result = uploadRes.analysis;
            if (uploadRes.extracted_text && !imageOcrText) {
              setImageOcrText(uploadRes.extracted_text);
            }
          } else {
            showToast({
              type: 'warning',
              title: 'OCR unavailable',
              message: uploadRes.message || 'Please paste the visible text from the image into the box below.',
            });
            setAnalyzing(false);
            return;
          }
        } else {
          // User provided extracted text directly
          result = await api.analyzeText(imageOcrText.trim(), 'IMAGE');
          result.input_type = 'image';
        }
      } else {
        // Voice / Audio evidence
        if (!audioTranscript.trim() && !audioFile) {
          showToast({
            type: 'warning',
            title: 'Audio evidence required',
            message: 'Please upload an audio recording or enter the spoken transcript to analyze.',
          });
          setAnalyzing(false);
          return;
        }

        const audioRes = await api.analyzeAudio(audioFile, audioTranscript.trim() || undefined);
        if (audioRes.transcript && !audioTranscript) {
          setAudioTranscript(audioRes.transcript);
        }

        if (audioRes.analysis) {
          result = audioRes.analysis;
        } else {
          showToast({
            type: 'warning',
            title: 'Transcription note',
            message: audioRes.message || 'Please provide spoken transcript text to complete risk analysis.',
          });
          setAnalyzing(false);
          return;
        }
      }

      setCurrentAnalysis(result);
      setRecentAnalyses((prev) => [result, ...prev.filter((r) => r.incident_id !== result.incident_id).slice(0, 4)]);

      showToast({
        type:
          result.risk_level === 'CRITICAL' || result.risk_level === 'HIGH'
            ? 'error'
            : result.risk_level === 'MEDIUM'
            ? 'warning'
            : 'success',
        title: `Analysis: ${result.verdict}`,
        message: `Risk Score: ${result.risk_score}/100 (${result.risk_level})`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Analysis error',
        message: err.message || 'Unable to complete forensic analysis.',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Dispatch alert to family contacts
  const handleDispatchFamilyAlert = async () => {
    if (!currentAnalysis || selectedContacts.length === 0) return;
    setAlertSending(true);
    try {
      await api.dispatchAlert({
        incident_id: currentAnalysis.incident_id,
        contact_ids: selectedContacts,
        threat_title: `Satark Alert: ${currentAnalysis.verdict}`,
        message_content: `Satark Saathi Scam Intelligence Alert: High-risk threat detected (Score: ${currentAnalysis.risk_score}/100). Recommended action: ${currentAnalysis.recommended_actions[0] || 'Do not engage.'}`,
        delivery_channel: 'IN_APP_SIMULATION',
      });
      setIsAlertModalOpen(false);
      showToast({
        type: 'success',
        title: 'Family Shield Alert Dispatched',
        message: `Emergency alert simulated to ${selectedContacts.length} trusted family contacts.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Alert dispatch failed', message: err.message });
    } finally {
      setAlertSending(false);
    }
  };

  // Escalate to Golden Hour recovery
  const handleEscalateToRecovery = () => {
    if (!currentAnalysis) return;
    const search = currentAnalysis.incident_id ? `?incident_id=${encodeURIComponent(currentAnalysis.incident_id)}` : '';
    navigate(`/golden-hour${search}`, {
      state: {
        incidentId: currentAnalysis.incident_id,
        classification: currentAnalysis.verdict,
        summary: currentAnalysis.plain_language_summary,
        riskScore: currentAnalysis.risk_score,
      },
    });
  };

  // Copy full forensic investigation report
  const handleCopyFullReport = () => {
    if (!currentAnalysis) return;
    const reportText = `=== SATARK SAATHI SCAM INTELLIGENCE REPORT ===
Incident ID: ${currentAnalysis.incident_id}
Verdict: ${currentAnalysis.verdict}
Risk Level: ${currentAnalysis.risk_level} (Score: ${currentAnalysis.risk_score}/100)
Confidence: ${currentAnalysis.confidence_label}
AI Provider: ${currentAnalysis.ai_provider} (${currentAnalysis.analysis_mode})

EXECUTIVE SUMMARY:
${currentAnalysis.plain_language_summary}

DETECTED THREAT SIGNALS:
${currentAnalysis.detected_signals.map((s) => `• [${s.severity}] ${s.signal_type}: ${s.reason}${s.excerpt ? ` (Found: "${s.excerpt}")` : ''}`).join('\n')}

IMMEDIATE PROTECTIVE ACTIONS:
${currentAnalysis.recommended_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

INDEPENDENT VERIFICATION STEPS:
${currentAnalysis.verification_steps.map((v, i) => `${i + 1}. ${v}`).join('\n')}

LIMITATIONS & DISCLAIMER:
${currentAnalysis.limitations.join('\n')}
=============================================`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopiedReport(true);
      showToast({
        type: 'success',
        title: 'Report Copied',
        message: 'Investigation report copied to clipboard.',
      });
      setTimeout(() => setCopiedReport(false), 2500);
    });
  };

  // Get color styling based on risk level
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          badgeBg: 'bg-red-600',
          text: 'text-red-900',
          meter: 'bg-red-600',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          badgeBg: 'bg-orange-600',
          text: 'text-orange-900',
          meter: 'bg-orange-600',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-300',
          badgeBg: 'bg-amber-500',
          text: 'text-amber-900',
          meter: 'bg-amber-500',
        };
      default:
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-300',
          badgeBg: 'bg-emerald-600',
          text: 'text-emerald-900',
          meter: 'bg-emerald-600',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Scam Intelligence Engine
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              Evidence-Based Forensic Detection
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyze suspicious messages, URLs, screenshots, and call transcripts for Indian social-engineering threats.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Cpu className="w-3.5 h-3.5 text-teal-700" />
          <span>IBM watsonx.ai Granite Ready</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preset scenarios bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                <span>Test Common Indian Scam Scenarios</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to autofill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-900 text-slate-700 transition-colors text-left"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Unified Workspace Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* 4 Input Method Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'text'
                    ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Text / SMS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'url'
                    ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>URL / Domain</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'image'
                    ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Screenshot (OCR)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'audio'
                    ? 'bg-white text-teal-900 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice Evidence</span>
              </button>
            </div>

            {/* Input Form Body */}
            <form onSubmit={handleAnalyze} className="p-5 space-y-4">
              {/* TAB 1: TEXT */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="text-input" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Suspicious Message Content
                    </label>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 text-[11px]">Channel:</span>
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value as ChannelType)}
                        className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-teal-700"
                      >
                        <option value="SMS">SMS Message</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="TELEGRAM">Telegram</option>
                        <option value="EMAIL">Email</option>
                        <option value="CALL_TRANSCRIPT">Call Transcript</option>
                        <option value="APK_URL">APK / Web Link</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <textarea
                      id="text-input"
                      rows={6}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste suspicious SMS, WhatsApp message, email, or caller script here (e.g. CBI arrest warrant, electricity disconnection, bank KYC notice)..."
                      className="w-full p-3.5 text-sm bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:outline-teal-700 focus:border-teal-700 text-slate-900 leading-relaxed placeholder:text-slate-400 resize-y"
                    />
                    {text && (
                      <button
                        type="button"
                        onClick={() => setText('')}
                        className="absolute top-2.5 right-2.5 p-1 text-xs text-slate-400 hover:text-slate-600 rounded bg-white/80 border border-slate-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>{text.length} characters (min 5, max 10,000)</span>
                    {text.length > 8000 && (
                      <span className="text-amber-600 font-sans font-medium">Approaching maximum length limit</span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: URL */}
              {activeTab === 'url' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="url-input" className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Suspicious URL / Web Link
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Inspect domain structure, misleading subdomains, TLD reputation, and shortener redirection.
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <input
                        id="url-input"
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://sbi-kyc-update.xyz/verify-login or bit.ly/free-prize"
                        className="w-full pl-9 pr-12 py-2.5 text-sm bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:outline-teal-700 focus:border-teal-700 text-slate-900 font-mono"
                      />
                      {urlInput && (
                        <button
                          type="button"
                          onClick={() => setUrlInput('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Safety Notice for URLs */}
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Safe Static Inspection Guarantee:</p>
                      <p className="mt-0.5 text-amber-800">
                        Satark Saathi analyzes URL syntax and patterns statically without visiting, following redirects, or executing remote web content. Unfamiliar domains are never condemned solely for being new.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: IMAGE / OCR */}
              {activeTab === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Upload Screenshot (SMS, WhatsApp, Payment, or Notice)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Accepted formats: JPG, PNG, WebP (up to 10 MB).
                    </p>

                    {!imageFile ? (
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50"
                      >
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800">Click to upload screenshot</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">or drag and drop here</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {imagePreview && (
                            <img
                              src={imagePreview}
                              alt="Screenshot preview"
                              className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                            />
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{imageFile.name}</p>
                            <p className="text-[11px] text-slate-500">{(imageFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="text-xs px-2.5 py-1 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            aria-label="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Editable OCR text area */}
                  <div>
                    <label htmlFor="ocr-text-input" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Extracted Text / OCR Review
                    </label>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      If automated OCR is unavailable or partially inaccurate, you can paste or refine the screenshot text below:
                    </p>
                    <textarea
                      id="ocr-text-input"
                      rows={3}
                      value={imageOcrText}
                      onChange={(e) => setImageOcrText(e.target.value)}
                      placeholder="Extracted text from screenshot will appear here, or you can paste the text directly..."
                      className="w-full p-2.5 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:outline-teal-700 focus:border-teal-700 text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIO / VOICE */}
              {activeTab === 'audio' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Upload Audio Evidence (Voice Note or Call Recording)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Supported formats: MP3, WAV, M4A, OGG, AAC (up to 25 MB).
                    </p>

                    {!audioFile ? (
                      <div
                        onClick={() => audioInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50"
                      >
                        <input
                          ref={audioInputRef}
                          type="file"
                          accept=".mp3,.wav,.m4a,.ogg,.aac,audio/*"
                          onChange={handleAudioChange}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-2">
                          <Mic className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800">Upload voice recording</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Attach call audio or WhatsApp voice memo</p>
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                            <Mic className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{audioFile.name}</p>
                            <p className="text-[11px] text-slate-500">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            className="text-xs px-2.5 py-1 text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveAudio}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            aria-label="Remove audio"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <input
                            ref={audioInputRef}
                            type="file"
                            accept=".mp3,.wav,.m4a,.ogg,.aac,audio/*"
                            onChange={handleAudioChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Speech recognition capability status notice */}
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Info className="w-4 h-4 text-blue-700" />
                      <span>Speech Recognition Capability Notice:</span>
                    </div>
                    <p className="text-blue-800 leading-relaxed text-[11px]">
                      Local offline speech recognition (OpenAI Whisper) is attempted for uploaded audio files. Live phone calls are never tapped or recorded. You can also paste or edit the spoken transcript below for scam-risk analysis.
                    </p>
                  </div>

                  {/* Editable Audio Transcript Area */}
                  <div>
                    <label htmlFor="audio-transcript-input" className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Call / Voice Note Transcript <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="audio-transcript-input"
                      rows={4}
                      value={audioTranscript}
                      onChange={(e) => setAudioTranscript(e.target.value)}
                      placeholder="Type or paste what the caller said (e.g. 'This is Officer Sharma from Crime Branch. Do not disconnect the call or tell your family...')"
                      className="w-full p-3 text-xs bg-slate-50/60 border border-slate-300 rounded-lg focus:bg-white focus:outline-teal-700 focus:border-teal-700 text-slate-900 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Actions & Submit Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Reset Workspace
                </button>

                <button
                  type="submit"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
                >
                  {analyzing ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Threat Indicators...</span>
                    </>
                  ) : (
                    <>
                      <ScanSearch className="w-4 h-4" />
                      <span>Analyze Threat</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Session History Drawer */}
          {recentAnalyses.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Recent Scans in this Session</span>
                </span>
                <span className="text-[11px] text-slate-400">{recentAnalyses.length} recorded</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {recentAnalyses.map((scan) => (
                  <div
                    key={scan.incident_id}
                    onClick={() => setCurrentAnalysis(scan)}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded cursor-pointer transition-colors"
                  >
                    <div className="truncate flex-1">
                      <p className="font-semibold text-slate-800 truncate">{scan.verdict}</p>
                      <p className="text-[11px] text-slate-400 truncate font-mono">{scan.incident_id}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded ${
                        scan.risk_level === 'CRITICAL' || scan.risk_level === 'HIGH'
                          ? 'bg-red-100 text-red-800'
                          : scan.risk_level === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {scan.risk_score}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Investigation View Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {currentAnalysis ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
              {/* Prominent Risk Banner */}
              {(() => {
                const colors = getRiskColor(currentAnalysis.risk_level);
                return (
                  <div className={`p-4 border-b ${colors.border} ${colors.bg}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs font-black uppercase tracking-wider rounded text-white ${colors.badgeBg}`}>
                            {currentAnalysis.risk_level} RISK
                          </span>
                          {currentAnalysis.policy_tier && (
                            <span className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded border ${
                              currentAnalysis.policy_tier === 'RED'
                                ? 'bg-red-50 text-red-700 border-red-300'
                                : currentAnalysis.policy_tier === 'AMBER'
                                ? 'bg-amber-50 text-amber-700 border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            }`}>
                              Tier: {currentAnalysis.policy_tier}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-500">
                            Confidence: {currentAnalysis.confidence_label}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                          {currentAnalysis.verdict}
                        </h3>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          {currentAnalysis.risk_score}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">/100</span>
                        <p className="text-[10px] text-slate-400 font-sans uppercase">Risk Score</p>
                      </div>
                    </div>

                    {/* Risk Meter Bar */}
                    <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full ${colors.meter} transition-all duration-500`}
                        style={{ width: `${Math.max(currentAnalysis.risk_score, 5)}%` }}
                      ></div>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                      *Heuristic signal indicator based on weighted threat vectors and counter-signals. Not a calibrated probability.
                    </p>
                  </div>
                );
              })()}

              <div className="p-5 space-y-4 text-xs">
                {/* Plain-Language Summary */}
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-1 text-[11px]">
                    Plain-Language Assessment
                  </h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    {currentAnalysis.plain_language_summary}
                  </p>
                  {currentAnalysis.policy_tier === 'GREEN' && (
                    <p className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2 leading-relaxed">
                      <strong>Tier GREEN Advisory:</strong> No sufficiently strong threat indicators were detected in this message. This does <em>not</em> guarantee that the communication or sender is safe or authentic. Always exercise digital vigilance and never disclose OTPs, PINs, or credentials.
                    </p>
                  )}
                </div>

                {/* Recommended Proportionate Action */}
                {currentAnalysis.recommended_action && (
                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-200">
                    <div className="flex items-center gap-1.5 font-bold text-teal-900 text-[11px] uppercase tracking-wider mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                      <span>Recommended Next Step</span>
                    </div>
                    <p className="text-teal-950 font-medium text-xs leading-relaxed">
                      {currentAnalysis.recommended_action}
                    </p>
                  </div>
                )}

                {/* Detected Manipulation Tactics */}
                {currentAnalysis.detected_signals.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px] flex items-center justify-between">
                      <span>Detected Psychological & Forensic Tactics</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(currentAnalysis.detected_signals.map((s) => s.signal_type.replace('COUNTER_', '')))).map(
                        (tactic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200"
                          >
                            {tactic.replace(/_/g, ' ')}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Highlighted Evidence Breakdown */}
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px] flex items-center justify-between">
                    <span>Evidence & Threat Indicators</span>
                    <span className="text-slate-500 font-normal">
                      {currentAnalysis.detected_signals.length} signals evaluated
                    </span>
                  </h4>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {currentAnalysis.detected_signals.length === 0 ? (
                      <p className="text-slate-500 p-3 bg-slate-50 rounded border border-slate-200 text-center">
                        No malicious threat indicators detected.
                      </p>
                    ) : (
                      currentAnalysis.detected_signals.map((sig, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs ${
                            sig.weight < 0
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                              : sig.severity === 'HIGH'
                              ? 'bg-red-50/50 border-red-200 text-red-950'
                              : 'bg-amber-50/50 border-amber-200 text-amber-950'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold text-[11px]">
                            <span className="flex items-center gap-1.5">
                              {sig.weight < 0 ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              )}
                              <span>{sig.signal_type.replace(/_/g, ' ')}</span>
                            </span>
                            <span
                              className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${
                                sig.weight < 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {sig.weight > 0 ? `+${sig.weight}` : `${sig.weight}`}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-700 leading-relaxed">{sig.reason}</p>
                          {sig.excerpt && (
                            <p className="mt-1 font-mono text-[10px] text-slate-500 bg-white/70 p-1 rounded border border-slate-200 truncate">
                              "{sig.excerpt}"
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Counter-Signals & Legitimacy Indicators */}
                {currentAnalysis.counter_signals && currentAnalysis.counter_signals.length > 0 && (
                  <div>
                    <h4 className="font-bold text-emerald-900 uppercase tracking-wider mb-2 text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Observed Legitimacy Indicators ({currentAnalysis.counter_signals.length})</span>
                      </span>
                    </h4>
                    <div className="space-y-1.5">
                      {currentAnalysis.counter_signals.map((cs, i) => (
                        <div key={i} className="p-2 rounded bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950">
                          <p className="font-medium text-[11px]">{cs.reason}</p>
                          {cs.excerpt && (
                            <p className="mt-1 font-mono text-[10px] text-emerald-800 bg-white/70 p-1 rounded border border-emerald-100 truncate">
                              "{cs.excerpt}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Immediate Protective Actions */}
                {currentAnalysis.recommended_actions.length > 0 && (
                  <div>
                    <h4 className="font-bold text-teal-950 uppercase tracking-wider mb-2 text-[11px]">
                      Immediate Protective Actions
                    </h4>
                    <ul className="space-y-1.5">
                      {currentAnalysis.recommended_actions.map((act, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 p-2 rounded bg-teal-50/60 border border-teal-200 text-teal-950 text-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 flex-shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Independent Verification Steps */}
                {currentAnalysis.verification_steps.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2 text-[11px]">
                      Independent Verification Steps
                    </h4>
                    <ul className="space-y-1 text-slate-700">
                      {currentAnalysis.verification_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <span className="font-bold text-slate-400">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Primary Safety Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  {currentAnalysis.should_alert_family && (
                    <button
                      type="button"
                      onClick={() => setIsAlertModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Alert Family Shield Guardians</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleEscalateToRecovery}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
                  >
                    <LifeBuoy className="w-3.5 h-3.5 text-teal-700" />
                    <span>File Golden Hour Incident Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyFullReport}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {copiedReport ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Report Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Full Investigation Report</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Progressive Disclosure: Technical Details */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-700 py-1"
                  >
                    <span className="font-medium flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Technical Metadata & Model Boundaries</span>
                    </span>
                    {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showTechnicalDetails && (
                    <div className="mt-2 p-3 rounded bg-slate-50 border border-slate-200 space-y-2 text-[11px] text-slate-600 font-mono">
                      <div>
                        <span className="text-slate-400">Incident ID: </span>
                        <span className="text-slate-800">{currentAnalysis.incident_id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Input Type: </span>
                        <span className="text-slate-800 uppercase">{currentAnalysis.input_type}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Analysis Mode: </span>
                        <span className="text-slate-800">{currentAnalysis.analysis_mode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">AI Provider: </span>
                        <span className="text-slate-800">{currentAnalysis.ai_provider}</span>
                      </div>
                      {currentAnalysis.reason_codes && currentAnalysis.reason_codes.length > 0 && (
                        <div>
                          <span className="text-slate-400">Stable Reason Codes: </span>
                          <span className="text-slate-800 text-[10px] font-mono break-all">
                            {currentAnalysis.reason_codes.join(', ')}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Verification Boundary: </span>
                        <span className="text-slate-700 font-sans text-[10px] block mt-0.5">
                          Deterministic content heuristics only. External live telecom registries, bank payee lookups, and cybercrime portal filings were not queried.
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200 font-sans text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700 text-[10px] uppercase">Engine Limitations:</p>
                        {currentAnalysis.limitations.map((lim, i) => (
                          <p key={i} className="text-[10px] leading-tight">• {lim}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Safety Disclaimer */}
                <div className="p-2.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-slate-500 leading-relaxed">
                  <strong>Security Notice:</strong> All submitted inputs are treated as untrusted data. Satark Saathi never executes remote links or files. A low-risk assessment does not guarantee complete safety. When in doubt, verify independently.
                </div>
              </div>
            </div>
          ) : (
            /* Idle Placeholder */
            <div className="p-8 bg-white rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <ScanSearch className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Scan Results will Appear Here</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs leading-relaxed">
                Paste any suspicious text, URL, screenshot, or call transcript, or select one of the test presets on the left to begin forensic risk evaluation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Family Shield Alert Dispatch Modal */}
      {isAlertModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Dispatch Family Shield Emergency Alert</span>
            </div>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">
              Select which trusted family contacts should receive an instant alert with protective instructions:
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto mb-4 border border-slate-200 rounded-lg p-2 bg-slate-50">
              {contacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center gap-2.5 p-2 rounded bg-white border border-slate-200 hover:border-slate-300 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContacts([...selectedContacts, contact.id]);
                      } else {
                        setSelectedContacts(selectedContacts.filter((id) => id !== contact.id));
                      }
                    }}
                    className="rounded text-teal-800 focus:ring-teal-700"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-slate-900">{contact.name}</span>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-normal">({contact.relationship})</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{contact.phone_number}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={alertSending || selectedContacts.length === 0}
                onClick={handleDispatchFamilyAlert}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg shadow-sm"
              >
                {alertSending ? 'Sending...' : `Send to ${selectedContacts.length} Contacts`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
