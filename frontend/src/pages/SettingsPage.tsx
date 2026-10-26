import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  Sparkles,
  RotateCcw,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { api } from '../api/endpoints';
import { UserProfile, SystemSettings } from '../api/types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useDemoMode } from '../context/DemoModeContext';
import { useToast } from '../context/ToastContext';
import { DuressPhraseSettings, IntegrationStatusPanel, SeniorModeCard } from '../components/settings/SafetySettingsPanels';
import { AdminConsole } from '../components/settings/AdminConsole';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const { isDemoMode, resetDatabase } = useDemoMode();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [bankName, setBankName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // WatsonX settings
  const [provider, setProvider] = useState('rule_based');
  const [watsonxApiKey, setWatsonxApiKey] = useState('');
  const [watsonxProjectId, setWatsonxProjectId] = useState('');
  const [savingAi, setSavingAi] = useState(false);

  // Reset confirmation modals
  const [isResetEmptyModalOpen, setIsResetEmptyModalOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [pData, sData] = await Promise.all([
        api.getProfile(),
        api.getSettings(),
      ]);
      setProfile(pData);
      setName(pData.full_name);
      setPhone(pData.phone_number);
      setEmail(pData.email || '');
      setCity(pData.city);
      setBankName(pData.bank_name);

      setSystemSettings(sData);
      setProvider(sData.analysis_provider);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load settings', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await api.updateProfile({
        full_name: name.trim(),
        phone_number: phone.trim(),
        email: email.trim() || undefined,
        city: city.trim(),
        bank_name: bankName.trim(),
      });
      setProfile(updated);
      showToast({ type: 'success', title: 'Profile Updated', message: 'User particulars saved successfully.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update failed', message: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAi(true);
    try {
      const updated = await api.updateSettings({
        analysis_provider: provider,
        watsonx_apikey: watsonxApiKey || undefined,
        watsonx_project_id: watsonxProjectId || undefined,
      });
      setSystemSettings(updated);
      showToast({
        type: 'success',
        title: 'Analysis Provider Updated',
        message: `Engine configured to ${provider === 'watsonx' ? 'IBM watsonx.ai Granite' : 'Satark Heuristic Engine'}.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update failed', message: err.message });
    } finally {
      setSavingAi(false);
    }
  };

  const handleResetToClean = async () => {
    try {
      await resetDatabase(false);
      setIsResetEmptyModalOpen(false);
      showToast({
        type: 'success',
        title: 'Database Reset to Clean State',
        message: 'All sample data cleared to evaluate new user onboarding experience.',
      });
      fetchSettings();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Reset failed', message: err.message });
    }
  };

  const handleResetToDemo = async () => {
    try {
      await resetDatabase(true);
      setIsSeedModalOpen(false);
      showToast({
        type: 'success',
        title: 'Demo Data Restored',
        message: 'Realistic Indian scam scenarios and recovery drafts loaded for evaluation.',
      });
      fetchSettings();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Restore failed', message: err.message });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Settings & Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure complainant profile, IBM watsonx.ai analysis bridge, and database seed states.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Profile Form (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <form onSubmit={handleSaveProfile} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-[#176B58]" />
              <span>Primary User Profile (Complainant)</span>
            </div>
            <p className="text-xs text-slate-500">
              These details are automatically populated in the 1930 Cyber Crime and Bank Nodal dispute drafts.
            </p>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City / State</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Primary Banking Institution</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#176B58] hover:bg-[#125243] disabled:opacity-50 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProfile ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          </form>

          <SeniorModeCard />
          <DuressPhraseSettings />

          {/* Database Reset / Evaluation Tools */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-[#176B58]" />
              <span>Demonstration &amp; Seed Data Controls</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Switch between a brand new, empty account state and realistic pre-loaded Indian scam cases (Digital Arrest, Electricity Phishing).
            </p>

            <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setIsSeedModalOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-[#176B58] bg-[#DCEDE5] hover:bg-teal-100/70 border border-teal-200 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Realistic Demo Data</span>
              </button>

              <button
                type="button"
                onClick={() => setIsResetEmptyModalOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Test Clean Empty State</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Engine & WatsonX Adapter Settings (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <form onSubmit={handleSaveAiSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-[#176B58]" />
              <span>AI Analysis Engine &amp; IBM watsonx.ai Bridge</span>
            </div>

            <div className="p-3.5 bg-[#DCEDE5] rounded-xl border border-teal-200 text-xs text-[#176B58] leading-relaxed">
              <span className="font-bold block mb-0.5 text-slate-900">Optional IBM watsonx.ai adapter (not active by default)</span>
              By default all analysis runs on the local, deterministic Satark rule engine — no IBM service is called. The watsonx.ai client is used only when both an API key and a project ID are configured and the provider is set to watsonx; credentials set here last only until the server restarts. See "Integration status" below for what is real vs simulated.
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Active Analysis Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                >
                  <option value="rule_based">Satark Heuristic Engine (Offline / Rapid Heuristics)</option>
                  <option value="watsonx">IBM watsonx.ai Granite Model Adapter (Injectable)</option>
                  <option value="bob">IBM Bob runtime adapter (key set in backend .env only)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">IBM Cloud API Key</label>
                <input
                  type="password"
                  value={watsonxApiKey}
                  onChange={(e) => setWatsonxApiKey(e.target.value)}
                  placeholder="Optional: Enter IBM Cloud watsonx API key"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">watsonx Project ID</label>
                <input
                  type="text"
                  value={watsonxProjectId}
                  onChange={(e) => setWatsonxProjectId(e.target.value)}
                  placeholder="Optional: Enter watsonx Project GUID"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingAi}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#176B58] hover:bg-[#125243] disabled:opacity-50 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingAi ? 'Saving...' : 'Update AI Engine Config'}</span>
                </button>
              </div>
            </div>
          </form>

          <IntegrationStatusPanel />

          <AdminConsole />

          {/* Platform Standards / Ethical Compliance Note */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Credible Fintech &amp; Responsible AI Guardrails
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-slate-600 leading-relaxed text-[11px]">
              <li>Never invents live threat counts or claims fictitious direct links to police databases.</li>
              <li>Seed records are always visibly demarcated with demo data tags.</li>
              <li>Preserves strict zero-liability timing records under RBI customer protection frameworks.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isResetEmptyModalOpen}
        title="Reset to Empty New User Workspace?"
        message="This will clear all analyzed messages, contacts, and recovery drafts so you can evaluate the platform from a brand new, empty user perspective."
        confirmLabel="Reset to Clean"
        isDangerous={true}
        onConfirm={handleResetToClean}
        onCancel={() => setIsResetEmptyModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={isSeedModalOpen}
        title="Load Realistic Sample Demo Records?"
        message="This will restore curated Indian scam scenarios (Digital Arrest, Electricity Phishing) and Family Shield alerts for demonstration."
        confirmLabel="Restore Demo Data"
        isDangerous={false}
        onConfirm={handleResetToDemo}
        onCancel={() => setIsSeedModalOpen(false)}
      />
    </div>
  );
};
