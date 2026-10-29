import React, { useEffect, useState } from 'react';
import {
  CheckmarkFilled,
  MisuseOutline,
  View,
  Locked,
  Plug,
  Help,
} from '@carbon/icons-react';
import { Tile, Toggle, TextInput, Checkbox, Button, Tag } from '@carbon/react';
import { api } from '../../api/endpoints';
import { DuressSettings, IntegrationStatus } from '../../api/types';
import { useToast } from '../../context/ToastContext';
import { useSeniorMode } from '../../context/SeniorModeContext';

export const SeniorModeCard: React.FC = () => {
  const { seniorMode, setSeniorMode } = useSeniorMode();
  return (
    <Tile className="p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-[#161616] font-semibold text-sm border-b border-[#e0e0e0] pb-3">
        <View size={18} className="text-[#0f62fe]" />
        <span>Senior Citizen High-Accessibility Mode</span>
      </div>
      <p className="text-xs text-[#525252] leading-relaxed">
        Larger text, high-contrast visual cues, minimum 44px tap targets, streamlined navigation, and rapid one-tap calls to 1930 and trusted family guardians.
        Selection persists locally on this device.
      </p>
      <div className="pt-2">
        <Toggle
          id="senior-mode-toggle"
          labelText="Senior Citizen Interface Optimization"
          labelA="Inactive"
          labelB="Active"
          toggled={seniorMode}
          onToggle={(checked) => setSeniorMode(checked)}
        />
      </div>
    </Tile>
  );
};

export const DuressPhraseSettings: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<DuressSettings | null>(null);
  const [phrase, setPhrase] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getDuressSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.setDuressPhrase(phrase, consent);
      setSettings(res);
      setPhrase('');
      setConsent(false);
      showToast({ type: 'success', title: 'Safety phrase saved', message: 'Only a protected hash is stored. Remember your phrase — it cannot be shown again.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Could not save phrase', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      setSettings(await api.disableDuressPhrase());
      showToast({ type: 'info', title: 'Safety phrase turned off', message: 'The stored hash was deleted.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Could not turn off', message: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Tile className="p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-[#161616] font-semibold text-sm border-b border-[#e0e0e0] pb-3">
        <Locked size={18} className="text-[#0f62fe]" />
        <span>Discreet Coercion Safety Phrase (Optional)</span>
      </div>
      <p className="text-xs text-[#525252] leading-relaxed">
        {settings?.how_it_works ||
          "If your secret phrase appears in your answer to the check-in question about what a payment is for, the app displays an ordinary 'family check needed' screen while quietly alerting your accepted guardians to contact you."}
      </p>
      <ul className="text-[11px] text-[#525252] list-disc pl-5 space-y-0.5">
        <li>Your phrase is never displayed again, never transmitted in plain text alerts, and never logged — only a cryptographically salted hash is stored.</li>
        <li>Guardians receive a generic &ldquo;Please call now&rdquo; without revealing the phrase.</li>
        <li>Requires at least one accepted guardian linked to your profile.</li>
      </ul>

      {settings && (
        <div className="flex items-center gap-2 pt-1">
          <Tag type={settings.enabled ? 'green' : 'gray'} size="sm">
            {settings.enabled ? 'Safety Phrase Active' : 'Not Configured'}
          </Tag>
          <span className="text-xs text-[#525252]">
            &bull; {settings.eligible_guardian_count} accepted guardian(s) linked
          </span>
        </div>
      )}

      {settings && settings.eligible_guardian_count === 0 && (
        <div className="p-3 bg-[#fdf3e1] border-l-4 border-l-[#f1c21b] text-xs text-[#161616]">
          No guardian has accepted your invitation yet, so a coercion alert cannot reach anyone.
        </div>
      )}

      <form onSubmit={save} className="space-y-3 text-xs pt-1">
        <div>
          <TextInput
            id="duress-phrase-input"
            labelText="Choose a phrase (2–8 words, something you would never say by accident)"
            type="password"
            autoComplete="off"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            minLength={8}
            maxLength={80}
            placeholder={settings?.enabled ? 'Enter replacement safety phrase' : 'e.g. silver river morning tea'}
          />
        </div>

        <Checkbox
          id="duress-consent-checkbox"
          labelText="I agree that when I use this phrase, Satark Saathi may discreetly ask my accepted guardians to call me and hold the payment for their review."
          checked={consent}
          onChange={(_, { checked }) => setConsent(checked)}
        />

        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            kind="primary"
            size="sm"
            disabled={busy || phrase.trim().length < 8 || !consent}
          >
            {settings?.enabled ? 'Replace phrase' : 'Turn on'}
          </Button>
          {settings?.enabled && (
            <Button
              type="button"
              kind="secondary"
              size="sm"
              disabled={busy}
              onClick={disable}
            >
              Turn off
            </Button>
          )}
        </div>
      </form>
    </Tile>
  );
};

export const IntegrationStatusPanel: React.FC = () => {
  const [data, setData] = useState<{ analysis_engine: string; integrations: IntegrationStatus[] } | null>(null);

  useEffect(() => {
    api.getIntegrationStatus().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;
  return (
    <Tile className="p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 text-[#161616] font-semibold text-sm border-b border-[#e0e0e0] pb-3">
        <Plug size={18} className="text-[#0f62fe]" />
        <span>Integration Status &amp; Real vs Simulated Transparency</span>
      </div>
      <p className="text-xs text-[#161616] flex items-center gap-1.5">
        <Help size={16} className="text-[#0f62fe]" /> Active analysis engine: <strong>{data.analysis_engine}</strong>
      </p>
      <ul className="space-y-2">
        {data.integrations.map((i) => (
          <li key={i.id} className="text-xs p-3 border border-[#e0e0e0] bg-[#f4f4f4]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[#161616]">{i.name}</span>
              <Tag
                type={
                  i.status === 'SIMULATED'
                    ? 'warm-gray'
                    : i.status === 'CONFIGURED_UNVERIFIED'
                    ? 'blue'
                    : i.status === 'BLOCKED_BY_EXTERNAL_CONFIGURATION'
                    ? 'red'
                    : 'gray'
                }
                size="sm"
              >
                {i.status.replace(/_/g, ' ')}
              </Tag>
            </div>
            <p className="text-[11px] text-[#525252] mt-1">{i.detail}</p>
          </li>
        ))}
      </ul>
    </Tile>
  );
};
