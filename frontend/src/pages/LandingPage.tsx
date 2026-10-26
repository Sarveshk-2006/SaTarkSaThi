import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  Security,
  WarningAlt,
  Warning,
  CheckmarkFilled,
  Phone,
  Flash,
  UserMultiple,
  Wallet,
  Launch,
  Document,
  Chat,
  Information,
  Help,
  Close,
  Menu,
  ChevronDown,
} from '@carbon/icons-react';
import { Button, Tag } from '@carbon/react';
import { useAuthSession } from '../context/AuthSessionContext';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface DemoScenario {
  id: string;
  category: string;
  sender: string;
  timestamp: string;
  messageText: string;
  severity: 'Severe Risk' | 'High Risk' | 'Suspicious';
  tagKind: 'red' | 'warm-gray' | 'teal';
  indicators: string[];
  counterSignals: string[];
  explanation: string;
  recommendedAction: string;
  metricLabel: string;
  metricValue: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'sbi-kyc',
    category: 'Bank / KYC Impersonation',
    sender: '+91 98210-44129 (Disguised as SBI-INB)',
    timestamp: 'Today, 11:42 AM',
    messageText:
      'Dear SBI Customer, your YONO account has been suspended due to pending PAN KYC. Click http://sbi-secure-kyc.in/portal to update immediately within 2 hours or your debit card will be permanently blocked.',
    severity: 'Severe Risk',
    tagKind: 'red',
    indicators: [
      'Unregistered third-party domain: sbi-secure-kyc.in (Official bank domain is sbi.co.in)',
      'Artificial coercive urgency: 2-hour account suspension ultimatum',
      'Requests PAN and banking credentials through unverified HTTP web form',
    ],
    counterSignals: [
      'Message sent from a standard +91 10-digit mobile number instead of an authorized 6-character bank shortcode (e.g. VK-SBIINB)',
    ],
    explanation:
      'Public-sector banks never issue SMS alerts demanding immediate KYC compliance via arbitrary .in domains or threaten 2-hour card deactivation. This is an aggressive credential-harvesting vector targeting net-banking passwords and OTPs.',
    recommendedAction:
      'Do not tap or forward the link. Verify your actual account status inside the official YONO application or visit your home branch.',
    metricLabel: 'Urgency Pressure',
    metricValue: '94% Coercive',
  },
  {
    id: 'power-bill',
    category: 'Utility Disconnection Scam',
    sender: '+91 87621-99014 (Electricity Billing Officer)',
    timestamp: 'Today, 7:15 PM',
    messageText:
      'Urgent: Your electricity power supply will be disconnected tonight at 9:30 PM by electricity office because your previous month bill was not updated. Please immediately contact our bill officer at 9832104412 or download Mahavitaran-QuickPay.apk.',
    severity: 'High Risk',
    tagKind: 'red',
    indicators: [
      'Demands sideloading an untrusted Android APK file (remote-access trojan)',
      'Extreme time pressure threatening nighttime power outage within 2 hours',
      'Directs citizen to an unofficial personal mobile number for instant settlement',
    ],
    counterSignals: [
      'Official discoms provide consumer CA numbers, invoice references, and 15-day formal notice before disconnection',
    ],
    explanation:
      'Electricity distribution companies never demand payment through personal mobile numbers or instruct consumers to install .apk files via WhatsApp or SMS. The APK file is typically remote-access malware (RAT) designed to intercept SMS OTPs.',
    recommendedAction:
      'Never download or install APK files from SMS links. Check your electricity bill status exclusively through your state discom portal or official consumer app.',
    metricLabel: 'Malware Risk',
    metricValue: 'Remote RAT Vector',
  },
  {
    id: 'digital-arrest',
    category: 'Digital Arrest / Legal Extortion',
    sender: 'CBI / Mumbai Cyber Police (VoIP Skype Notice)',
    timestamp: 'Today, 2:10 PM',
    messageText:
      'Notice of Immediate Warrant: An illegal FedEx parcel containing expired passports and narcotics was intercepted at Mumbai International Airport registered under your Aadhaar. You must remain on video call for interrogation or a non-bailable arrest warrant will be executed.',
    severity: 'Severe Risk',
    tagKind: 'red',
    indicators: [
      'Claims of "Digital Arrest" via Skype, WhatsApp video, or Telegram (No such legal procedure exists in Indian Law)',
      'Coercive isolation tactic forbidding victim from disconnecting or speaking with family',
      'Demands transfer of funds to "RBI Secret Supervision" or "Court Verification" accounts',
    ],
    counterSignals: [
      'Law enforcement agencies (CBI, ED, Police) issue formal physical summons under CrPC/BNSS, never video-call arrest warrants',
    ],
    explanation:
      'The Supreme Court of India, CBI, and Ministry of Home Affairs have explicitly stated that "Digital Arrest" is completely fraudulent. Law enforcement agencies never interrogate citizens via video calls or ask for funds to be transferred for clearing names.',
    recommendedAction:
      'Disconnect the video call immediately. Do not transfer funds. Report the caller ID and screenshot to the National Cybercrime Helpline 1930.',
    metricLabel: 'Extortion Pressure',
    metricValue: 'Extreme Panic Vector',
  },
];

const WHY_VECTORS = [
  {
    icon: WarningAlt,
    title: 'Impersonation & KYC Suspension',
    description:
      'Fraudsters disguise SMS sender headers as national banks (SBI, HDFC, PNB) threatening instant freeze of pensions or savings accounts unless PAN is re-verified.',
    badge: 'Banking Vector',
  },
  {
    icon: Flash,
    title: 'Midnight Utility Cutoffs',
    description:
      'Panicked shopkeepers and senior citizens receive evening SMS alerts threatening power disconnection within two hours unless a fraudulent APK is downloaded.',
    badge: 'Utility Vector',
  },
  {
    icon: Security,
    title: 'Digital Arrest & Courier Coercion',
    description:
      'Organized crime syndicates pose as police, CBI, or customs officials on video calls, keeping victims isolated for hours while demanding "bail clearance" transfers.',
    badge: 'Extortion Vector',
  },
  {
    icon: Wallet,
    title: 'Work-from-Home & Task Traps',
    description:
      'Telegram channels promise lucrative daily earnings for rating hotels or videos, leading victims through psychological escalation into irreversible deposits.',
    badge: 'Investment Vector',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Share',
    description:
      'Paste suspicious text, forwarded SMS, WhatsApp messages, unverified URLs, or upload a payment screenshot for instant analysis.',
  },
  {
    step: '02',
    title: 'Assess',
    description:
      'Satark Saathi runs dual heuristic and AI threat models cross-referencing known banking shortcodes, domain typo-squats, and coercive phrasing.',
  },
  {
    step: '03',
    title: 'Understand',
    description:
      'Receive an explainable risk dossier detailing matched threat indicators, counter-signals, domain authenticity, and plain-language reasoning.',
  },
  {
    step: '04',
    title: 'Act Safely',
    description:
      'Follow step-by-step verification protocols, alert linked family guardians, or compile a complete Golden Hour dossier for helpline 1930.',
  },
];

const INPUT_CAPABILITIES = [
  {
    icon: Chat,
    title: 'Suspicious Messages & SMS',
    status: 'Operational',
    statusKind: 'teal' as const,
    description:
      'Analyzes SMS sender headers, coercive time limits, unverified banking claims, and credential-harvesting phrasing.',
    limitation: 'Best with full message body and sender headers intact.',
  },
  {
    icon: Launch,
    title: 'Phishing URLs & Web Domains',
    status: 'Operational',
    statusKind: 'teal' as const,
    description:
      'Detects typo-squatted bank portals, suspicious top-level domains, newly registered domains, and credential submission forms.',
    limitation: 'Static URL heuristics; live sandbox fetches are rate-limited.',
  },
  {
    icon: Document,
    title: 'Screenshots & Receipts (OCR)',
    status: 'Operational',
    statusKind: 'teal' as const,
    description:
      'Extracts text from screenshots of UPI payment requests, suspicious WhatsApp chats, and fraudulent courier summons.',
    limitation: 'High-contrast images recommended; handwriting recognition not supported.',
  },
  {
    icon: Phone,
    title: 'Call Transcripts & Voicemails',
    status: 'Operational',
    statusKind: 'teal' as const,
    description:
      'Evaluates verbal coercion transcripts for impersonation keywords, threats of legal action, and demands for immediate fund transfer.',
    limitation: 'Requires text transcript input or uploaded audio file.',
  },
  {
    icon: Wallet,
    title: 'Payment Checkpoint',
    status: 'Operational',
    statusKind: 'teal' as const,
    description:
      'Pre-transactional psychological cooling-off, recipient VPA verification, and coercive pressure evaluation before funds leave your account.',
    limitation: 'Pre-flight advisory assessment; does not replace your bank OTP authentication.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'What is Satark Saathi and how does it protect citizens?',
    answer:
      'Satark Saathi (सतर्क साथी) is an AI-assisted digital public-safety platform designed to prevent cyber fraud and support victims in India. It enables citizens to analyze suspicious messages, verify coercive payment demands, link elderly family members through Family Shield, and compile structured recovery dossiers during the critical Golden Hour.',
  },
  {
    question: 'Does Satark Saathi automatically freeze bank accounts or contact the police?',
    answer:
      'No. Satark Saathi is strictly an advisory defense system. It generates structured, evidence-backed incident dossiers that citizens or law enforcement can immediately use. To officially freeze fraudulent transactions, citizens must dial the National Cybercrime Helpline 1930 or submit a complaint on the official government portal at cybercrime.gov.in.',
  },
  {
    question: 'What types of content can I check right now?',
    answer:
      'You can check suspicious text messages (SMS and WhatsApp), phishing URLs, payment screenshots via client-side OCR, call transcripts, and pre-flight UPI payment scenarios. Each check provides matched warning indicators, counter-signals, and actionable safety steps.',
  },
  {
    question: 'How is my personal data and submitted message privacy protected?',
    answer:
      'Satark Saathi operates with a zero-leakage privacy model. We do not store plain-text banking passwords or sensitive credentials. Family Shield duress codes are stored solely as salted cryptographic hashes. Submitted messages are analyzed strictly for fraud indicators without advertising or third-party data broker sharing.',
  },
  {
    question: 'What should I do if I have already transferred money to a scammer?',
    answer:
      'Act immediately within the Golden Hour window (the first 2 to 3 hours). First, do not send any more money. Second, dial 1930 immediately to request an urgent lien on the recipient bank account. Third, file an official report at cybercrime.gov.in. Fourth, use Satark Saathi’s Golden Hour recovery desk to compile transaction IDs, timestamps, and screenshots into a structured PDF dossier for your bank and police.',
  },
  {
    question: 'How does Family Shield protect elderly family members without invading privacy?',
    answer:
      'Family Shield uses a mutual two-way consent architecture. It does not monitor personal private chats or bank balances. Instead, if an elderly member encounters a high-risk scam signal or triggers their discrete safety phrase, linked guardians receive an immediate cross-device alert so they can intervene before an irreversible payment is made.',
  },
];

export const LandingPage: React.FC = () => {
  const { session } = useAuthSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const scenario = DEMO_SCENARIOS[selectedScenarioIndex];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Respect prefers-reduced-motion
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.gsap-hero-header, .gsap-hero-eyebrow, .gsap-hero-title, .gsap-hero-desc, .gsap-hero-cta, .gsap-hero-trust, .gsap-hero-preview, .gsap-floating-card, .gsap-reveal', {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: 'all',
        });
      });

      // Default animated experience
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Hero entrance timeline
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        heroTl
          .from('.gsap-hero-header', { y: -16, opacity: 0, duration: 0.6 })
          .from('.gsap-hero-eyebrow', { y: 14, opacity: 0, duration: 0.5 }, '-=0.3')
          .from('.gsap-hero-title', { y: 22, opacity: 0, duration: 0.7 }, '-=0.3')
          .from('.gsap-hero-desc', { y: 18, opacity: 0, duration: 0.6 }, '-=0.4')
          .from('.gsap-hero-cta', { y: 16, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.3')
          .from('.gsap-hero-trust', { opacity: 0, duration: 0.5 }, '-=0.2')
          .from('.gsap-hero-preview', { y: 30, opacity: 0, scale: 0.98, duration: 0.8 }, '-=0.6')
          .from('.gsap-floating-card', { y: 16, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.4');

        // ScrollTrigger section reveals
        const sections = gsap.utils.toArray<HTMLElement>('.gsap-section');
        sections.forEach((sec) => {
          const targets = sec.querySelectorAll('.gsap-reveal');
          if (targets.length > 0) {
            gsap.from(targets, {
              scrollTrigger: {
                trigger: sec,
                start: 'top 82%',
                toggleActions: 'play none none none',
              },
              y: 28,
              opacity: 0,
              stagger: 0.08,
              duration: 0.65,
              ease: 'power2.out',
            });
          }
        });
      });
    },
    { scope: containerRef }
  );

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#F7F9FC] text-[#182230] font-sans antialiased selection:bg-[#0F766E]/15">
      {/* -------------------------------------------------------------------------
          SECTION 1: Header and Navigation (Clean, restrained, sticky)
          ------------------------------------------------------------------------- */}
      <header className="gsap-hero-header sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand mark */}
          <Link
            to="/welcome"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#0F62FE] rounded px-1 py-0.5"
            aria-label="Satark Saathi Home"
          >
            <div className="w-9 h-9 rounded-lg bg-[#0F766E] text-white flex items-center justify-center shadow-sm group-hover:bg-[#0d655e] transition-colors">
              <Security size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-[#182230]">
                Satark Saathi
              </span>
              <span className="text-[11px] text-[#586474] font-medium leading-none">
                सतर्क साथी &bull; Stop. Verify. Stay Safe.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#586474]" aria-label="Main Navigation">
            <a href="#why" className="hover:text-[#0F766E] transition-colors">Why Satark</a>
            <a href="#how" className="hover:text-[#0F766E] transition-colors">How It Works</a>
            <a href="#inputs" className="hover:text-[#0F766E] transition-colors">Capabilities</a>
            <a href="#family-shield" className="hover:text-[#0F766E] transition-colors">Family Shield</a>
            <a href="#recovery" className="hover:text-[#0F766E] transition-colors">Recovery 1930</a>
            <a href="#faq" className="hover:text-[#0F766E] transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="tel:1930"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#D92D20] bg-[#FEF3F2] border border-[#FECDCA] rounded-full hover:bg-[#FEE4E2] transition-colors"
              title="Official National Cybercrime Helpline 1930"
              aria-label="Call National Cybercrime Helpline 1930"
            >
              <Phone size={14} />
              <span>Helpline 1930</span>
            </a>

            <Link to="/scanner">
              <Button kind="primary" size="sm" renderIcon={ArrowRight}>
                Check a message
              </Button>
            </Link>

            {session ? (
              <Link to="/">
                <Button kind="tertiary" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button kind="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#586474] hover:text-[#182230] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F62FE]"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <Close size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-[#586474]">
              <a
                href="#why"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded hover:bg-[#F7F9FC] hover:text-[#0F766E]"
              >
                Why Satark Saathi
              </a>
              <a
                href="#how"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded hover:bg-[#F7F9FC] hover:text-[#0F766E]"
              >
                How It Works
              </a>
              <a
                href="#inputs"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded hover:bg-[#F7F9FC] hover:text-[#0F766E]"
              >
                What You Can Check
              </a>
              <a
                href="#family-shield"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded hover:bg-[#F7F9FC] hover:text-[#0F766E]"
              >
                Family Shield
              </a>
              <a
                href="#recovery"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded hover:bg-[#F7F9FC] hover:text-[#0F766E]"
              >
                Emergency Recovery (1930)
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded hover:bg-[#F7F9FC] hover:text-[#0F766E]"
              >
                Frequently Asked Questions
              </a>
            </nav>

            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
              <Link to="/scanner" onClick={() => setMobileMenuOpen(false)}>
                <Button kind="primary" size="md" className="w-full justify-between" renderIcon={ArrowRight}>
                  Check for a scam
                </Button>
              </Link>
              <a
                href="tel:1930"
                className="flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold text-[#D92D20] bg-[#FEF3F2] border border-[#FECDCA] rounded"
              >
                <Phone size={16} />
                <span>Call National Helpline 1930</span>
              </a>
              {session ? (
                <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                  <Button kind="tertiary" size="md" className="w-full">
                    Command Centre
                  </Button>
                </Link>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button kind="ghost" size="md" className="w-full">
                    Sign in to Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main>
        {/* -------------------------------------------------------------------------
            SECTION 2 & 3: Hero Section & Interactive Product Demonstration
            ------------------------------------------------------------------------- */}
        <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-[#F7F9FC] to-[#F7F9FC] border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
              {/* Left Column: Headline, Description, and CTAs */}
              <div className="lg:col-span-6 space-y-6">
                {/* Eyebrow badge */}
                <div className="gsap-hero-eyebrow inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F4F2] text-[#0F766E] border border-[#BCE3DE]">
                  <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
                  <span>Digital Public Safety &bull; AI-Powered Cyber-Fraud Defense</span>
                </div>

                {/* Slogan & Headline */}
                <h1 className="gsap-hero-title text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#182230] leading-[1.15]">
                  Stop. Verify. <br className="hidden sm:block" />
                  <span className="text-[#0F766E]">Stay Safe.</span>
                </h1>

                {/* Supporting copy */}
                <p className="gsap-hero-desc text-base sm:text-lg text-[#586474] leading-relaxed max-w-xl">
                  Check suspicious messages, phishing links, and coercive payment demands before you act. Understand hidden warning signals, assess coercive pressure, and get immediate, verified recovery steps.
                </p>

                {/* CTAs */}
                <div className="gsap-hero-cta flex flex-wrap items-center gap-3 pt-2">
                  <Link to="/scanner">
                    <Button kind="primary" size="lg" renderIcon={ArrowRight}>
                      Check for a scam
                    </Button>
                  </Link>

                  <Link to="/golden-hour">
                    <Button kind="tertiary" size="lg" renderIcon={Flash}>
                      Already affected? Get recovery guidance
                    </Button>
                  </Link>
                </div>

                {/* Trust and Assurance Micro-Indicators */}
                <div className="gsap-hero-trust pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[#E2E8F0]/80">
                  <div className="flex items-start gap-2">
                    <CheckmarkFilled size={16} className="text-[#0F766E] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#182230]">Helpline 1930</p>
                      <p className="text-[11px] text-[#586474]">Aligned with National Cybercrime Portal standards</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckmarkFilled size={16} className="text-[#0F766E] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#182230]">Zero Plaintext</p>
                      <p className="text-[11px] text-[#586474]">Salted cryptographic hashes for all confidential phrases</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckmarkFilled size={16} className="text-[#0F766E] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-[#182230]">Advisory Defense</p>
                      <p className="text-[11px] text-[#586474]">Plain-language indicators, no black-box scores</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Realistic Product Preview & Floating Contextual Cards */}
              <div className="lg:col-span-6 relative">
                {/* Threat scenario switcher tabs */}
                <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-semibold text-[#586474] uppercase tracking-wider mr-1">
                    Try Scenario:
                  </span>
                  {DEMO_SCENARIOS.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedScenarioIndex(idx)}
                      className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap text-xs ${
                        selectedScenarioIndex === idx
                          ? 'bg-[#0F766E] text-white shadow-sm'
                          : 'bg-white text-[#586474] hover:bg-[#E2E8F0]/60 border border-[#E2E8F0]'
                      }`}
                    >
                      {s.category.split('/')[0].trim()}
                    </button>
                  ))}
                </div>

                {/* Main Product Preview Container */}
                <div className="gsap-hero-preview bg-white rounded-2xl border border-[#CBD5E1] shadow-xl overflow-hidden">
                  {/* Top Header of the Preview Card */}
                  <div className="px-5 py-3.5 bg-[#182230] text-white flex items-center justify-between gap-3 border-b border-[#334155]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#D92D20] animate-ping" />
                      <span className="font-mono text-xs font-semibold tracking-wide">
                        ANALYSIS DOSSIER &bull; {scenario.category.toUpperCase()}
                      </span>
                    </div>
                    <span className="inline-flex items-center text-[10px] font-mono uppercase tracking-wider bg-white/10 px-2.5 py-0.5 rounded text-white/90">
                      Illustrative Demo Preview
                    </span>
                  </div>

                  <div className="p-5 sm:p-6 space-y-5">
                    {/* Suspicious Incoming Message Box */}
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-[#586474]">
                        <span className="font-semibold text-[#182230]">From: {scenario.sender}</span>
                        <span>{scenario.timestamp}</span>
                      </div>
                      <p className="text-sm font-mono text-[#182230] bg-white p-3 rounded-lg border border-[#E2E8F0]/80 leading-relaxed break-words">
                        "{scenario.messageText}"
                      </p>
                    </div>

                    {/* Threat Assessment Header & Severity Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <Tag type={scenario.tagKind} size="md">
                          {scenario.severity}
                        </Tag>
                        <span className="text-xs font-semibold text-[#586474]">
                          Multi-Signal Risk Assessment
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#586474] font-medium mr-1.5">{scenario.metricLabel}:</span>
                        <span className="text-xs font-bold text-[#D92D20]">{scenario.metricValue}</span>
                      </div>
                    </div>

                    {/* Matched Warning Indicators */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#586474]">
                        Key Warning Signals:
                      </p>
                      <ul className="space-y-1.5 text-xs text-[#182230]">
                        {scenario.indicators.map((ind, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Warning size={14} className="text-[#D92D20] mt-0.5 shrink-0" />
                            <span>{ind}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Plain Language Explanation */}
                    <div className="p-3 bg-[#FEF3F2] border-l-4 border-[#D92D20] rounded-r-lg space-y-1">
                      <p className="text-xs font-bold text-[#D92D20] uppercase tracking-wider">
                        Why This Is Fraudulent:
                      </p>
                      <p className="text-xs text-[#586474] leading-relaxed">
                        {scenario.explanation}
                      </p>
                    </div>

                    {/* Recommended Safe Next Step */}
                    <div className="p-3.5 bg-[#E6F4F2] border border-[#BCE3DE] rounded-xl flex items-start gap-2.5">
                      <Security size={18} className="text-[#0F766E] mt-0.5 shrink-0" />
                      <div className="text-xs space-y-0.5">
                        <span className="font-bold text-[#0F766E] block">Immediate Recommended Action:</span>
                        <span className="text-[#182230] leading-relaxed block">{scenario.recommendedAction}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Footer Actions */}
                  <div className="px-5 py-3 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#586474]">
                      Have a similar message?
                    </span>
                    <Link to="/scanner" className="font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1">
                      <span>Analyze your own text</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Floating contextual micro-cards */}
                <div className="gsap-floating-card hidden sm:flex absolute -bottom-5 -left-4 bg-white border border-[#E2E8F0] shadow-lg rounded-xl px-3.5 py-2.5 items-center gap-2.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D92D20]" />
                  <div>
                    <span className="font-semibold text-[#182230] block">Fake Shortcode</span>
                    <span className="text-[10px] text-[#586474]">Unverified 10-digit mobile number</span>
                  </div>
                </div>

                <div className="gsap-floating-card hidden sm:flex absolute -top-4 -right-4 bg-white border border-[#E2E8F0] shadow-lg rounded-xl px-3.5 py-2.5 items-center gap-2.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
                  <div>
                    <span className="font-semibold text-[#182230] block">Helpline 1930 Integration</span>
                    <span className="text-[10px] text-[#586474]">One-tap dossier compilation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 4: Why Satark Saathi ("Scams do not always look suspicious")
            ------------------------------------------------------------------------- */}
        <section id="why" className="gsap-section py-20 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-4 mb-14">
              <span className="gsap-reveal text-xs font-bold uppercase tracking-wider text-[#0F766E] block">
                The Anatomy of Digital Fraud
              </span>
              <h2 className="gsap-reveal text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#182230]">
                Scams do not always look suspicious.
              </h2>
              <p className="gsap-reveal text-base text-[#586474] leading-relaxed">
                Modern cyber syndicates rarely send broken English or obvious lottery wins. They weaponize official bank logos, fake court orders, evening electricity deadlines, and deep psychological intimidation to force rapid, unverified fund transfers.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {WHY_VECTORS.map((vec, idx) => {
                const IconComponent = vec.icon;
                return (
                  <div
                    key={idx}
                    className="gsap-reveal bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl p-6 flex flex-col justify-between hover:border-[#CBD5E1] transition-all hover:shadow-md"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] text-[#0F766E] flex items-center justify-center shadow-sm">
                          <IconComponent size={20} />
                        </div>
                        <span className="text-[11px] font-semibold text-[#586474] bg-white px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                          {vec.badge}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-[#182230]">
                        {vec.title}
                      </h3>
                      <p className="text-xs text-[#586474] leading-relaxed">
                        {vec.description}
                      </p>
                    </div>

                    <div className="pt-5 mt-4 border-t border-[#E2E8F0]/70 flex items-center text-xs font-semibold text-[#0F766E]">
                      <span>Real-world threat profile</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 5: How It Works (4-Step Linear Sequence)
            ------------------------------------------------------------------------- */}
        <section id="how" className="gsap-section py-20 bg-[#F7F9FC] border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="gsap-reveal text-xs font-bold uppercase tracking-wider text-[#0F766E] block">
                Verification Protocol
              </span>
              <h2 className="gsap-reveal text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#182230]">
                Four steps to complete digital certainty.
              </h2>
              <p className="gsap-reveal text-sm sm:text-base text-[#586474]">
                A deliberate, calm pause between receiving an alarming notification and making an irreversible financial decision.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, idx) => (
                <div
                  key={idx}
                  className="gsap-reveal bg-white border border-[#E2E8F0] rounded-2xl p-6 relative flex flex-col justify-between shadow-sm hover:border-[#CBD5E1] transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono font-bold text-[#0F766E]/40">
                        {s.step}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#0F766E]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#182230]">
                      {s.title}
                    </h3>
                    <p className="text-xs text-[#586474] leading-relaxed">
                      {s.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-[#E2E8F0]/70 text-[11px] font-medium text-[#586474]">
                    Step {idx + 1} of 4
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link to="/scanner">
                <Button kind="primary" size="md" renderIcon={ArrowRight}>
                  Try the 4-step scanner now
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 6: What You Can Check (Capabilities & Honest Limitations)
            ------------------------------------------------------------------------- */}
        <section id="inputs" className="gsap-section py-20 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <div className="max-w-2xl space-y-3">
                <span className="gsap-reveal text-xs font-bold uppercase tracking-wider text-[#0F766E] block">
                  Supported Input Channels
                </span>
                <h2 className="gsap-reveal text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#182230]">
                  What you can check right now.
                </h2>
                <p className="gsap-reveal text-sm sm:text-base text-[#586474]">
                  Every analysis pipeline is calibrated for Indian fraud patterns with strict client-side data boundaries.
                </p>
              </div>

              <div className="gsap-reveal text-xs text-[#586474] bg-[#F7F9FC] border border-[#E2E8F0] p-3 rounded-xl max-w-sm">
                <p className="font-semibold text-[#182230] mb-0.5">Honest Capability Note:</p>
                <p>All assessments are advisory risk evaluations based on heuristic and semantic pattern analysis. They do not replace formal law-enforcement investigations.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {INPUT_CAPABILITIES.map((cap, idx) => {
                const IconComp = cap.icon;
                return (
                  <div
                    key={idx}
                    className="gsap-reveal bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl p-6 flex flex-col justify-between hover:border-[#CBD5E1] transition-all hover:shadow-sm"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] text-[#0F766E] flex items-center justify-center shadow-sm">
                          <IconComp size={20} />
                        </div>
                        <Tag type={cap.statusKind} size="sm">
                          {cap.status}
                        </Tag>
                      </div>

                      <h3 className="font-bold text-base text-[#182230]">
                        {cap.title}
                      </h3>

                      <p className="text-xs text-[#586474] leading-relaxed">
                        {cap.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#E2E8F0]/70 text-[11px] text-[#586474]">
                      <span className="font-semibold text-[#182230]">Scope:</span> {cap.limitation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 7: Explainable Risk Assessment ("No Black-Box Scores")
            ------------------------------------------------------------------------- */}
        <section className="gsap-section py-20 bg-[#F7F9FC] border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-5">
                <span className="gsap-reveal text-xs font-bold uppercase tracking-wider text-[#0F766E] block">
                  Transparency First
                </span>
                <h2 className="gsap-reveal text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#182230]">
                  No black-box scores. Understand exactly why a signal is flagged.
                </h2>
                <p className="gsap-reveal text-sm sm:text-base text-[#586474] leading-relaxed">
                  A high percentage score without context breeds confusion. Satark Saathi dissects every message into observable signals: official domain verification, linguistic urgency triggers, payment routing anomalies, and known scam signatures.
                </p>

                <div className="gsap-reveal space-y-3 pt-2">
                  <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex items-start gap-3">
                    <CheckmarkFilled size={18} className="text-[#0F766E] mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-[#182230] block">Domain Authenticity Check</span>
                      <span className="text-[#586474]">Cross-checked against certified Reserve Bank of India, Indian Banks' Association, and government domains.</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex items-start gap-3">
                    <CheckmarkFilled size={18} className="text-[#0F766E] mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-[#182230] block">Coercive Language Analysis</span>
                      <span className="text-[#586474]">Detects threats of immediate police warrants, power cuts, pension blockage, or family harm.</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex items-start gap-3">
                    <CheckmarkFilled size={18} className="text-[#0F766E] mt-0.5 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-[#182230] block">Counter-Signal Balance</span>
                      <span className="text-[#586474]">Recognizes legitimate transactional alerts with verified shortcodes and no unprompted link requests.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual Breakdown Dossier Card */}
              <div className="lg:col-span-6">
                <div className="gsap-reveal bg-white border border-[#CBD5E1] rounded-2xl p-6 shadow-md space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <Security size={18} className="text-[#0F766E]" />
                      <span className="font-bold text-sm text-[#182230]">Signal Scorecard Architecture</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#586474]">v2.4 Heuristic Model</span>
                  </div>

                  {/* Signal bars */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-[#182230]">Sender Header Trust</span>
                        <span className="text-[#D92D20] font-bold">Unverified 10-Digit Mobile (High Risk)</span>
                      </div>
                      <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#D92D20] h-full w-[88%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-[#182230]">Domain Squatting Severity</span>
                        <span className="text-[#D92D20] font-bold">Lookalike .in Domain (Severe)</span>
                      </div>
                      <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#D92D20] h-full w-[95%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-[#182230]">Urgency / Coercion Pressure</span>
                        <span className="text-[#B54708] font-bold">2-Hour Card Suspension Deadline</span>
                      </div>
                      <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#B54708] h-full w-[78%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-[#182230]">Counter-Signals Present</span>
                        <span className="text-[#586474]">None Detected (No official bank signatures)</span>
                      </div>
                      <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#586474] h-full w-[10%]" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E2E8F0] text-xs text-[#586474] flex items-center justify-between">
                    <span>Advisory Classification:</span>
                    <span className="font-bold text-[#D92D20]">Confirmed Impersonation Phishing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 8: Family Shield ("Make safer decisions with people you trust")
            ------------------------------------------------------------------------- */}
        <section id="family-shield" className="gsap-section py-20 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <span className="gsap-reveal text-xs font-bold uppercase tracking-wider text-[#0F766E] block">
                  Family Defense Architecture
                </span>
                <h2 className="gsap-reveal text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#182230]">
                  Make safer decisions with the people you trust.
                </h2>
                <p className="gsap-reveal text-sm sm:text-base text-[#586474] leading-relaxed">
                  Extortion scammers systematically isolate elderly parents and less tech-savvy relatives with threats of immediate arrest. Family Shield creates an unbreakable circle of trusted guardians.
                </p>

                <div className="gsap-reveal space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E6F4F2] text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                      <UserMultiple size={18} />
                    </div>
                    <div className="text-xs">
                      <h3 className="font-bold text-sm text-[#182230]">Mutual Two-Way Consent</h3>
                      <p className="text-[#586474]">No surveillance or chat spying. Both parties explicitly confirm guardianship linking through secure pairing codes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E6F4F2] text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                      <Security size={18} />
                    </div>
                    <div className="text-xs">
                      <h3 className="font-bold text-sm text-[#182230]">Pre-Transaction Checkpoints</h3>
                      <p className="text-[#586474]">When high-risk payment patterns or unknown accounts are entered, linked guardians receive a quiet verification prompt.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E6F4F2] text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                      <Flash size={18} />
                    </div>
                    <div className="text-xs">
                      <h3 className="font-bold text-sm text-[#182230]">Salted Duress Phrase Architecture</h3>
                      <p className="text-[#586474]">Family members agree on a discreet trigger word stored exclusively as a salted hash. Saying it instantly alerts guardians without tipping off the scammer.</p>
                    </div>
                  </div>
                </div>

                <div className="gsap-reveal pt-2 flex items-center gap-3">
                  <Link to="/family-shield">
                    <Button kind="primary" size="md" renderIcon={ArrowRight}>
                      Explore Family Shield
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Family Shield Visual Mockup */}
              <div className="lg:col-span-6">
                <div className="gsap-reveal bg-[#F7F9FC] border border-[#CBD5E1] rounded-2xl p-6 shadow-md space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <UserMultiple size={18} className="text-[#0F766E]" />
                      <span className="font-bold text-sm text-[#182230]">Active Protection Link</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0F766E] bg-[#E6F4F2] px-2.5 py-0.5 rounded-full">
                      Two-Way Consent Active
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#182230]">Senior Protected Member: Ramesh (Father)</span>
                      <span className="text-[11px] text-[#586474]">Senior Mode Enabled</span>
                    </div>
                    <p className="text-xs text-[#586474]">
                      Pre-flight checks active for transfers exceeding ₹5,000 or unverified VPAs.
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#182230]">Primary Guardian: Priya (Daughter)</span>
                      <span className="text-[11px] text-[#0F766E] font-semibold">Real-Time Alerts ON</span>
                    </div>
                    <p className="text-xs text-[#586474]">
                      Receives instant notification when high-risk SMS or unknown APK installation is detected.
                    </p>
                  </div>

                  <div className="p-3 bg-[#E6F4F2] border border-[#BCE3DE] rounded-xl text-xs text-[#0F766E] flex items-center gap-2">
                    <Security size={16} className="shrink-0" />
                    <span>Duress Phrase: "Tulsi Plant" &bull; Salted SHA-256 Hash Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 9: Golden Hour Recovery ("Already lost money? Act quickly.")
            ------------------------------------------------------------------------- */}
        <section id="recovery" className="gsap-section py-20 bg-[#F7F9FC] border-b border-[#E2E8F0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border-2 border-[#D92D20]/20 rounded-3xl p-8 sm:p-12 shadow-md">
              <div className="max-w-3xl space-y-4 mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF3F2] text-[#D92D20] border border-[#FECDCA]">
                  <Phone size={14} />
                  <span>National Cybercrime Helpline: 1930</span>
                </div>
                <h2 className="gsap-reveal text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#182230]">
                  Already transferred money? Act immediately.
                </h2>
                <p className="gsap-reveal text-sm sm:text-base text-[#586474] leading-relaxed">
                  The first 2 to 3 hours after fraudulent funds leave your account represent the <strong className="text-[#182230]">Golden Hour</strong>. Banking rails can place an immediate lien on the beneficiary account before syndicates withdraw funds via mule ATMs.
                </p>
              </div>

              {/* Step-by-step Emergency Protocol */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="p-5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#182230] text-white flex items-center justify-center text-xs font-bold font-mono">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-[#182230]">Halt Further Payments</h3>
                  <p className="text-xs text-[#586474] leading-relaxed">
                    Never send additional "reversal fees" or "tax clearance" funds. Disconnect immediately.
                  </p>
                </div>

                <div className="p-5 bg-[#FEF3F2] border border-[#FECDCA] rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#D92D20] text-white flex items-center justify-center text-xs font-bold font-mono">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-[#D92D20]">Dial Helpline 1930</h3>
                  <p className="text-xs text-[#586474] leading-relaxed">
                    Call 1930 immediately with your transaction UTR, bank account number, and timestamp.
                  </p>
                </div>

                <div className="p-5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#182230] text-white flex items-center justify-center text-xs font-bold font-mono">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-[#182230]">File at Cybercrime.gov.in</h3>
                  <p className="text-xs text-[#586474] leading-relaxed">
                    Register a formal incident report on the National Cyber Crime Reporting Portal.
                  </p>
                </div>

                <div className="p-5 bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl space-y-2">
                  <div className="w-7 h-7 rounded-full bg-[#182230] text-white flex items-center justify-center text-xs font-bold font-mono">
                    4
                  </div>
                  <h3 className="font-bold text-sm text-[#182230]">Generate Dossier</h3>
                  <p className="text-xs text-[#586474] leading-relaxed">
                    Use Satark Saathi to format timestamps, screenshots, and suspect UTRs into a police-ready PDF.
                  </p>
                </div>
              </div>

              {/* Action Buttons for Recovery */}
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#E2E8F0]">
                <a href="tel:1930">
                  <Button kind="danger" size="lg" renderIcon={Phone}>
                    Dial National Helpline 1930
                  </Button>
                </a>

                <Link to="/golden-hour">
                  <Button kind="tertiary" size="lg" renderIcon={Flash}>
                    Launch Recovery Dossier Tool
                  </Button>
                </Link>

                <a
                  href="https://cybercrime.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#0F62FE] hover:underline inline-flex items-center gap-1 ml-auto"
                >
                  <span>Official Government Portal: cybercrime.gov.in</span>
                  <Launch size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 10: Frequently Asked Questions (Accessible GSAP Accordion)
            ------------------------------------------------------------------------- */}
        <section id="faq" className="gsap-section py-20 bg-white border-b border-[#E2E8F0]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <span className="gsap-reveal text-xs font-bold uppercase tracking-wider text-[#0F766E] block">
                Clarity & Transparency
              </span>
              <h2 className="gsap-reveal text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#182230]">
                Frequently Asked Questions
              </h2>
              <p className="gsap-reveal text-sm sm:text-base text-[#586474]">
                Clear, honest answers about what Satark Saathi does, what it does not do, and how your data is treated.
              </p>
            </div>

            <div className="space-y-4">
              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="gsap-reveal border border-[#E2E8F0] rounded-2xl overflow-hidden transition-all bg-[#F7F9FC]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#182230] hover:text-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${idx}`}
                    >
                      <span>{faq.question}</span>
                      <span className={`transform transition-transform duration-200 text-[#586474] shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={18} />
                      </span>
                    </button>

                    {isOpen && (
                      <div
                        id={`faq-answer-${idx}`}
                        className="px-6 pb-5 pt-1 text-xs sm:text-sm text-[#586474] leading-relaxed border-t border-[#E2E8F0] bg-white"
                      >
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 11: Final Call to Action & Footer
            ------------------------------------------------------------------------- */}
        <section className="gsap-section py-20 bg-[#182230] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <span className="gsap-reveal text-xs font-bold uppercase tracking-wider text-[#25A296] block">
              Proactive Public Protection
            </span>
            <h2 className="gsap-reveal text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Pause. Check. Then decide.
            </h2>
            <p className="gsap-reveal text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
              Take thirty seconds to verify suspicious messages, APK downloads, or coercive threats before transferring hard-earned savings.
            </p>

            <div className="gsap-reveal flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/scanner">
                <Button kind="primary" size="lg" renderIcon={ArrowRight}>
                  Launch Scam Analyzer
                </Button>
              </Link>

              <Link to="/golden-hour">
                <Button kind="tertiary" size="lg" renderIcon={Flash}>
                  Access Recovery Desk
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------------------
          Footer
          ------------------------------------------------------------------------- */}
      <footer className="bg-[#0F172A] text-[#94A3B8] border-t border-[#334155] py-14 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand & Slogan */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center">
                  <Security size={18} />
                </div>
                <span className="font-bold text-white text-base">Satark Saathi</span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                सतर्क साथी &bull; Stop. Verify. Stay Safe. An AI-assisted digital public safety initiative for cyber-fraud prevention and recovery in India.
              </p>
              <div className="pt-2">
                <a
                  href="tel:1930"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#D92D20]/20 text-[#FDA29B] border border-[#D92D20]/40"
                >
                  <Phone size={14} />
                  <span>National Cybercrime Helpline 1930</span>
                </a>
              </div>
            </div>

            {/* Col 2: Defense Capabilities */}
            <div className="space-y-2.5">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Defense Modules
              </span>
              <ul className="space-y-2">
                <li><Link to="/scanner" className="hover:text-white transition-colors">Scam Message Analyzer</Link></li>
                <li><Link to="/checkpoint" className="hover:text-white transition-colors">Pre-Flight Payment Check</Link></li>
                <li><Link to="/family-shield" className="hover:text-white transition-colors">Family Shield Protection</Link></li>
                <li><Link to="/golden-hour" className="hover:text-white transition-colors">Golden Hour Recovery Desk</Link></li>
              </ul>
            </div>

            {/* Col 3: Official Portals */}
            <div className="space-y-2.5">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Official Indian Portals
              </span>
              <ul className="space-y-2">
                <li>
                  <a href="https://cybercrime.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-1">
                    <span>Cybercrime.gov.in</span>
                    <Launch size={12} />
                  </a>
                </li>
                <li>
                  <a href="https://sachet.rbi.org.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-1">
                    <span>RBI Sachet Portal</span>
                    <Launch size={12} />
                  </a>
                </li>
                <li>
                  <a href="https://sancharsaathi.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors inline-flex items-center gap-1">
                    <span>Chakshu & Sanchar Saathi</span>
                    <Launch size={12} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Public Safety Disclaimer */}
            <div className="space-y-2.5">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] block">
                Public Safety Notice
              </span>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Satark Saathi is an independent advisory intelligence system. It is not a law-enforcement agency, government department, or commercial bank. In case of active financial fraud, immediately call 1930 or submit an official complaint to your local Cyber Police station.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#64748B]">
            <div>
              &copy; {new Date().getFullYear()} Satark Saathi. Developed for Indian digital public safety.
            </div>
            <div className="flex items-center gap-4">
              <span>Client-side Zero Plaintext Architecture</span>
              <span>&bull;</span>
              <span>Accessibility WCAG 2.2 AA</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
