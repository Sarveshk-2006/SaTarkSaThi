import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Menu,
  Close,
  Security,
  Dashboard,
  Scan,
  UserMultiple,
  Wallet,
  Help,
  Time,
  Settings,
  Phone,
  Logout,
} from '@carbon/icons-react';
import { Tag } from '@carbon/react';
import { DemoModeIndicator } from './DemoModeIndicator';
import { useSeniorMode } from '../../context/SeniorModeContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ViewModeToggle } from '../appmode/ViewModeToggle';

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Overview', to: '/', icon: Dashboard },
  { name: 'Scam Analyzer', to: '/scanner', icon: Scan },
  { name: 'Payment Checkpoint', to: '/payment-checkpoint', icon: Wallet },
  { name: 'Family Shield', to: '/family-shield', icon: UserMultiple },
  { name: 'Golden Hour Recovery', to: '/golden-hour', icon: Help, badge: '1930' },
  { name: 'Incident History', to: '/incident-history', icon: Time },
  { name: 'Settings', to: '/settings', icon: Settings },
];

const SENIOR_ROUTES = ['/', '/scanner', '/payment-checkpoint', '/family-shield', '/golden-hour', '/settings'];

export const MobileHeader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { seniorMode, setSeniorMode } = useSeniorMode();
  const { signOut } = useAuthSession();
  const items = seniorMode ? navItems.filter((i) => SENIOR_ROUTES.includes(i.to)) : navItems;

  return (
    <header className="lg:hidden border-b border-[#393939] bg-[#161616] text-[#f4f4f4] sticky top-0 z-40 font-sans">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#0f62fe] text-white flex items-center justify-center shrink-0">
            <Security size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white leading-none">Satark Saathi</h1>
            <span className="text-[11px] text-[#c6c6c6]">Digital Safety &amp; Family Shield</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ViewModeToggle dark />
          <a
            href="tel:1930"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#f1c21b] hover:bg-[#d2a106] text-[#161616] text-xs font-bold transition-colors"
            title="Emergency Cyber Crime Helpline 1930"
          >
            <Phone size={14} />
            <span>1930</span>
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-white/90 hover:text-white rounded border border-[#393939] bg-[#262626] cursor-pointer"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <Close size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isOpen && (
        <div className="border-t border-[#393939] bg-[#161616] text-white px-4 py-3 space-y-1">
          <nav className="space-y-1">
            {items.map((item) => {
              const IconComp = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded ${
                      seniorMode ? 'text-base' : 'text-xs'
                    } font-medium transition-colors ${
                      isActive
                        ? 'bg-[#0f62fe] text-white font-semibold'
                        : 'text-[#c6c6c6] hover:bg-[#262626] hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <IconComp size={18} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <Tag type="warm-gray" size="sm" className="font-bold">
                      {item.badge}
                    </Tag>
                  )}
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#393939] flex items-center justify-between">
            <button
              onClick={() => setSeniorMode(!seniorMode)}
              className="text-xs text-[#f1c21b] font-medium"
            >
              {seniorMode ? 'Disable Senior Mode' : 'Enable Senior Mode'}
            </button>
            <button
              onClick={() => {
                signOut();
                window.location.assign('/welcome');
              }}
              className="flex items-center gap-1.5 text-xs text-[#ff8389] hover:underline"
            >
              <Logout size={14} />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="pt-2">
            <DemoModeIndicator />
          </div>
        </div>
      )}
    </header>
  );
};
