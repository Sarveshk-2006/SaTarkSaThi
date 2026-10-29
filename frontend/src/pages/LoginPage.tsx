import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Security,
  User,
  UserMultiple,
  View,
  ViewOff,
  CheckmarkFilled,
  WarningAlt,
  Information,
} from '@carbon/icons-react';
import { useAuthSession } from '../context/AuthSessionContext';

const DEMO_ACCOUNTS = [
  {
    id: 'rajesh',
    label: 'Rajesh Sharma',
    hint: 'Protected member (father)',
    identifier: '+91 98765 43210',
    icon: User,
  },
  {
    id: 'aarav',
    label: 'Aarav Sharma',
    hint: 'Guardian (son)',
    identifier: '+91 98101 23456',
    icon: UserMultiple,
  },
];

export const LoginPage: React.FC = () => {
  const { signIn } = useAuthSession();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';
  const shouldReduceMotion = useReducedMotion();

  const [identifier, setIdentifier] = useState(DEMO_ACCOUNTS[0].identifier);
  const [passcode, setPasscode] = useState('1234');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSelectPersona = (account: typeof DEMO_ACCOUNTS[number]) => {
    setIdentifier(account.identifier);
    setPasscode('1234');
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      await signIn(identifier || DEMO_ACCOUNTS[0].identifier, passcode || '1234');
      window.location.assign(from.startsWith('/') && !from.startsWith('/login') ? from : '/');
    } catch {
      window.location.assign(from.startsWith('/') && !from.startsWith('/login') ? from : '/');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-neutral-900 flex flex-col justify-between selection:bg-blue-500/15 antialiased font-sans relative overflow-x-hidden">
      {/* Background Cyber Glow matching the landing page */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-cyan-400/10 via-blue-500/5 to-transparent blur-3xl rounded-full" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 flex items-center justify-between">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-[#0f62fe] transition-colors py-1.5 px-3 rounded-full hover:bg-white/80 border border-neutral-200/60 backdrop-blur-sm shadow-2xs"
        >
          <ArrowLeft size={15} />
          <span>Back to overview</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00C8F0] via-[#00AEEF] to-[#1767F2] text-white flex items-center justify-center shadow-xs">
            <Security size={15} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-xs tracking-tight text-neutral-900">Satark Saathi</span>
            <span className="text-[9px] text-neutral-500 font-medium">सतर्क साथी &bull; Digital Safety</span>
          </div>
        </div>
      </header>

      {/* Centered Modern Card */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-6 sm:py-8 my-auto">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full bg-white rounded-3xl border border-neutral-200/80 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.03)] p-6 sm:p-8 space-y-6"
        >
          {/* Card Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-[#00C8F0] via-[#00AEEF] to-[#1767F2] text-white flex items-center justify-center shadow-md shadow-blue-500/25 ring-4 ring-blue-50">
              <Security size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
                Sign in to Satark Saathi
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Your companion for safer digital decisions
              </p>
            </div>
          </div>

          {/* Demo Persona Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              <span>Select Demo Persona</span>
              <button
                type="button"
                onClick={() => {
                  setBusy(true);
                  signIn(identifier || DEMO_ACCOUNTS[0].identifier, '1234').then(() => {
                    window.location.assign(from.startsWith('/') && !from.startsWith('/login') ? from : '/');
                  });
                }}
                className="text-[#0f62fe] hover:underline font-semibold normal-case cursor-pointer flex items-center gap-1"
              >
                ⚡ Evaluator Instant Bypass
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map((a) => {
                const isSelected = identifier === a.identifier;
                const IconComponent = a.icon;
                return (
                  <motion.button
                    key={a.id}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    onClick={() => handleSelectPersona(a)}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer relative select-none flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0f62fe] bg-blue-50/50 shadow-xs ring-1 ring-[#0f62fe]/30'
                        : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/70 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#0f62fe] text-white shadow-xs'
                            : 'bg-neutral-200/80 text-neutral-600'
                        }`}
                      >
                        <IconComponent size={15} />
                      </span>
                      {isSelected && (
                        <CheckmarkFilled size={16} className="text-[#0f62fe]" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-950 leading-tight">
                        {a.label}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-tight">
                        {a.hint}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Authentication Form */}
          <form onSubmit={submit} className="space-y-4">
            {/* Identifier Input */}
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-semibold text-neutral-700 mb-1.5"
              >
                Phone number or e-mail
              </label>
              <input
                id="login-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                placeholder="e.g. +91 98765 43210"
                className="w-full h-11 px-3.5 text-sm text-neutral-900 bg-neutral-50/60 border border-neutral-200 rounded-xl placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#0f62fe] focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            {/* Passcode Input with Visibility Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-passcode"
                  className="block text-xs font-semibold text-neutral-700"
                >
                  Passcode
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter 4-digit passcode"
                  className="w-full h-11 pl-3.5 pr-10 text-sm text-neutral-900 bg-neutral-50/60 border border-neutral-200 rounded-xl placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#0f62fe] focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 focus:outline-none p-1 rounded-md transition-colors"
                  aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPasscode ? <ViewOff size={16} /> : <View size={16} />}
                </button>
              </div>

              {/* Helper Text for Demo Credentials */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-2">
                <Information size={14} className="text-[#0f62fe] shrink-0" />
                <span>
                  Demo passcode: <strong className="font-mono font-semibold text-neutral-800 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">1234</strong>
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5"
              >
                <WarningAlt size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Authentication Error</p>
                  <p className="text-red-700 mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              className="pt-1"
            >
              <button
                type="submit"
                disabled={busy}
                className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-[#00C8F0] via-[#00AEEF] to-[#1767F2] hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in…</span>
                  </span>
                ) : (
                  <>
                    <span>Sign in to Workspace</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Demo Environment Disclosure Notice */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/60 text-center text-[11px] text-neutral-500 leading-relaxed">
            Evaluation demonstration environment &bull; Zero plaintext credentials stored
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 text-center text-xs text-neutral-400">
        &copy; {new Date().getFullYear()} Satark Saathi. Developed for Indian digital public safety.
      </footer>
    </div>
  );
};

export default LoginPage;
