import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Globe,
  ChevronDown,
  Sparkles,
  Eye,
  LogOut,
} from 'lucide-react';
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [alerts, setAlerts] = useState<FamilyAlert[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isPresenterModalOpen, setIsPresenterModalOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
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
    <header className="hidden lg:flex flex-col bg-white border-b border-[#E2E8F0] px-6 py-3.5 sticky top-0 z-30 shadow-subtle">
      <div className="flex items-center justify-between gap-4">
        {/* Page Title & Contextual Description */}
        <div className="min-w-[11rem] flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-[#142A36] tracking-tight leading-tight truncate">
              {currentPage.title}
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5 truncate">{currentPage.description}</p>
        </div>

        {/* Global Incident Search (hidden in Senior Mode to simplify the screen) */}
        {!seniorMode && (
        <form onSubmit={handleSearchSubmit} className="relative hidden xl:block flex-1 min-w-[9rem] max-w-[16rem]">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scans, UTR, or suspect..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F8F4] border border-[#E2E8F0] rounded-xl text-[#142A36] placeholder:text-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#176B58] focus:border-[#176B58] transition-colors"
          />
        </form>
        )}

        {/* Action Controls & Profile Area */}
        <div className="flex items-center gap-2 xl:gap-3 shrink-0">
          <ViewModeToggle />
          <button
            type="button"
            onClick={() => setSeniorMode(!seniorMode)}
            aria-pressed={seniorMode}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
              seniorMode
                ? 'bg-amber-400 text-slate-950 border-amber-500'
                : 'bg-white text-[#142A36] border-[#CBD5E1] hover:bg-[#F7F8F4]'
            }`}
            title="Larger text, higher contrast and a simpler home screen"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden xl:inline whitespace-nowrap">{seniorMode ? 'Senior Mode: ON' : 'Senior Mode'}</span>
          </button>
          {/* Language Selector Dropdown */}
          <div className="relative" ref={languageRef}>
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#142A36] bg-[#F7F8F4] hover:bg-[#EEF1EB] border border-[#E2E8F0] rounded-xl transition-colors cursor-pointer"
              aria-label="Select language"
              aria-expanded={isLanguageOpen}
            >
              <Globe className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="hidden xl:inline">{currentMeta.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-[#E2E8F0] rounded-2xl shadow-dropdown py-1 z-40 text-xs">
                <div className="px-3 py-1.5 border-b border-[#F1F5F9] font-semibold text-[#64748B] text-[10px] uppercase">
                  Language / भाषा
                </div>
                {Object.values(LANGUAGES).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-[#F7F8F4] flex items-center justify-between transition-colors ${
                      language === lang.code ? 'font-bold text-[#176B58] bg-[#DCEDE5]/60' : 'text-[#142A36]'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-[#94A3B8] font-mono">({lang.name})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Indicator Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-[#64748B] hover:text-[#142A36] hover:bg-[#F7F8F4] rounded-xl border border-[#E2E8F0] bg-white transition-colors cursor-pointer"
              aria-label="View alerts and notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="w-4 h-4" />
              {unacknowledgedAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unacknowledgedAlerts.length}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white border border-[#E2E8F0] rounded-2xl shadow-dropdown z-40 overflow-hidden text-xs">
                <div className="p-3 border-b border-[#F1F5F9] bg-[#F7F8F4] flex items-center justify-between">
                  <span className="font-bold text-[#142A36] text-xs">Family Security Alerts</span>
                  <span className="text-[10px] text-[#64748B]">
                    {unacknowledgedAlerts.length} pending
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#F1F5F9]">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-[#94A3B8]">
                      No security alerts delivered yet.
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="p-3 hover:bg-[#F7F8F4] transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-[#142A36] leading-tight">
                            {alert.threat_title}
                          </p>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium shrink-0 ${
                              alert.status === 'ACKNOWLEDGED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-900 font-bold'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-1 line-clamp-2">
                          {alert.message_content}
                        </p>
                        <span className="text-[10px] text-[#94A3B8] mt-1 block">
                          {new Date(alert.delivered_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-[#F1F5F9] bg-[#F7F8F4] text-center">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/family-shield');
                    }}
                    className="text-xs font-semibold text-[#176B58] hover:text-[#135948] cursor-pointer"
                  >
                    Open Family Shield Alerts Log →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Demo Session Switcher */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
            <button
              onClick={() => switchUser(activeUserId === '1' ? '2' : '1')}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F7F8F4] transition-colors cursor-pointer group text-left"
              title="Click to toggle between Rajesh Sharma (Protected) and Aarav Sharma (Guardian)"
            >
              <div className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-subtle ${
                activeUserId === '2' ? 'bg-[#176B58]' : 'bg-[#142A36]'
              }`}>
                {activeProfileName.charAt(0)}
              </div>
              <div className="hidden 2xl:block leading-none">
                <span className="text-xs font-bold text-[#142A36] block truncate max-w-[120px] group-hover:text-[#176B58]">
                  {activeProfileName}
                </span>
                <span className="text-[10px] text-[#64748B] block mt-0.5">
                  {activeProfileRole} &bull; Switch
                </span>
              </div>
            </button>

            {/* WebSocket / Backend Connection Status Pill */}
            <div
              className={`ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border ${
                isWsConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}
              title={isWsConnected ? 'FastAPI WebSockets live' : 'Connecting to live notification transport...'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isWsConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span className="hidden 2xl:inline">{isWsConnected ? 'Live WS' : 'Connecting'}</span>
            </div>

            {/* Presenter Deck Live Controls Button */}
            <button
              type="button"
              onClick={() => {
                signOut();
                window.location.assign('/welcome');
              }}
              className="p-2 rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#142A36] hover:bg-[#F7F8F4] cursor-pointer"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            {!seniorMode && (
            <button
              type="button"
              onClick={() => setIsPresenterModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#142A36] hover:bg-[#1A3342] text-[#DCEDE5] hover:text-white border border-[#244356] text-xs font-semibold shadow-subtle transition-all cursor-pointer"
              title="Open Hackathon Presenter Deck (Scenarios, Health & Evaluations)"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#DCEDE5]" />
              <span className="hidden 2xl:inline">Presenter Deck</span>
            </button>
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
