import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Globe,
  Shield,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { PresenterControlModal } from '../demo/PresenterControlModal';
import { useLanguage, LANGUAGES, SupportedLanguage } from '../../context/LanguageContext';
import { useDemoMode } from '../../context/DemoModeContext';
import { useNotification } from '../../context/NotificationContext';
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
    description: 'Complainant profile, IBM watsonx.ai bridge, and evaluation data controls.',
  },
};

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, currentMeta } = useLanguage();
  const { isBackendConnected, isDemoMode } = useDemoMode();
  const { activeUserId, switchUser, activeProfileName, activeProfileRole, isWsConnected } = useNotification();

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
    description: 'Cybersecurity and family protection platform.',
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/incident-history?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unacknowledgedAlerts = alerts.filter((a) => a.status !== 'ACKNOWLEDGED');

  return (
    <header className="hidden md:flex flex-col bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Page Title & Contextual Description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
              {currentPage.title}
            </h1>
            <span className="hidden xl:inline-block text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              {currentMeta.tagline}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{currentPage.description}</p>
        </div>

        {/* Global Incident Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-64 lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scans, UTR, or suspect..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-teal-700 transition-colors"
          />
        </form>

        {/* Action Controls & Profile Area */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={languageRef}>
            <button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              aria-label="Select language"
              aria-expanded={isLanguageOpen}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentMeta.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-40 text-xs">
                <div className="px-3 py-1.5 border-b border-slate-100 font-semibold text-slate-500 text-[10px] uppercase">
                  Language / भाषा
                </div>
                {Object.values(LANGUAGES).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsLanguageOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between ${
                      language === lang.code ? 'font-bold text-teal-800 bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({lang.name})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Indicator Bell */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 bg-slate-50 transition-colors"
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
              <div className="absolute right-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden text-xs">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Family Security Alerts</span>
                  <span className="text-[10px] text-slate-500">
                    {unacknowledgedAlerts.length} pending acknowledgment
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="p-4 text-center text-slate-500">
                      No security alerts delivered yet.
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="p-3 hover:bg-slate-50/70 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900 leading-tight">
                            {alert.threat_title}
                          </p>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-medium shrink-0 ${
                              alert.status === 'ACKNOWLEDGED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-800 font-bold'
                            }`}
                          >
                            {alert.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {alert.message_content}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(alert.delivered_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/family-shield');
                    }}
                    className="text-xs font-semibold text-teal-800 hover:text-teal-900"
                  >
                    Open Family Shield Alerts Log →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Demo Session Switcher */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={() => switchUser(activeUserId === '1' ? '2' : '1')}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group text-left"
              title="Click to toggle between Rajesh Sharma (Protected) and Aarav Sharma (Guardian)"
            >
              <div className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs ${
                activeUserId === '2' ? 'bg-indigo-700' : 'bg-slate-800'
              }`}>
                {activeProfileName.charAt(0)}
              </div>
              <div className="hidden lg:block leading-none">
                <span className="text-xs font-bold text-slate-900 block truncate max-w-[120px] group-hover:text-teal-800">
                  {activeProfileName}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {activeProfileRole} &bull; Switch
                </span>
              </div>
            </button>

            {/* WebSocket / Backend Connection Status Pill */}
            <div
              className={`ml-1 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                isWsConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={isWsConnected ? 'FastAPI WebSockets live' : 'Connecting to live notification transport...'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isWsConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span>{isWsConnected ? 'Live WS' : 'Connecting'}</span>
            </div>

            {/* Presenter Deck Live Controls Button */}
            <button
              type="button"
              onClick={() => setIsPresenterModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-teal-900 text-teal-300 hover:text-white border border-slate-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Open Hackathon Presenter Deck (Scenarios, Health & Evaluations)"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Presenter Deck</span>
            </button>
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
