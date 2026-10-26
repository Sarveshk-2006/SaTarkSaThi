import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  X,
  Shield,
  LayoutDashboard,
  ScanSearch,
  Users,
  CreditCard,
  LifeBuoy,
  History,
  Settings,
  PhoneCall,
  LogOut,
} from 'lucide-react';
import { DemoModeIndicator } from './DemoModeIndicator';
import { useSeniorMode } from '../../context/SeniorModeContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ViewModeToggle } from '../appmode/ViewModeToggle';

const navItems = [
  { name: 'Overview', to: '/', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
  { name: 'Scam Analyzer', to: '/scanner', icon: <ScanSearch className="w-4 h-4 shrink-0" /> },
  { name: 'Payment Checkpoint', to: '/payment-checkpoint', icon: <CreditCard className="w-4 h-4 shrink-0" /> },
  { name: 'Family Shield', to: '/family-shield', icon: <Users className="w-4 h-4 shrink-0" /> },
  { name: 'Golden Hour Recovery', to: '/golden-hour', icon: <LifeBuoy className="w-4 h-4 shrink-0" />, badge: '1930' },
  { name: 'Incident History', to: '/incident-history', icon: <History className="w-4 h-4 shrink-0" /> },
  { name: 'Settings', to: '/settings', icon: <Settings className="w-4 h-4 shrink-0" /> },
];

const SENIOR_ROUTES = ['/', '/scanner', '/payment-checkpoint', '/family-shield', '/golden-hour', '/settings'];

export const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { seniorMode, setSeniorMode } = useSeniorMode();
  const { signOut } = useAuthSession();
  const items = seniorMode ? navItems.filter((i) => SENIOR_ROUTES.includes(i.to)) : navItems;

  return (
    <header className="lg:hidden border-b border-[#1E3A4B] bg-[#142A36] text-white sticky top-0 z-40 shadow-xs">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#176B58] text-white flex items-center justify-center shadow-subtle border border-[#23806B]">
            <Shield className="w-4 h-4 text-[#DCEDE5]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Satark Saathi</h1>
            <span className="text-[10px] text-[#DCEDE5] font-medium">Digital Safety &amp; Family Shield</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ViewModeToggle dark />
          <a
            href="tel:1930"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-xs transition-colors"
            title="Emergency Cyber Crime Helpline 1930"
          >
            <PhoneCall className="w-3 h-3 text-slate-950" />
            <span>1930</span>
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-white/80 hover:text-white rounded-xl border border-white/10 bg-white/5 cursor-pointer transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="border-t border-[#1E3A4B] bg-[#142A36] text-white px-4 py-3 space-y-1 shadow-dropdown">
          <nav className="space-y-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl ${seniorMode ? 'text-base' : 'text-xs'} font-medium transition-colors ${
                    isActive
                      ? 'bg-[#176B58] text-white font-semibold shadow-subtle'
                      : 'text-slate-100 hover:bg-[#1E3A4B] hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-400 text-slate-950 font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="pt-3 border-t border-[#1E3A4B] mt-3 space-y-2">
            <button
              type="button"
              onClick={() => setSeniorMode(!seniorMode)}
              aria-pressed={seniorMode}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-bold bg-amber-400 text-slate-950 cursor-pointer"
            >
              {seniorMode ? 'Senior Mode: ON (tap to turn off)' : 'Turn on Senior Mode (larger text)'}
            </button>
            <button
              type="button"
              onClick={() => {
                signOut();
                window.location.assign('/welcome');
              }}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold border border-white/20 text-white flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
            <DemoModeIndicator />
          </div>
        </div>
      )}
    </header>
  );
};
