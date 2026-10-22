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
  CheckCircle2,
} from 'lucide-react';
import { DemoModeIndicator } from './DemoModeIndicator';
import { useLanguage } from '../../context/LanguageContext';

interface NavItem {
  name: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Overview',
    to: '/',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    name: 'Scam Analyzer',
    to: '/scanner',
    icon: <ScanSearch className="w-4 h-4" />,
  },
  {
    name: 'Payment Checkpoint',
    to: '/payment-checkpoint',
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    name: 'Family Shield',
    to: '/family-shield',
    icon: <Users className="w-4 h-4" />,
  },
  {
    name: 'Golden Hour Recovery',
    to: '/golden-hour',
    icon: <LifeBuoy className="w-4 h-4" />,
    badge: '1930',
  },
  {
    name: 'Incident History',
    to: '/incident-history',
    icon: <History className="w-4 h-4" />,
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: <Settings className="w-4 h-4" />,
  },
];

export const Sidebar: React.FC = () => {
  const { currentMeta } = useLanguage();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0B132B] text-slate-100 min-h-screen select-none border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 bg-[#080E21]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-teal-100" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white tracking-tight leading-none truncate">
              Satark Saathi
            </h1>
            <p className="text-[11px] text-teal-400 font-semibold tracking-wide mt-1 truncate">
              {currentMeta.tagline}
            </p>
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
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-teal-700 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              {item.icon}
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Golden Hour Helpline Quick Reference Box */}
      <div className="mx-3 mb-4 p-3 rounded-lg border border-amber-600/30 bg-amber-950/30 text-amber-200">
        <div className="flex items-center gap-2 font-bold text-xs mb-1 text-amber-300">
          <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
          <span>Cyber Crime: 1930</span>
        </div>
        <p className="text-[10px] text-amber-200/80 leading-relaxed">
          National citizen financial fraud helpline. Call within 2 hours of fraud to freeze recipient bank accounts.
        </p>
      </div>

      {/* Footer Status Section */}
      <div className="p-3 border-t border-slate-800/80 bg-[#080E21]">
        <DemoModeIndicator />
      </div>
    </aside>
  );
};
