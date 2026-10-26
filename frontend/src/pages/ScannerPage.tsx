import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Scan,
  Flash,
  WarningFilled,
  WarningAltFilled,
  Renew,
  CheckmarkFilled,
  Share,
  Help,
  Time,
  Link,
  Document,
  Image as ImageIcon,
  Microphone,
  Upload,
  Close,
  Copy,
  Checkmark,
  ChevronDown,
  ChevronUp,
  Information,
  Security,
  Chip,
} from '@carbon/icons-react';
import {
  Tile,
  Button,
  Tag,
  Modal,
  InlineLoading,
  ProgressBar,
} from '@carbon/react';
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

    api.getPresets().then(setPresets).catch(() => {});
    api.getContacts().then((data) => {
      setContacts(data);
      setSelectedContacts(data.filter((c) => c.is_active).map((c) => c.id));
    }).catch(() => {});
  }, [location.state]);

  const handleSelectPreset = (preset: PresetSample) => {
    setActiveTab('text');
    setText(preset.text);
    setChannel(preset.channel);
  };

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

  const handleReset = () => {
    if (activeTab === 'text') setText('');
    if (activeTab === 'url') setUrlInput('');
    if (activeTab === 'image') handleRemoveImage();
    if (activeTab === 'audio') handleRemoveAudio();
  };

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
          result = await api.analyzeText(imageOcrText.trim(), 'IMAGE');
          result.input_type = 'image';
        }
      } else {
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

  const getRiskTagType = (level: string): 'red' | 'warm-gray' | 'green' => {
    if (level === 'CRITICAL' || level === 'HIGH') return 'red';
    if (level === 'MEDIUM') return 'warm-gray';
    return 'green';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="border-b border-[#e0e0e0] pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#161616] tracking-tight">
              Scam Intelligence Engine
            </h1>
            <Tag type="blue" size="sm">Evidence-Based Forensic Detection</Tag>
          </div>
          <p className="text-xs text-[#525252] mt-1">
            Analyze suspicious messages, URLs, screenshots, and call transcripts for Indian social-engineering threats.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#161616] bg-white px-3 py-1.5 border border-[#e0e0e0]">
          <Chip size={16} className="text-[#0f62fe]" />
          <span>IBM watsonx.ai Granite Ready</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#24a148]"></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Preset scenarios bar */}
          <Tile className="bg-white p-4 border border-[#e0e0e0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#161616] uppercase tracking-wider flex items-center gap-1.5">
                <Flash size={16} className="text-[#0f62fe]" />
                <span>Test Common Indian Scam Scenarios</span>
              </span>
              <span className="text-[11px] text-[#8d8d8d]">Click to autofill</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1 text-xs font-medium border border-[#e0e0e0] bg-[#f4f4f4] hover:bg-[#edf5ff] hover:border-[#0f62fe] text-[#161616] transition-colors text-left cursor-pointer"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </Tile>

          {/* Unified Workspace Container */}
          <Tile className="bg-white p-0 border border-[#e0e0e0] overflow-hidden">
            {/* 4 Input Method Tabs */}
            <div className="flex border-b border-[#e0e0e0] bg-[#f4f4f4] p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-white text-[#0f62fe] border-b-2 border-b-[#0f62fe] font-semibold'
                    : 'text-[#525252] hover:text-[#161616] hover:bg-white/60'
                }`}
              >
                <Document size={16} />
                <span>Text / SMS</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'url'
                    ? 'bg-white text-[#0f62fe] border-b-2 border-b-[#0f62fe] font-semibold'
                    : 'text-[#525252] hover:text-[#161616] hover:bg-white/60'
                }`}
              >
                <Link size={16} />
                <span>URL / Domain</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'image'
                    ? 'bg-white text-[#0f62fe] border-b-2 border-b-[#0f62fe] font-semibold'
                    : 'text-[#525252] hover:text-[#161616] hover:bg-white/60'
                }`}
              >
                <ImageIcon size={16} />
                <span>Screenshot (OCR)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === 'audio'
                    ? 'bg-white text-[#0f62fe] border-b-2 border-b-[#0f62fe] font-semibold'
                    : 'text-[#525252] hover:text-[#161616] hover:bg-white/60'
                }`}
              >
                <Microphone size={16} />
                <span>Voice Evidence</span>
              </button>
            </div>

            {/* Input Form Body */}
            <form onSubmit={handleAnalyze} className="p-5 space-y-4">
              {/* TAB 1: TEXT */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label htmlFor="text-input" className="text-xs font-semibold text-[#161616] uppercase tracking-wider">
                      Suspicious Message Content
                    </label>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#525252] text-[11px]">Channel:</span>
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value as ChannelType)}
                        className="px-2.5 py-1 bg-[#f4f4f4] border border-[#e0e0e0] text-xs font-medium text-[#161616] focus:outline-none focus:border-[#0f62fe]"
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
                      className="w-full p-3.5 text-sm bg-[#f4f4f4] border border-[#e0e0e0] focus:bg-white focus:outline-none focus:border-[#0f62fe] text-[#161616] leading-relaxed placeholder:text-[#8d8d8d] resize-y"
                    />
                    {text && (
                      <button
                        type="button"
                        onClick={() => setText('')}
                        className="absolute top-2.5 right-2.5 px-2 py-0.5 text-xs text-[#525252] hover:text-[#161616] bg-white border border-[#e0e0e0] cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#8d8d8d] font-mono">
                    <span>{text.length} characters (min 5, max 10,000)</span>
                    {text.length > 8000 && (
                      <span className="text-[#da1e28] font-sans font-medium">Approaching maximum length limit</span>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: URL */}
              {activeTab === 'url' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="url-input" className="text-xs font-semibold text-[#161616] uppercase tracking-wider block mb-1">
                      Suspicious URL / Web Link
                    </label>
                    <p className="text-xs text-[#525252] mb-2">
                      Inspect domain structure, misleading subdomains, TLD reputation, and shortener redirection.
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8d8d8d]">
                        <Link size={16} />
                      </div>
                      <input
                        id="url-input"
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://sbi-kyc-update.xyz/verify-login or bit.ly/free-prize"
                        className="w-full pl-9 pr-12 py-2.5 text-sm bg-[#f4f4f4] border border-[#e0e0e0] focus:bg-white focus:outline-none focus:border-[#0f62fe] text-[#161616] font-mono"
                      />
                      {urlInput && (
                        <button
                          type="button"
                          onClick={() => setUrlInput('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-[#8d8d8d] hover:text-[#161616] cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Safety Notice for URLs */}
                  <div className="p-3.5 border-l-4 border-l-[#f1c21b] border border-[#e0e0e0] bg-[#f4f4f4] text-xs flex items-start gap-2.5">
                    <WarningAltFilled size={18} className="text-[#b28600] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#161616]">Safe Static Inspection Guarantee:</p>
                      <p className="mt-0.5 text-[#525252] leading-relaxed">
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
                    <label className="text-xs font-semibold text-[#161616] uppercase tracking-wider block mb-1">
                      Upload Screenshot (SMS, WhatsApp, Payment, or Notice)
                    </label>
                    <p className="text-xs text-[#525252] mb-2">
                      Accepted formats: JPG, PNG, WebP (up to 10 MB).
                    </p>

                    {!imageFile ? (
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        className="border-2 border-dashed border-[#8d8d8d] hover:border-[#0f62fe] p-6 text-center cursor-pointer transition-colors bg-[#f4f4f4] hover:bg-white"
                      >
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <div className="w-10 h-10 bg-[#edf5ff] text-[#0f62fe] flex items-center justify-center mx-auto mb-2 border border-[#d0e2ff]">
                          <Upload size={20} />
                        </div>
                        <p className="text-xs font-semibold text-[#161616]">Click to upload screenshot</p>
                        <p className="text-[11px] text-[#8d8d8d] mt-0.5">or drag and drop here</p>
                      </div>
                    ) : (
                      <div className="border border-[#e0e0e0] p-3 bg-[#f4f4f4] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {imagePreview && (
                            <img
                              src={imagePreview}
                              alt="Screenshot preview"
                              className="w-14 h-14 object-cover border border-[#e0e0e0]"
                            />
                          )}
                          <div>
                            <p className="text-xs font-semibold text-[#161616] truncate max-w-[200px]">{imageFile.name}</p>
                            <p className="text-[11px] text-[#525252]">{(imageFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            kind="ghost"
                            size="sm"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            Replace
                          </Button>
                          <Button
                            kind="ghost"
                            hasIconOnly
                            renderIcon={Close}
                            iconDescription="Remove image"
                            size="sm"
                            onClick={handleRemoveImage}
                          />
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

                  <div>
                    <label htmlFor="ocr-text-input" className="text-xs font-semibold text-[#161616] uppercase tracking-wider block mb-1">
                      Extracted Text / OCR Review
                    </label>
                    <p className="text-[11px] text-[#525252] mb-1.5">
                      If automated OCR is unavailable or partially inaccurate on the host, you can review or enter visible screenshot text below:
                    </p>
                    <textarea
                      id="ocr-text-input"
                      rows={3}
                      value={imageOcrText}
                      onChange={(e) => setImageOcrText(e.target.value)}
                      placeholder="Extracted text from screenshot will appear here, or you can paste the text directly..."
                      className="w-full p-3 text-xs bg-[#f4f4f4] border border-[#e0e0e0] focus:bg-white focus:outline-none focus:border-[#0f62fe] text-[#161616]"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: AUDIO / VOICE */}
              {activeTab === 'audio' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#161616] uppercase tracking-wider block mb-1">
                      Upload Audio Evidence (Voice Note or Call Recording)
                    </label>
                    <p className="text-xs text-[#525252] mb-2">
                      Supported formats: MP3, WAV, M4A, OGG, AAC (up to 25 MB).
                    </p>

                    {!audioFile ? (
                      <div
                        onClick={() => audioInputRef.current?.click()}
                        className="border-2 border-dashed border-[#8d8d8d] hover:border-[#0f62fe] p-5 text-center cursor-pointer transition-colors bg-[#f4f4f4] hover:bg-white"
                      >
                        <input
                          ref={audioInputRef}
                          type="file"
                          accept=".mp3,.wav,.m4a,.ogg,.aac,audio/*"
                          onChange={handleAudioChange}
                          className="hidden"
                        />
                        <div className="w-10 h-10 bg-[#edf5ff] text-[#0f62fe] flex items-center justify-center mx-auto mb-2 border border-[#d0e2ff]">
                          <Microphone size={20} />
                        </div>
                        <p className="text-xs font-semibold text-[#161616]">Upload voice recording</p>
                        <p className="text-[11px] text-[#8d8d8d] mt-0.5">Attach call audio or WhatsApp voice memo</p>
                      </div>
                    ) : (
                      <div className="border border-[#e0e0e0] p-3 bg-[#f4f4f4] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#edf5ff] text-[#0f62fe] flex items-center justify-center border border-[#d0e2ff]">
                            <Microphone size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#161616] truncate max-w-[200px]">{audioFile.name}</p>
                            <p className="text-[11px] text-[#525252]">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            kind="ghost"
                            size="sm"
                            onClick={() => audioInputRef.current?.click()}
                          >
                            Replace
                          </Button>
                          <Button
                            kind="ghost"
                            hasIconOnly
                            renderIcon={Close}
                            iconDescription="Remove audio"
                            size="sm"
                            onClick={handleRemoveAudio}
                          />
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
                  <div className="p-3.5 border-l-4 border-l-[#0f62fe] border border-[#e0e0e0] bg-[#f4f4f4] text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-[#161616]">
                      <Information size={18} className="text-[#0f62fe]" />
                      <span>Speech Recognition Capability Notice:</span>
                    </div>
                    <p className="text-[#525252] leading-relaxed text-[11px]">
                      Local offline speech recognition (OpenAI Whisper tiny) transcribes uploaded audio files safely on your local device. Live calls are never intercepted. You can also paste or edit the spoken transcript below for scam-risk analysis.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="audio-transcript-input" className="text-xs font-semibold text-[#161616] uppercase tracking-wider block mb-1">
                      Call / Voice Note Transcript <span className="text-[#da1e28]">*</span>
                    </label>
                    <textarea
                      id="audio-transcript-input"
                      rows={4}
                      value={audioTranscript}
                      onChange={(e) => setAudioTranscript(e.target.value)}
                      placeholder="Type or paste what the caller said (e.g. 'This is Officer Sharma from Crime Branch. Do not disconnect the call or tell your family...')"
                      className="w-full p-3 text-xs bg-[#f4f4f4] border border-[#e0e0e0] focus:bg-white focus:outline-none focus:border-[#0f62fe] text-[#161616] leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Actions & Submit Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-[#e0e0e0]">
                <Button
                  kind="ghost"
                  size="sm"
                  onClick={handleReset}
                >
                  Reset Workspace
                </Button>

                <Button
                  kind="primary"
                  size="md"
                  type="submit"
                  disabled={analyzing}
                  renderIcon={analyzing ? undefined : Scan}
                >
                  {analyzing ? (
                    <InlineLoading description="Analyzing Threat Indicators..." />
                  ) : (
                    'Analyze Threat'
                  )}
                </Button>
              </div>
            </form>
          </Tile>

          {/* Session History Drawer */}
          {recentAnalyses.length > 0 && (
            <Tile className="bg-white p-4 border border-[#e0e0e0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#161616] uppercase tracking-wider flex items-center gap-1.5">
                  <Time size={16} className="text-[#0f62fe]" />
                  <span>Recent Scans in this Session</span>
                </span>
                <span className="text-[11px] text-[#8d8d8d]">{recentAnalyses.length} recorded</span>
              </div>
              <div className="divide-y divide-[#e0e0e0] text-xs">
                {recentAnalyses.map((scan) => (
                  <div
                    key={scan.incident_id}
                    onClick={() => setCurrentAnalysis(scan)}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-[#f4f4f4] px-2 cursor-pointer transition-colors"
                  >
                    <div className="truncate flex-1">
                      <p className="font-semibold text-[#161616] truncate">{scan.verdict}</p>
                      <p className="text-[11px] text-[#8d8d8d] truncate font-mono">{scan.incident_id}</p>
                    </div>
                    <Tag
                      type={getRiskTagType(scan.risk_level)}
                      size="sm"
                    >
                      {scan.risk_score}/100
                    </Tag>
                  </div>
                ))}
              </div>
            </Tile>
          )}
        </div>

        {/* Right Column: Investigation View Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {currentAnalysis ? (
            <Tile className="bg-white p-0 border border-[#e0e0e0] overflow-hidden">
              {/* Prominent Risk Banner */}
              <div
                className={`p-5 border-b border-[#e0e0e0] ${
                  currentAnalysis.risk_level === 'CRITICAL' || currentAnalysis.risk_level === 'HIGH'
                    ? 'bg-[#fff1f1] border-l-4 border-l-[#da1e28]'
                    : currentAnalysis.risk_level === 'MEDIUM'
                    ? 'bg-[#fef7e0] border-l-4 border-l-[#f1c21b]'
                    : 'bg-[#edfcf2] border-l-4 border-l-[#24a148]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag
                        type={getRiskTagType(currentAnalysis.risk_level)}
                        size="md"
                        className="font-bold uppercase tracking-wider"
                      >
                        {currentAnalysis.risk_level} RISK
                      </Tag>
                      {currentAnalysis.policy_tier && (
                        <Tag
                          type={
                            currentAnalysis.policy_tier === 'RED'
                              ? 'red'
                              : currentAnalysis.policy_tier === 'AMBER'
                              ? 'warm-gray'
                              : 'green'
                          }
                          size="sm"
                        >
                          Tier: {currentAnalysis.policy_tier}
                        </Tag>
                      )}
                      <span className="text-[11px] font-mono text-[#525252]">
                        Confidence: {currentAnalysis.confidence_label}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#161616] mt-2 leading-snug">
                      {currentAnalysis.verdict}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-2xl font-bold text-[#161616] font-mono">
                      {currentAnalysis.risk_score}
                    </span>
                    <span className="text-xs text-[#525252] font-mono">/100</span>
                    <p className="text-[10px] text-[#8d8d8d] font-sans uppercase">Risk Score</p>
                  </div>
                </div>

                <div className="mt-3">
                  <ProgressBar
                    value={currentAnalysis.risk_score}
                    max={100}
                    label=""
                    hideLabel
                    status={
                      currentAnalysis.risk_level === 'CRITICAL' || currentAnalysis.risk_level === 'HIGH'
                        ? 'error'
                        : 'active'
                    }
                  />
                </div>

                <p className="text-[10px] text-[#525252] mt-1.5 leading-relaxed">
                  *Heuristic signal indicator based on weighted threat vectors and counter-signals. Not a calibrated probability.
                </p>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Plain-Language Summary */}
                <div>
                  <h4 className="font-semibold text-[#161616] uppercase tracking-wider mb-1 text-[11px]">
                    Plain-Language Assessment
                  </h4>
                  <p className="text-[#161616] leading-relaxed bg-[#f4f4f4] p-3 border border-[#e0e0e0] text-xs">
                    {currentAnalysis.plain_language_summary}
                  </p>
                  {currentAnalysis.policy_tier === 'GREEN' && (
                    <p className="mt-2 text-[11px] text-[#0e6027] bg-[#edfcf2] border border-[#a7f0ba] p-2.5 leading-relaxed">
                      <strong>Tier GREEN Advisory:</strong> No sufficiently strong threat indicators were detected in this message. This does <em>not</em> guarantee that the communication or sender is safe or authentic. Always exercise digital vigilance and never disclose OTPs, PINs, or credentials.
                    </p>
                  )}
                </div>

                {/* Recommended Proportionate Action */}
                {currentAnalysis.recommended_action && (
                  <div className="p-3.5 bg-[#edf5ff] border border-[#d0e2ff]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#0f62fe] text-[11px] uppercase tracking-wider mb-1">
                      <CheckmarkFilled size={16} />
                      <span>Recommended Next Step</span>
                    </div>
                    <p className="text-[#002d9c] font-medium text-xs leading-relaxed">
                      {currentAnalysis.recommended_action}
                    </p>
                  </div>
                )}

                {/* Detected Manipulation Tactics */}
                {currentAnalysis.detected_signals.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#161616] uppercase tracking-wider mb-2 text-[11px]">
                      Detected Psychological & Forensic Tactics
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(currentAnalysis.detected_signals.map((s) => s.signal_type.replace('COUNTER_', '')))).map(
                        (tactic, idx) => (
                          <Tag key={idx} type="cool-gray" size="sm">
                            {tactic.replace(/_/g, ' ')}
                          </Tag>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Highlighted Evidence Breakdown */}
                <div>
                  <h4 className="font-semibold text-[#161616] uppercase tracking-wider mb-2 text-[11px] flex items-center justify-between">
                    <span>Evidence & Threat Indicators</span>
                    <span className="text-[#525252] font-normal">
                      {currentAnalysis.detected_signals.length} signals evaluated
                    </span>
                  </h4>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {currentAnalysis.detected_signals.length === 0 ? (
                      <p className="text-[#525252] p-3 bg-[#f4f4f4] border border-[#e0e0e0] text-center">
                        No malicious threat indicators detected.
                      </p>
                    ) : (
                      currentAnalysis.detected_signals.map((sig, idx) => (
                        <div
                          key={idx}
                          className={`p-3 border text-xs ${
                            sig.weight < 0
                              ? 'bg-[#edfcf2] border-[#a7f0ba] text-[#0e6027]'
                              : sig.severity === 'HIGH'
                              ? 'bg-[#fff1f1] border-[#ffb3b8] text-[#750e13]'
                              : 'bg-[#fef7e0] border-[#f1c21b] text-[#483700]'
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold text-[11px]">
                            <span className="flex items-center gap-1.5">
                              {sig.weight < 0 ? (
                                <CheckmarkFilled size={16} className="text-[#24a148]" />
                              ) : (
                                <WarningFilled size={16} className="text-[#da1e28]" />
                              )}
                              <span>{sig.signal_type.replace(/_/g, ' ')}</span>
                            </span>
                            <span
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                                sig.weight < 0 ? 'bg-[#a7f0ba] text-[#0e6027]' : 'bg-[#e0e0e0] text-[#161616]'
                              }`}
                            >
                              {sig.weight > 0 ? `+${sig.weight}` : `${sig.weight}`}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#161616] leading-relaxed">{sig.reason}</p>
                          {sig.excerpt && (
                            <p className="mt-1.5 font-mono text-[10px] text-[#525252] bg-white/90 p-1.5 border border-[#e0e0e0] truncate">
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
                    <h4 className="font-semibold text-[#0e6027] uppercase tracking-wider mb-2 text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckmarkFilled size={16} className="text-[#24a148]" />
                        <span>Observed Legitimacy Indicators ({currentAnalysis.counter_signals.length})</span>
                      </span>
                    </h4>
                    <div className="space-y-1.5">
                      {currentAnalysis.counter_signals.map((cs, i) => (
                        <div key={i} className="p-2.5 bg-[#edfcf2] border border-[#a7f0ba] text-xs text-[#0e6027]">
                          <p className="font-medium text-[11px]">{cs.reason}</p>
                          {cs.excerpt && (
                            <p className="mt-1 font-mono text-[10px] text-[#0e6027] bg-white/90 p-1 border border-[#a7f0ba] truncate">
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
                    <h4 className="font-semibold text-[#161616] uppercase tracking-wider mb-2 text-[11px]">
                      Immediate Protective Actions
                    </h4>
                    <ul className="space-y-1.5">
                      {currentAnalysis.recommended_actions.map((act, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 p-2.5 bg-[#edf5ff] border border-[#d0e2ff] text-[#002d9c] text-xs leading-relaxed"
                        >
                          <CheckmarkFilled size={16} className="text-[#0f62fe] shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Independent Verification Steps */}
                {currentAnalysis.verification_steps.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-[#161616] uppercase tracking-wider mb-2 text-[11px]">
                      Independent Verification Steps
                    </h4>
                    <ul className="space-y-1 text-[#161616]">
                      {currentAnalysis.verification_steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <span className="font-bold text-[#8d8d8d]">•</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Primary Safety Buttons */}
                <div className="pt-3 border-t border-[#e0e0e0] flex flex-col gap-2">
                  {currentAnalysis.should_alert_family && (
                    <Button
                      kind="danger"
                      size="md"
                      renderIcon={Share}
                      onClick={() => setIsAlertModalOpen(true)}
                    >
                      Alert Family Shield Guardians
                    </Button>
                  )}

                  <Button
                    kind="tertiary"
                    size="md"
                    renderIcon={Help}
                    onClick={handleEscalateToRecovery}
                  >
                    File Golden Hour Incident Report
                  </Button>

                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={copiedReport ? Checkmark : Copy}
                    onClick={handleCopyFullReport}
                  >
                    {copiedReport ? 'Report Copied to Clipboard' : 'Copy Full Investigation Report'}
                  </Button>
                </div>

                {/* Progressive Disclosure: Technical Details */}
                <div className="pt-2 border-t border-[#e0e0e0]">
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="w-full flex items-center justify-between text-[11px] text-[#525252] hover:text-[#161616] py-1 cursor-pointer"
                  >
                    <span className="font-medium flex items-center gap-1.5">
                      <Chip size={16} />
                      <span>Technical Metadata & Model Boundaries</span>
                    </span>
                    {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showTechnicalDetails && (
                    <div className="mt-2 p-3.5 bg-[#f4f4f4] border border-[#e0e0e0] space-y-2 text-[11px] text-[#525252] font-mono">
                      <div>
                        <span className="text-[#8d8d8d]">Incident ID: </span>
                        <span className="text-[#161616] font-semibold">{currentAnalysis.incident_id}</span>
                      </div>
                      <div>
                        <span className="text-[#8d8d8d]">Input Type: </span>
                        <span className="text-[#161616] uppercase">{currentAnalysis.input_type}</span>
                      </div>
                      <div>
                        <span className="text-[#8d8d8d]">Analysis Mode: </span>
                        <span className="text-[#161616]">{currentAnalysis.analysis_mode}</span>
                      </div>
                      <div>
                        <span className="text-[#8d8d8d]">AI Provider: </span>
                        <span className="text-[#161616]">{currentAnalysis.ai_provider}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Tile>
          ) : (
            <Tile className="bg-white p-8 border border-[#e0e0e0] text-center">
              <Security size={40} className="text-[#0f62fe] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#161616]">Awaiting Input to Inspect</h3>
              <p className="text-xs text-[#525252] mt-1 max-w-xs mx-auto leading-relaxed">
                Choose an input tab on the left or select a sample scenario to generate a complete forensic threat report.
              </p>
            </Tile>
          )}
        </div>
      </div>

      {/* Family Alert Modal */}
      {isAlertModalOpen && (
        <Modal
          open={isAlertModalOpen}
          modalHeading="Dispatch Family Shield Alert"
          primaryButtonText={alertSending ? 'Dispatching...' : 'Confirm Dispatch'}
          secondaryButtonText="Cancel"
          onRequestSubmit={handleDispatchFamilyAlert}
          onRequestClose={() => setIsAlertModalOpen(false)}
          danger
          size="sm"
        >
          <div className="space-y-3 text-xs text-[#161616] pt-2">
            <p className="text-[#525252]">
              Select which trusted guardians should receive immediate emergency push notifications regarding this threat:
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {contacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center gap-2.5 p-2 bg-[#f4f4f4] border border-[#e0e0e0] cursor-pointer"
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
                    className="cds--checkbox"
                  />
                  <div>
                    <span className="font-semibold text-[#161616]">{contact.name}</span>
                    <span className="text-[11px] text-[#525252] ml-1.5">({contact.relationship})</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
