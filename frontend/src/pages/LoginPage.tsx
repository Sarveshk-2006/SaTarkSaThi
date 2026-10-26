import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, LogIn, Shield, UserRound } from 'lucide-react';
import { useAuthSession } from '../context/AuthSessionContext';

const DEMO_ACCOUNTS = [
  { label: 'Rajesh Sharma', hint: 'Protected member (father)', identifier: '+91 98765 43210' },
  { label: 'Aarav Sharma', hint: 'Guardian (son)', identifier: '+91 98101 23456' },
];

export const LoginPage: React.FC = () => {
  const { signIn } = useAuthSession();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';

  const [identifier, setIdentifier] = useState(DEMO_ACCOUNTS[0].identifier);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(identifier, passcode);
      // Full reload so live notifications reconnect as the signed-in persona.
      window.location.assign(from.startsWith('/') && !from.startsWith('/login') ? from : '/');
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Is the backend running?');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E1E27] via-[#142A36] to-[#176B58] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/welcome" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-200 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="bg-white rounded-3xl shadow-2xl p-7 space-y-5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-[#176B58] flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#DCEDE5]" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-[#142A36]">Sign in to Satark Saathi</h1>
              <p className="text-xs text-[#64748B]">Demo login &mdash; uses the two seeded demo accounts</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Choose a demo account</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.identifier}
                  type="button"
                  onClick={() => {
                    setIdentifier(a.identifier);
                    setPasscode('1234');
                  }}
                  aria-pressed={identifier === a.identifier}
                  className={`text-left p-3 rounded-xl border-2 cursor-pointer ${
                    identifier === a.identifier ? 'border-[#176B58] bg-[#DCEDE5]/50' : 'border-[#E2E8F0] hover:bg-[#F7F8F4]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[#142A36]">
                    <UserRound className="w-4 h-4" /> {a.label}
                  </span>
                  <span className="block text-[11px] text-[#64748B] mt-0.5">{a.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block text-sm font-semibold text-[#142A36]">
              Phone number or e-mail
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                className="mt-1 w-full p-3 rounded-xl border border-[#CBD5E1] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176B58]"
              />
            </label>
            <label className="block text-sm font-semibold text-[#142A36]">
              Passcode
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoComplete="current-password"
                placeholder="Demo passcode: 1234"
                className="mt-1 w-full p-3 rounded-xl border border-[#CBD5E1] bg-[#F7F8F4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176B58]"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !identifier.trim() || !passcode}
              className="w-full min-h-[48px] rounded-xl bg-[#176B58] hover:bg-[#135948] text-white font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-[11px] text-[#64748B] leading-relaxed">
            This is a demonstration sign-in for the hackathon prototype. Don’t use real passwords or personal data.
          </p>
        </div>
      </div>
    </div>
  );
};
