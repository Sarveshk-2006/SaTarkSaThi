import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Notification,
  Globe,
  ChevronDown,
  View,
  Logout,
  Search as SearchIcon,
  UserProfile as UserProfileIcon,
  Flash,
} from '@carbon/icons-react';
import { Tag, Button } from '@carbon/react';
import { PresenterControlModal } from '../demo/PresenterControlModal';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';
import { useNotification } from '../../context/NotificationContext';
import { useSeniorMode } from '../../context/SeniorModeContext';
import { useAuthSession } from '../../context/AuthSessionContext';
import { ViewModeToggle } from '../appmode/ViewModeToggle';
import { api } from '../../api/endpoints';
import { FamilyAlert, UserProfile } from '../../api/types';

interface PageMeta {
  title: string;
  description: string;
}

const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Security Overview',
    description: 'Real-time family cyber protection metrics and operational threat status.',
  },
  '/scanner': {
    title: 'Scam Analyzer',
    description: 'Forensic pattern detection for digital arrest, extortion, and phishing messages.',
  },
  '/payment-checkpoint': {
    title: 'Payment Checkpoint',
    description: 'Pre-transaction UPI VPA scanner and pin-protection checklist.',
  },
  '/family-shield': {
    title: 'Family Shield Network',
    description: 'Manage trusted family guardians and real-time security alert dispatches.',
  },
  '/golden-hour': {
    title: 'Golden Hour Recovery Desk',
    description: 'Immediate 1930 Cyber Helpline filing, bank freezes, and legal complaint drafts.',
  },
  '/incident-history': {
    title: 'Incident History & Audit',
    description: 'Complete forensic archive of analyzed scans and reported fraud incidents.',
  },
  '/settings': {
    title: 'Platform Settings',
    description: 'Profile, Senior Mode, discreet safety phrase, and honest integration status.',
  },
  '/mock-upi': {
    title: 'Mock UPI App (Demo)',
    description: 'Prototype payment app calling the Satark Safety SDK boundary. Not a real UPI app; no money moves.',
  },
};

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, currentMeta } = useLanguage();
  const { activeUserId, switchUser, activeProfileName, activeProfileRole, isWsConnected } = useNotification();
  const { seniorMode, setSeniorMode } = useSeniorMode();
  const { signOut } = useAuthSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [, setProfile] = useState<UserProfile | null>(null);
  const [alerts, setAlerts] = useState<FamilyAlert[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isPresenterModalOpen, setIsPresenterModalOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    api.getProfile().then(setProfile).catch(() => {});
    api.getAlerts().then(setAlerts).catch(() => {});
  }, [location.pathname]);

  const currentPage = PAGE_META[location.pathname] || {
    title: 'Satark Saathi',
    description: 'Digital scam prevention and family safety platform.',
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/incident-history?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unacknowledgedAlerts = alerts.filter((a) => a.status !== 'ACKNOWLEDGED');

  return (
    <header className="hidden lg:flex flex-col bg-white/95 backdrop-blur-md shadow-xs border-b border-[#e0e0e0] px-6 py-3 sticky top-0 z-30 font-sans">
      <div className="flex items-center justify-between gap-4">
        {/* Page Title & Contextual Description */}
        <div className="min-w-[11rem] flex-1">
          <h1 className="text-lg font-semibold text-[#161616] tracking-tight leading-tight truncate">
            {currentPage.title}
          </h1>
          <p className="text-xs text-[#525252] mt-0.5 truncate">{currentPage.description}</p>
        </div>

        {/* Global Incident Search (hidden in Senior Mode to simplify screen) */}
        {!seniorMode && (
          <form onSubmit={handleSearchSubmit} className="relative hidden xl:block flex-1 min-w-[10rem] max-w-[18rem]">
            <SearchIcon size={16} className="text-[#525252] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scans, UTR, or suspect..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f4f4] border border-[#e0e0e0] rounded text-[#161616] placeholder:text-[#8d8d8d] focus:bg-white focus:outline-none focus:border-[#0f62fe] transition-colors"
            />
          </form>
        )}

        {/* Action Controls & Profile Area */}
        <div className="flex items-center gap-2 xl:gap-3 shrink-0">
          <ViewModeToggle />

          {/* Senior Mode Toggle */}
          <Button
            kind={seniorMode ? 'secondary' : 'ghost'}
            size="sm"
            renderIcon={View}
            onClick={() => setSeniorMode(!seniorMode)}
            aria-pressed={seniorMode}
            className={seniorMode ? 'bg-[#f1c21b] text-[#161616] font-semibold' : ''}
            title="Larger text, higher contrast and simpler layout"
          >
            <span className="hidden xl:inline">{seniorMode ? 'Senior Mode: ON' : 'Senior Mode'}</span>
          </Button>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={languageRef}>
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#161616] bg-[#f4f4f4] hover:bg-[#e0e0e0] border border-[#e0e0e0] rounded transition-colors cursor-pointer"
              aria-label="Select language"
              aria-expanded={isLanguageOpen}
            >
              <Globe size={16} className="text-[#525252]" />
              <span className="hidden xl:inline">{currentMeta.nativeName}</span>
              <ChevronDown size={14} className="text-[#525252]" />
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#e0e0e0] shadow-md py-1 z-40 text-xs">
                <div className="px-3 py-1.5 border-b border-[#e0e0e0] font-semibold text-[#525252] text-[10px] uppercase">
                  Language / भाषा
                </div>
                {Object.values(LANGUAGES).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#f4f4f4] flex items-center justify-between transition-colors ${
                      language === lang.code ? 'font-semibold text-[#0f62fe] bg-[#edf5ff]' : 'text-[#161616]'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-[#8d8d8d] font-mono">({lang.name})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Indicator Bell */}
          <div className="relative" ref={notificationsRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-[#525252] hover:text-[#161616] hover:bg-[#f4f4f4] border border-[#e0e0e0] bg-white rounded transition-colors cursor-pointer"
              aria-label="View alerts and notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Notification size={18} />
              {unacknowledgedAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#da1e28] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unacknowledgedAlerts.length}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-1.5 w-80 bg-white border border-[#e0e0e0] shadow-lg z-40 overflow-hidden text-xs"
                >
                  <div className="p-3 border-b border-[#e0e0e0] bg-[#f4f4f4] flex items-center justify-between">
                    <span className="font-semibold text-[#161616] text-xs">Family Security Alerts</span>
                    <Tag type="red" size="sm">
                      {unacknowledgedAlerts.length} pending
                    </Tag>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#e0e0e0]">
                    {alerts.length === 0 ? (
                      <div className="p-4 text-center text-[#8d8d8d]">
                        No security alerts delivered yet.
                      </div>
                    ) : (
                      alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="p-3 hover:bg-[#f4f4f4] transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-[#161616] leading-tight">
                              {alert.threat_title}
                            </p>
                            <Tag
                              type={alert.status === 'ACKNOWLEDGED' ? 'green' : 'warm-gray'}
                              size="sm"
                            >
                              {alert.status}
                            </Tag>
                          </div>
                          <p className="text-[11px] text-[#525252] mt-1 line-clamp-2">
                            {alert.message_content}
                          </p>
                          <span className="text-[10px] text-[#8d8d8d] mt-1 block">
                            {new Date(alert.delivered_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-[#e0e0e0] bg-[#f4f4f4] text-center">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        navigate('/family-shield');
                      }}
                      className="text-xs font-semibold text-[#0f62fe] hover:underline cursor-pointer"
                    >
                      Open Family Shield Alerts Log →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile & Demo Session Switcher */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#e0e0e0]">
            <button
              onClick={() => switchUser(activeUserId === '1' ? '2' : '1')}
              className="flex items-center gap-2 p-1.5 rounded hover:bg-[#f4f4f4] transition-colors cursor-pointer group text-left border border-transparent hover:border-[#e0e0e0]"
              title="Click to toggle between Rajesh Sharma (Protected) and Aarav Sharma (Guardian)"
            >
              <div
                className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs ${
                  activeUserId === '2' ? 'bg-[#0f62fe]' : 'bg-[#161616]'
                }`}
              >
                {activeProfileName.charAt(0)}
              </div>
              <div className="hidden 2xl:block leading-none">
                <span className="text-xs font-semibold text-[#161616] block truncate max-w-[120px] group-hover:text-[#0f62fe]">
                  {activeProfileName}
                </span>
                <span className="text-[10px] text-[#525252] block mt-0.5">
                  {activeProfileRole} &bull; Switch
                </span>
              </div>
            </button>

            {/* WebSocket / Backend Connection Status Pill */}
            <Tag
              type={isWsConnected ? 'green' : 'warm-gray'}
              size="sm"
              title={isWsConnected ? 'FastAPI WebSockets live' : 'Connecting to live notification transport...'}
              className="m-0"
            >
              <span className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isWsConnected ? 'bg-[#24a148]' : 'bg-[#f1c21b] animate-pulse'
                  }`}
                />
                <span className="hidden 2xl:inline">{isWsConnected ? 'Live WS' : 'Connecting'}</span>
              </span>
            </Tag>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => {
                signOut();
                window.location.assign('/welcome');
              }}
              className="p-1.5 border border-[#e0e0e0] bg-white text-[#525252] hover:text-[#161616] hover:bg-[#f4f4f4] rounded cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <Logout size={16} />
            </button>

            {/* Presenter Deck Live Controls Button */}
            {!seniorMode && (
              <Button
                kind="tertiary"
                size="sm"
                renderIcon={Flash}
                onClick={() => setIsPresenterModalOpen(true)}
                title="Open Hackathon Presenter Deck (Scenarios, Health & Evaluations)"
              >
                <span className="hidden 2xl:inline">Presenter Deck</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Presenter Control Modal */}
      <PresenterControlModal
        isOpen={isPresenterModalOpen}
        onClose={() => setIsPresenterModalOpen(false)}
      />
    </header>
  );
};
