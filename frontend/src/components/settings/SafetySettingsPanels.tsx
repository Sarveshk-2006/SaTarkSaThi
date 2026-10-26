import React, { useEffect, useState } from 'react';
import { CheckCircle2, CircleSlash, Eye, Lock, PlugZap, ShieldQuestion } from 'lucide-react';
import { api } from '../../api/endpoints';
import { DuressSettings, IntegrationStatus } from '../../api/types';
import { useToast } from '../../context/ToastContext';
import { useSeniorMode } from '../../context/SeniorModeContext';

export const SeniorModeCard: React.FC = () => {
  const { seniorMode, setSeniorMode } = useSeniorMode();
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
        <Eye className="w-4 h-4 text-[#176B58]" />
        <span>Senior Mode</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        Larger text, stronger contrast, bigger buttons, fewer menu items and a simple home screen with one-tap calls to 1930 and your guardian.
        The choice is remembered on this device.
      </p>
      <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-300 cursor-pointer">
        <span className="text-sm font-bold text-slate-900">{seniorMode ? 'Senior Mode is ON' : 'Senior Mode is OFF'}</span>
        <input
          type="checkbox"
          role="switch"
          aria-checked={seniorMode}
          checked={seniorMode}
          onChange={(e) => setSeniorMode(e.target.checked)}
          className="w-6 h-6 accent-[#176B58]"
        />
      </label>
    </div>
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
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
        <Lock className="w-4 h-4 text-[#176B58]" />
        <span>Discreet safety phrase (optional)</span>
      </div>
      <p className="text-xs text-slate-600 leading-relaxed">
        {settings?.how_it_works ||
          "If your secret phrase appears in your answer to the check-in question about what a payment is for, the app shows an ordinary 'family check needed' screen while quietly asking your accepted guardians to call you."}
      </p>
      <ul className="text-[11px] text-slate-600 list-disc pl-5 space-y-0.5">
        <li>Your phrase is never shown again, never sent in alerts, and never written to logs — only a salted hash is kept.</li>
        <li>Guardians receive “Please call now” with no mention of the phrase.</li>
        <li>It works only if at least one guardian has accepted your invitation.</li>
      </ul>

      {settings && (
        <p className={`text-xs font-semibold flex items-center gap-1.5 ${settings.enabled ? 'text-emerald-700' : 'text-slate-600'}`}>
          {settings.enabled ? <CheckCircle2 className="w-4 h-4" /> : <CircleSlash className="w-4 h-4" />}
          {settings.enabled ? 'Enabled' : 'Not enabled'} &bull; {settings.eligible_guardian_count} accepted guardian(s)
        </p>
      )}
      {settings && settings.eligible_guardian_count === 0 && (
        <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2">
          No guardian has accepted your invitation yet, so an escalation would reach no one.
        </p>
      )}

      <form onSubmit={save} className="space-y-2 text-xs">
        <label className="block font-semibold text-slate-700">
          {settings?.enabled ? 'Replace phrase' : 'Choose a phrase'} (2–8 words, something you would never say by accident)
          <input
            type="password"
            autoComplete="off"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            minLength={8}
            maxLength={80}
            className="mt-1 w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
          />
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          <span className="text-slate-700">
            I agree that when I use this phrase, Satark Saathi may discreetly ask my accepted guardians to call me and hold the payment for their review.
          </span>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy || phrase.trim().length < 8 || !consent}
            className="px-4 py-2.5 rounded-xl bg-[#176B58] hover:bg-[#125243] text-white font-semibold disabled:opacity-50 cursor-pointer"
          >
            {settings?.enabled ? 'Replace phrase' : 'Turn on'}
          </button>
          {settings?.enabled && (
            <button type="button" disabled={busy} onClick={disable} className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold cursor-pointer">
              Turn off
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const STATUS_BADGE: Record<string, string> = {
  NOT_INTEGRATED: 'bg-slate-100 text-slate-800 border-slate-300',
  NOT_CONFIGURED: 'bg-slate-100 text-slate-800 border-slate-300',
  SIMULATED: 'bg-amber-50 text-amber-900 border-amber-300',
  CONFIGURED_UNVERIFIED: 'bg-blue-50 text-blue-900 border-blue-300',
};

export const IntegrationStatusPanel: React.FC = () => {
  const [data, setData] = useState<{ analysis_engine: string; integrations: IntegrationStatus[] } | null>(null);

  useEffect(() => {
    api.getIntegrationStatus().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
        <PlugZap className="w-4 h-4 text-[#176B58]" />
        <span>Integration status (what is real vs simulated)</span>
      </div>
      <p className="text-xs text-slate-700 flex items-center gap-1.5">
        <ShieldQuestion className="w-4 h-4" /> Active analysis engine: <strong>{data.analysis_engine}</strong>
      </p>
      <ul className="space-y-2">
        {data.integrations.map((i) => (
          <li key={i.id} className="text-xs p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900">{i.name}</span>
              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${STATUS_BADGE[i.status] || 'bg-slate-100 border-slate-300'}`}>
                {i.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">{i.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
