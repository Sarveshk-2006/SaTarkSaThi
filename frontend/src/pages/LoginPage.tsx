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
    if (!identifier.trim() || !passcode || busy) return;

    setBusy(true);
    setError(null);
    try {
      await signIn(identifier, passcode);
      // Full reload so live notifications reconnect as the signed-in persona.
      window.location.assign(from.startsWith('/') && !from.startsWith('/login') ? from : '/');
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed. Please verify credentials or check backend.');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-teal-500/15 antialiased font-sans">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex items-center justify-between">
        <Link
          to="/welcome"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-800 transition-colors py-1 px-2.5 rounded-full hover:bg-slate-200/60"
        >
          <ArrowLeft size={16} />
          <span>Back to overview</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00C8F0] via-[#00AEEF] to-[#1767F2] text-white flex items-center justify-center shadow-xs ring-2 ring-white">
            <Security size={15} />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-bold text-xs tracking-tight text-slate-900">Satark Saathi</span>
            <span className="text-[10px] text-slate-500 font-medium">सतर्क साथी &bull; Digital Safety</span>
          </div>
        </div>
      </header>

      {/* Main Two-Column Container */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 my-auto">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Welcome Message, Context & Security Identity */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="lg:col-span-6 space-y-4"
          >
            <div className="space-y-2.5">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/80">
                <Security size={14} className="text-teal-700" />
                <span>Digital Public Safety &bull; Evaluator Access</span>
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-[1.15]">
                Welcome back to <span className="text-teal-700">Satark Saathi</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                <em>Your companion for safer digital decisions.</em>
              </p>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Protect yourself and your family from digital arrest threats, coercive UPI payments,
                and deceptive cyber fraud with real-time heuristic verification.
              </p>
            </div>

            {/* Core Pillars */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Security size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pre-Transaction UPI Checkpoint</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Behavioral coercion analysis and guardian review before funds leave your account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <UserMultiple size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Family Shield Protection</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dual-custody payment safety for senior citizens with discrete guardian notifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Proofline */}
            <div className="flex items-center gap-2.5 pt-1 text-xs text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Zero-Plaintext Storage &bull; National Helpline 1930 Aligned</span>
            </div>
          </motion.div>

          {/* Right Column: Focused Sign-in Card */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
            className="lg:col-span-6 flex justify-center"
          >
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_40px_-10px_rgba(15,23,42,0.08)] p-6 sm:p-7 space-y-4">
              {/* Card Header */}
              <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Security size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Sign in to Workspace
                  </h2>
                  <p className="text-xs text-slate-500">
                    Evaluator Access &mdash; choose a verified test persona
                  </p>
                </div>
              </div>

              {/* Demo Persona Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Select Demo Persona
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {DEMO_ACCOUNTS.map((a) => {
                    const isSelected = identifier === a.identifier;
                    const IconComponent = a.icon;
                    return (
                      <motion.div
                        key={a.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => handleSelectPersona(a)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectPersona(a);
                          }
                        }}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/70 ring-1 ring-teal-700/30 shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                              isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <IconComponent size={15} />
                          </span>
                          {isSelected && (
                            <CheckmarkFilled size={16} className="text-teal-700" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 leading-tight">
                            {a.label}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                            {a.hint}
                          </p>
                        </div>
                      </motion.div>
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
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                    className="w-full h-11 px-3.5 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-all"
                  />
                </div>

                {/* Passcode Input with Visibility Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-passcode"
                      className="block text-xs font-semibold text-slate-700"
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
                      className="w-full h-11 pl-3.5 pr-10 text-sm text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded transition-colors"
                      aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                    >
                      {showPasscode ? <ViewOff size={16} /> : <View size={16} />}
                    </button>
                  </div>

                  {/* Helper Text for Demo Credentials */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <Information size={14} className="text-teal-700 shrink-0" />
                    <span>
                      Demo passcode: <strong className="font-mono font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">1234</strong>
                    </span>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2.5"
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
                    disabled={busy || !identifier.trim() || !passcode}
                    className="w-full h-11 px-4 rounded-lg bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-xs hover:shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="p-3 bg-slate-50 border-l-2 border-teal-700 rounded-r-lg text-slate-600 leading-relaxed">
                <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider mb-0.5">
                  Evaluation Demonstration Environment
                </p>
                <p className="text-[11px]">
                  Live session state and SMS alerts are simulated with zero persistence of sensitive personal financial credentials.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Satark Saathi. Developed for Indian digital public safety.
      </footer>
    </div>
  );
};

export default LoginPage;
