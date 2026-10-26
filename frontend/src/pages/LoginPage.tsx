import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Login, Security, User } from '@carbon/icons-react';
import { Tile, Button, TextInput, InlineNotification, Tag } from '@carbon/react';
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
    <div className="min-h-screen bg-[#161616] text-[#f4f4f4] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Link
          to="/welcome"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#c6c6c6] hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to overview
        </Link>

        <Tile className="bg-white text-[#161616] p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-[#0f62fe] text-white flex items-center justify-center shrink-0">
              <Security size={22} />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-[#161616] tracking-tight">Sign in to Satark Saathi</h1>
              <p className="text-xs text-[#525252]">Evaluator Access &mdash; choose a verified test persona</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#525252] mb-2">
              Select Demo Persona
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <motion.button
                  key={a.identifier}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => {
                    setIdentifier(a.identifier);
                    setPasscode('1234');
                  }}
                  aria-pressed={identifier === a.identifier}
                  className={`text-left p-3 border transition-colors cursor-pointer rounded-xs ${
                    identifier === a.identifier
                      ? 'border-[#0f62fe] bg-[#edf5ff]'
                      : 'border-[#e0e0e0] hover:bg-[#f4f4f4]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-[#161616]">
                    <User size={14} className={identifier === a.identifier ? 'text-[#0f62fe]' : 'text-[#525252]'} />
                    {a.label}
                  </span>
                  <span className="block text-[11px] text-[#525252] mt-0.5">{a.hint}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <TextInput
                id="login-identifier"
                labelText="Phone number or e-mail"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <TextInput
                id="login-passcode"
                labelText="Passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoComplete="current-password"
                placeholder="Demo passcode: 1234"
              />
            </div>

            {error && (
              <InlineNotification
                kind="error"
                title="Authentication Error"
                subtitle={error}
                hideCloseButton
                lowContrast
              />
            )}

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                type="submit"
                kind="primary"
                size="lg"
                renderIcon={Login}
                className="w-full"
                disabled={busy || !identifier.trim() || !passcode}
              >
                {busy ? 'Signing in…' : 'Sign in to Workspace'}
              </Button>
            </motion.div>
          </form>

          <p className="text-[11px] text-[#525252] leading-relaxed border-t border-[#e0e0e0] pt-4">
            Evaluation demonstration environment. Live session state and SMS alerts are simulated with zero persistence of sensitive personal financial credentials.
          </p>
        </Tile>
      </motion.div>
    </div>
  );
};
