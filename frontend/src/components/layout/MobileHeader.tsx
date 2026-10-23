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
} from 'lucide-react';
import { DemoModeIndicator } from './DemoModeIndicator';

const navItems = [
  { name: 'Overview', to: '/', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
  { name: 'Scam Analyzer', to: '/scanner', icon: <ScanSearch className="w-4 h-4 shrink-0" /> },
  { name: 'Payment Checkpoint', to: '/payment-checkpoint', icon: <CreditCard className="w-4 h-4 shrink-0" /> },
  { name: 'Family Shield', to: '/family-shield', icon: <Users className="w-4 h-4 shrink-0" /> },
  { name: 'Golden Hour Recovery', to: '/golden-hour', icon: <LifeBuoy className="w-4 h-4 shrink-0" />, badge: '1930' },
  { name: 'Incident History', to: '/incident-history', icon: <History className="w-4 h-4 shrink-0" /> },
  { name: 'Settings', to: '/settings', icon: <Settings className="w-4 h-4 shrink-0" /> },
];

export const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="md:hidden border-b border-[#E2E8F0] bg-white sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#176B58] text-white flex items-center justify-center shadow-xs">
            <Shield className="w-4 h-4 text-emerald-100" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#182536] leading-none">Satark Saathi</h1>
            <span className="text-[10px] text-[#64748B] font-medium">Digital Safety & Family Shield</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:1930"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold"
            title="Emergency Cyber Crime Helpline 1930"
          >
            <PhoneCall className="w-3 h-3 text-amber-600" />
            <span>1930</span>
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-slate-700 hover:text-slate-900 rounded-md border border-slate-200 bg-white"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Drawer */}
      {isOpen && (
        <div className="px-4 pt-2 pb-5 space-y-1 bg-white border-b border-slate-200 shadow-lg">
          <div className="py-2 border-b border-slate-100 mb-2">
            <DemoModeIndicator />
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#176B58] text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};
