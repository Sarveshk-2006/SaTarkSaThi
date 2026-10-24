import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanSearch,
  Users,
  CreditCard,
  LifeBuoy,
  History,
  Settings,
  Shield,
  PhoneCall,
} from 'lucide-react';
import { DemoModeIndicator } from './DemoModeIndicator';
import { useLanguage } from '../../context/LanguageContext';

interface NavItem {
  name: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
  shortcut?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Overview',
    to: '/',
    icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    shortcut: '1',
  },
  {
    name: 'Scam Analyzer',
    to: '/scanner',
    icon: <ScanSearch className="w-4 h-4 shrink-0" />,
    shortcut: '2',
  },
  {
    name: 'Payment Checkpoint',
    to: '/payment-checkpoint',
    icon: <CreditCard className="w-4 h-4 shrink-0" />,
    shortcut: '3',
  },
  {
    name: 'Family Shield',
    to: '/family-shield',
    icon: <Users className="w-4 h-4 shrink-0" />,
    shortcut: '4',
  },
  {
    name: 'Golden Hour Recovery',
    to: '/golden-hour',
    icon: <LifeBuoy className="w-4 h-4 shrink-0" />,
    badge: '1930',
    shortcut: '5',
  },
  {
    name: 'Incident History',
    to: '/incident-history',
    icon: <History className="w-4 h-4 shrink-0" />,
    shortcut: '6',
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: <Settings className="w-4 h-4 shrink-0" />,
    shortcut: '7',
  },
];

export const Sidebar: React.FC = () => {
  const { currentMeta } = useLanguage();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#142A36] text-slate-100 min-h-screen select-none border-r border-[#1E3A4B] shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#1E3A4B] bg-[#0E1E27]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#176B58] text-white flex items-center justify-center shadow-subtle border border-[#23806B]">
            <Shield className="w-5 h-5 text-[#DCEDE5]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white tracking-tight leading-none truncate">
              Satark Saathi
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-[10px] text-[#DCEDE5] font-medium tracking-wide truncate">
                {currentMeta.tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Security Modules
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#176B58] text-white font-semibold shadow-subtle'
                  : 'text-slate-300 hover:bg-[#1A3342] hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {item.icon}
              <span className="truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.badge && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-400 text-slate-950">
                  {item.badge}
                </span>
              )}
              {item.shortcut && (
                <span className="hidden xl:inline-flex items-center justify-center w-4 h-4 text-[9px] font-mono font-medium rounded text-slate-400 bg-white/5 border border-white/10">
                  {item.shortcut}
                </span>
              )}
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Golden Hour Helpline Quick Reference Box */}
      <div className="mx-3 mb-4 p-3 rounded-xl border border-amber-500/30 bg-[#251E14] text-amber-200">
        <div className="flex items-center gap-2 font-bold text-xs mb-1 text-amber-300">
          <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Cyber Crime: 1930</span>
        </div>
        <p className="text-[10px] text-amber-200/80 leading-relaxed">
          National citizen financial fraud helpline. Call immediately to freeze recipient bank accounts.
        </p>
      </div>

      {/* Footer Status Section */}
      <div className="p-3 border-t border-[#1E3A4B] bg-[#0E1E27]">
        <DemoModeIndicator />
      </div>
    </aside>
  );
};
