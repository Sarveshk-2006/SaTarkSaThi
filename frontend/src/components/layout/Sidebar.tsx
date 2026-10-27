import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
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
  ChevronLeft,
  ChevronRight,
} from '@carbon/icons-react';
import { Tag } from '@carbon/react';
import { DemoModeIndicator } from './DemoModeIndicator';
import { useLanguage } from '../../context/LanguageContext';
import { useSeniorMode } from '../../context/SeniorModeContext';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

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
    name: 'Caller Shield',
    to: '/caller-shield',
    icon: Phone,
    badge: 'AI Shield',
    shortcut: '7',
  },
  {
    name: 'Settings',
    to: '/settings',
    icon: Settings,
    shortcut: '8',
  },
];

const SENIOR_ROUTES = ['/', '/scanner', '/payment-checkpoint', '/family-shield', '/caller-shield', '/golden-hour', '/settings'];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle,
}) => {
  const { currentMeta } = useLanguage();
  const { seniorMode } = useSeniorMode();

  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    try {
      return localStorage.getItem('satark_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (controlledToggle) {
      controlledToggle();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('satark_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const items = seniorMode ? navItems.filter((i) => SENIOR_ROUTES.includes(i.to)) : navItems;

  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 h-screen select-none border-r border-[#393939] bg-[#161616] text-[#f4f4f4] transition-all duration-300 ease-in-out font-sans ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Main Navigation"
    >
      {/* Floating Minimize/Expand Pill Toggle on Border */}
      <button
        type="button"
        onClick={toggleCollapse}
        className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#262626] border border-[#525252] text-neutral-300 hover:text-white hover:bg-[#393939] items-center justify-center shadow-md z-50 transition-transform duration-200 hover:scale-110 cursor-pointer"
        title={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Brand Header */}
      <div className={`border-b border-[#393939] bg-[#262626] transition-all ${isCollapsed ? 'p-3 flex flex-col items-center justify-center' : 'p-4'}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded bg-[#0f62fe] text-white flex items-center justify-center shrink-0 shadow-xs">
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

            {/* Minimize arrow in header */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#393939] rounded transition-colors cursor-pointer shrink-0"
              title="Minimize sidebar"
              aria-label="Minimize sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 rounded bg-[#0f62fe] text-white flex items-center justify-center shrink-0 shadow-xs" title="Satark Saathi">
              <Security size={20} />
            </div>
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1 text-neutral-400 hover:text-white hover:bg-[#393939] rounded transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Links */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-1 transition-all ${isCollapsed ? 'px-2 py-4' : 'px-3 py-4'}`} aria-label="Security Modules">
        {!isCollapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#8d8d8d]">
            Security Modules
          </p>
        )}
        {items.map((item) => {
          const IconComponent = item.icon;
          return (
            <motion.div
              key={item.to}
              whileHover={{ x: isCollapsed ? 0 : 3, scale: isCollapsed ? 1.05 : 1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <NavLink
                to={item.to}
                end={item.to === '/'}
                title={item.name}
                className={({ isActive }) =>
                  isCollapsed
                    ? `flex items-center justify-center p-2.5 rounded transition-colors relative ${
                        isActive
                          ? 'bg-[#0f62fe] text-white shadow-xs'
                          : 'text-[#c6c6c6] hover:bg-[#262626] hover:text-white'
                      }`
                    : `flex items-center justify-between px-3 ${
                        seniorMode ? 'py-3 text-base' : 'py-2.5 text-xs'
                      } rounded transition-colors ${
                        isActive
                          ? 'bg-[#0f62fe] text-white font-medium'
                          : 'text-[#c6c6c6] hover:bg-[#262626] hover:text-white'
                      }`
                }
              >
                {isCollapsed ? (
                  <>
                    <IconComponent size={20} className="shrink-0" />
                    {item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f1c21b]" />
                    )}
                    <span className="sr-only">{item.name}</span>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Golden Hour Helpline Quick Reference Box */}
      {!isCollapsed ? (
        <div className="mx-3 mb-4 p-3 rounded border border-[#f1c21b] bg-[#2b2510] text-[#f1c21b]">
          <div className="flex items-center gap-2 font-semibold text-xs mb-1 text-[#f1c21b]">
            <Phone size={16} className="text-[#f1c21b] shrink-0" />
            <span>Cyber Crime: 1930</span>
          </div>
          <p className="text-[11px] text-[#e0e0e0] leading-relaxed">
            National citizen financial fraud helpline. Call immediately to freeze recipient bank accounts.
          </p>
        </div>
      ) : (
        <div className="mx-2 mb-4 p-2.5 rounded border border-[#f1c21b] bg-[#2b2510] text-[#f1c21b] flex items-center justify-center cursor-pointer" title="National Cyber Crime Helpline: 1930">
          <Phone size={18} className="text-[#f1c21b]" />
          <span className="sr-only">Cyber Crime: 1930</span>
        </div>
      )}

      {/* Footer Status Section */}
      <div className={`border-t border-[#393939] bg-[#262626] ${isCollapsed ? 'p-2.5 flex justify-center' : 'p-3'}`}>
        {!isCollapsed ? (
          <DemoModeIndicator />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" title="Backend Online • Demo Active" />
        )}
      </div>
    </aside>
  );
};
