import React, { useState, useEffect } from 'react';
import {
  User,
  Chip,
  Renew,
  TrashCan,
  Save,
  DataBase,
  Security,
  Settings,
} from '@carbon/icons-react';
import {
  Tile,
  Button,
  TextInput,
  Select,
  SelectItem,
} from '@carbon/react';
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
        <div className="border-b border-[#e0e0e0] pb-4">
          <h1 className="text-xl font-semibold text-[#161616]">Settings</h1>
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#e0e0e0] pb-4">
        <h1 className="text-xl font-semibold text-[#161616] tracking-tight">Platform Settings &amp; Profile</h1>
        <p className="text-xs text-[#525252] mt-1">
          Configure complainant profile, IBM watsonx.ai analysis bridge, and database seed states.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: User Profile Form (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Tile className="p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#161616] font-semibold text-sm border-b border-[#e0e0e0] pb-3">
              <User size={18} className="text-[#0f62fe]" />
              <span>Primary User Profile (Complainant)</span>
            </div>
            <p className="text-xs text-[#525252]">
              These details are automatically populated in the 1930 Cyber Crime and Bank Nodal dispute drafts.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <TextInput
                  id="profile-fullname"
                  labelText="Full Legal Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <TextInput
                    id="profile-phone"
                    labelText="Mobile Phone *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <TextInput
                    id="profile-city"
                    labelText="City / State"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <TextInput
                  id="profile-email"
                  labelText="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <TextInput
                  id="profile-bank"
                  labelText="Primary Banking Institution"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  kind="primary"
                  size="sm"
                  renderIcon={Save}
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </Tile>

          <SeniorModeCard />
          <DuressPhraseSettings />

          {/* Database Reset / Evaluation Tools */}
          <Tile className="p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[#161616] font-semibold text-sm border-b border-[#e0e0e0] pb-3">
              <DataBase size={18} className="text-[#0f62fe]" />
              <span>Demonstration &amp; Seed Data Controls</span>
            </div>
            <p className="text-xs text-[#525252] leading-relaxed">
              Switch between a brand new, empty account state and realistic pre-loaded Indian scam cases (Digital Arrest, Electricity Phishing).
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button
                kind="tertiary"
                size="md"
                renderIcon={Renew}
                className="flex-1"
                onClick={() => setIsSeedModalOpen(true)}
              >
                Restore Realistic Demo Data
              </Button>

              <Button
                kind="secondary"
                size="md"
                renderIcon={TrashCan}
                className="flex-1"
                onClick={() => setIsResetEmptyModalOpen(true)}
              >
                Test Clean Empty State
              </Button>
            </div>
          </Tile>
        </div>

        {/* Right Column: AI Engine & WatsonX Adapter Settings (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Tile className="p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-[#161616] font-semibold text-sm border-b border-[#e0e0e0] pb-3">
              <Chip size={18} className="text-[#0f62fe]" />
              <span>AI Analysis Engine &amp; IBM watsonx.ai Bridge</span>
            </div>

            <div className="p-3.5 bg-[#edf5ff] border-l-4 border-l-[#0f62fe] text-xs text-[#0043ce] leading-relaxed">
              <span className="font-semibold block mb-0.5 text-[#161616]">
                Optional IBM watsonx.ai adapter (offline heuristic default)
              </span>
              By default all analysis runs on the local, deterministic Satark rule engine — no IBM service is called. The watsonx.ai client is used only when both an API key and a project ID are configured and the provider is set to watsonx; credentials set here last only until the server restarts.
            </div>

            <form onSubmit={handleSaveAiSettings} className="space-y-4 text-xs">
              <div>
                <Select
                  id="settings-analysis-provider"
                  labelText="Active Analysis Provider"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                >
                  <SelectItem value="rule_based" text="Satark Heuristic Engine (Offline / Rapid Heuristics)" />
                  <SelectItem value="watsonx" text="IBM watsonx.ai Granite Model Adapter (Injectable)" />
                  <SelectItem value="bob" text="IBM Bob Runtime Adapter (configured in backend .env)" />
                </Select>
              </div>

              <div>
                <TextInput
                  id="settings-watsonx-key"
                  labelText="IBM Cloud API Key"
                  type="password"
                  value={watsonxApiKey}
                  onChange={(e) => setWatsonxApiKey(e.target.value)}
                  placeholder="Optional: Enter IBM Cloud watsonx API key"
                />
              </div>

              <div>
                <TextInput
                  id="settings-watsonx-project-id"
                  labelText="watsonx Project ID"
                  value={watsonxProjectId}
                  onChange={(e) => setWatsonxProjectId(e.target.value)}
                  placeholder="Optional: Enter watsonx Project GUID"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  kind="primary"
                  size="sm"
                  renderIcon={Save}
                  disabled={savingAi}
                >
                  {savingAi ? 'Saving...' : 'Update AI Engine Config'}
                </Button>
              </div>
            </form>
          </Tile>

          <IntegrationStatusPanel />

          <AdminConsole />

          {/* Platform Standards / Ethical Compliance Note */}
          <Tile className="p-6 shadow-sm space-y-2 text-xs text-[#525252]">
            <h4 className="font-semibold text-[#161616] uppercase tracking-wider text-[11px]">
              Credible Fintech &amp; Responsible AI Guardrails
            </h4>
            <ul className="space-y-1.5 list-disc list-inside text-[#525252] leading-relaxed text-[11px]">
              <li>Never invents live threat counts or claims fictitious direct links to police databases.</li>
              <li>Seed records are always visibly demarcated with demo data tags.</li>
              <li>Preserves strict zero-liability timing records under RBI customer protection frameworks.</li>
            </ul>
          </Tile>
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
