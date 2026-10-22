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
} from 'lucide-react';
import { DemoModeIndicator } from './DemoModeIndicator';

const navItems = [
  { name: 'Overview', to: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
  { name: 'Scam Scanner', to: '/scanner', icon: <ScanSearch className="w-4 h-4" /> },
  { name: 'Family Shield', to: '/family-shield', icon: <Users className="w-4 h-4" /> },
  { name: 'Payment Checkpoint', to: '/payment-checkpoint', icon: <CreditCard className="w-4 h-4" /> },
  { name: 'Golden Hour Recovery', to: '/golden-hour', icon: <LifeBuoy className="w-4 h-4" /> },
  { name: 'Incident History', to: '/incident-history', icon: <History className="w-4 h-4" /> },
  { name: 'Settings', to: '/settings', icon: <Settings className="w-4 h-4" /> },
];

export const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="md:hidden border-b border-slate-200 bg-[#FAF9F6] sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center">
            <Shield className="w-4 h-4 text-teal-100" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">Satark Saathi</h1>
            <span className="text-[10px] text-slate-500 font-medium">Family Scam Shield</span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-slate-600 hover:text-slate-900 rounded-md border border-slate-200 bg-white"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Drawer */}
      {isOpen && (
        <div className="px-4 pt-2 pb-5 space-y-1 bg-white border-b border-slate-200 shadow-md">
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
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-800 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};
