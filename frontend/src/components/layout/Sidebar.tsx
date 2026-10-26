import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Dashboard,
  Scan,
  UserMultiple,
  Wallet,
  Help,
  Time,
  Settings,
  Security,
  Phone,
} from '@carbon/icons-react';
import { Tag } from '@carbon/react';
import { DemoModeIndicator } from './DemoModeIndicator';
import { useLanguage } from '../../context/LanguageContext';
import { useSeniorMode } from '../../context/SeniorModeContext';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  shortcut?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Overview',
    to: '/',
    icon: Dashboard,
    shortcut: '1',
  },
  {
    name: 'Scam Analyzer',
    to: '/scanner',
    icon: Scan,
    shortcut: '2',
  },
  {
    name: 'Payment Checkpoint',
    to: '/payment-checkpoint',
    icon: Wallet,
    shortcut: '3',
  },
  {
    name: 'Family Shield',
    to: '/family-shield',
    icon: UserMultiple,
    shortcut: '4',
  },
  {
    name: 'Golden Hour Recovery',
    to: '/golden-hour',
    icon: Help,
    badge: '1930',
    shortcut: '5',
  },
  {
    name: 'Incident History',
    to: '/incident-history',
    icon: Time,
    shortcut: '6',
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: Settings,
    shortcut: '7',
  },
];

const SENIOR_ROUTES = ['/', '/scanner', '/payment-checkpoint', '/family-shield', '/golden-hour', '/settings'];

export const Sidebar: React.FC = () => {
  const { currentMeta } = useLanguage();
  const { seniorMode } = useSeniorMode();
  const items = seniorMode ? navItems.filter((i) => SENIOR_ROUTES.includes(i.to)) : navItems;

  return (
    <aside
      className="hidden lg:flex flex-col w-64 bg-[#161616] text-[#f4f4f4] min-h-screen select-none border-r border-[#393939] shrink-0 font-sans"
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[#393939] bg-[#262626]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#0f62fe] text-white flex items-center justify-center shrink-0">
            <Security size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white tracking-tight leading-none truncate">
              Satark Saathi
            </h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#24a148]"></span>
              <p className="text-[11px] text-[#c6c6c6] font-normal tracking-normal truncate">
                {currentMeta.tagline}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Security Modules">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#8d8d8d]">
          Security Modules
        </p>
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 ${
                  seniorMode ? 'py-3 text-base' : 'py-2.5 text-xs'
                } rounded transition-colors ${
                  isActive
                    ? 'bg-[#0f62fe] text-white font-medium'
                    : 'text-[#c6c6c6] hover:bg-[#262626] hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <IconComponent size={18} className="shrink-0" />
                <span className="truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <Tag type="warm-gray" size="sm" className="font-bold">
                    {item.badge}
                  </Tag>
                )}
                {item.shortcut && (
                  <span className="hidden xl:inline-flex items-center justify-center w-4 h-4 text-[10px] font-mono text-[#8d8d8d] bg-[#262626] border border-[#525252] rounded">
                    {item.shortcut}
                  </span>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Golden Hour Helpline Quick Reference Box */}
      <div className="mx-3 mb-4 p-3 rounded border border-[#f1c21b] bg-[#2b2510] text-[#f1c21b]">
        <div className="flex items-center gap-2 font-semibold text-xs mb-1 text-[#f1c21b]">
          <Phone size={16} className="text-[#f1c21b] shrink-0" />
          <span>Cyber Crime: 1930</span>
        </div>
        <p className="text-[11px] text-[#e0e0e0] leading-relaxed">
          National citizen financial fraud helpline. Call immediately to freeze recipient bank accounts.
        </p>
      </div>

      {/* Footer Status Section */}
      <div className="p-3 border-t border-[#393939] bg-[#262626]">
        <DemoModeIndicator />
      </div>
    </aside>
  );
};
