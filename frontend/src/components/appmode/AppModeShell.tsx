import React from 'react';
import { LogOut, PhoneCall, Shield } from 'lucide-react';
import { MockUpiPage } from '../../pages/MockUpiPage';
import { ViewModeToggle } from './ViewModeToggle';
import { useAuthSession } from '../../context/AuthSessionContext';
import { useNotification } from '../../context/NotificationContext';

/** Full-screen "app mode": the mobile payment-app experience protected by the Satark SDK. */
export const AppModeShell: React.FC = () => {
  const { signOut } = useAuthSession();
  const { activeProfileName } = useNotification();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E1E27] to-[#142A36] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0E1E27]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#176B58] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#DCEDE5]" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold">Satark Saathi &mdash; App mode</p>
              <p className="text-[11px] text-slate-300">Signed in as {activeProfileName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ViewModeToggle dark />
            <a href="tel:1930" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold">
              <PhoneCall className="w-3.5 h-3.5" /> 1930
            </a>
            <button
              type="button"
              onClick={() => {
                signOut();
                window.location.assign('/welcome');
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/20 text-xs font-semibold text-slate-100 hover:bg-white/10 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="rounded-3xl bg-[#F7F8F4] text-[#142A36] p-4 sm:p-6">
          <MockUpiPage />
        </div>
      </main>
    </div>
  );
};
