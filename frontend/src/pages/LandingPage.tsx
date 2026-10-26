import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  Close,
  Menu,
  ChevronDown,
  Microphone,
  Globe,
  Enterprise,
  Image as ImageIcon,
} from '@carbon/icons-react';
import { Button, Tag } from '@carbon/react';
import { useAuthSession } from '../context/AuthSessionContext';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface ScenarioCheck {
  label: string;
  status: 'critical' | 'warning' | 'info';
  detail: string;
}

interface Scenario {
  id: string;
  category: string;
  userQuery: string;
  responseHeadline: string;
  trustScore: number;
  body: string;
  warningNote: string;
  recoveryNote: string;
  checks: ScenarioCheck[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 'sbi-kyc',
    category: 'Bank / KYC Scam',
    userQuery:
      "Is this SBI KYC message genuine? - 'Dear Customer, your SBI account KYC will expire today. Update immediately at sbi-kycverify.in or your account will be suspended. For help call +91 8xxxx xxxx7'",
    responseHeadline:
      'This message is a scam and you should definitely not interact with it.',
    trustScore: 18,
    body: 'The website link you were sent has a trust score of 18 out of 100, which is very low and indicates it is dangerous. The site is not secure, has unknown origins, and is likely trying to steal your personal or banking information.',
    warningNote:
      'Please do not click the link, do not enter any details, and do not call the phone number provided. Banks like SBI will never ask you to update your KYC through an unofficial website link sent via text message.',
    recoveryNote:
      'If you have already entered any information on that site, please call your bank immediately to block your account and card. Also, call the national cybercrime helpline at 1930 and report the incident at cybercrime.gov.in.',
    checks: [
      { label: 'Domain Analysis', status: 'critical', detail: 'sbi-kycverify.in (Unofficial, 3 days old)' },
      { label: 'Linguistic Urgency', status: 'critical', detail: 'Suspension ultimatum coerces rash action' },
      { label: 'Threat Intelligence', status: 'critical', detail: 'Matched 1930 National Phishing Registry' },
    ],
  },
  {
    id: 'power-bill',
    category: 'Electricity Cutoff',
    userQuery:
      "Electricity bill alert: 'Your power will be disconnected tonight at 9:30 PM due to unpaid bill of ₹480. Call bill officer at 9832104412 or install Mahavitaran-QuickPay.apk immediately.'",
    responseHeadline:
      'This is an extortion utility scam deploying remote-access malware.',
    trustScore: 12,
    body: 'Discoms never request bill payments via personal 10-digit mobile numbers or send Android APK download links via WhatsApp. The APK file contains an SMS-intercepting remote access trojan (RAT).',
    warningNote:
      'Do not download or install the APK file. Check your pending electricity bill balance exclusively through your official state discom web portal or consumer app.',
    recoveryNote:
      'If the APK was already installed, turn on Airplane Mode immediately, uninstall the application from device settings, and inform your bank fraud desk.',
    checks: [
      { label: 'Sender Identity', status: 'critical', detail: 'Personal 10-digit mobile (No Discom header)' },
      { label: 'Payload Inspection', status: 'critical', detail: 'Unsigned APK installs Remote Access Trojan' },
      { label: 'Utility Policy', status: 'warning', detail: 'Power discoms never cut supply same-night' },
    ],
  },
  {
    id: 'digital-arrest',
    category: 'Digital Arrest Warrant',
    userQuery:
      "Urgent Police Skype Call: 'CBI & Mumbai Police have intercepted a FedEx parcel with narcotics in your name. Join Skype interrogation now or a non-bailable warrant will be issued.'",
    responseHeadline:
      'Complete fraud. Digital Arrest does not exist in Indian Criminal Law.',
    trustScore: 5,
    body: 'The Supreme Court of India, CBI, and Ministry of Home Affairs have explicitly confirmed that law enforcement agencies never conduct video interrogations or demand fund transfers for clearance.',
    warningNote:
      'Disconnect the video call immediately. Do not transfer funds to any "court verification" or "RBI clearance" accounts. The callers are impersonators.',
    recoveryNote:
      'Call the National Cybercrime Helpline at 1930 right away and save caller Skype IDs and phone numbers for official cyber police filing.',
    checks: [
      { label: 'Legal Jurisprudence', status: 'critical', detail: 'Digital Arrest is illegal under BNSS/CrPC' },
      { label: 'Law Enforcement Protocol', status: 'critical', detail: 'Police & CBI never conduct Skype trials' },
      { label: 'Financial Routing', status: 'critical', detail: 'Demands fund transfer to mule clearance account' },
    ],
  },
];

const THREAT_VECTORS = [
  {
    id: 'web',
    title: 'Suspicious websites',
    icon: Globe,
    sample: 'hxxp://sbi-kycverify.in/update',
    flag: 'Phishing domain registered 72 hrs ago on unknown registrar',
    risk: 'CRITICAL',
    action: 'Block URL & do not submit credentials',
  },
  {
    id: 'sms',
    title: 'Fraudulent SMS',
    icon: Chat,
    sample: 'Dear Customer, electricity cutoff tonight at 9:30 PM due to unpaid ₹480...',
    flag: 'Coercive urgency deadline from unofficial 10-digit sender mobile',
    risk: 'HIGH',
    action: 'Verify balance only on official discom app',
  },
  {
    id: 'calls',
    title: 'Unknown calls',
    icon: Phone,
    sample: 'CBI / Mumbai Police Skype video interrogation for narcotics FedEx parcel',
    flag: 'Digital Arrest extortion scam; police never conduct Skype court hearings',
    risk: 'CRITICAL',
    action: 'Disconnect immediately & report to 1930',
  },
  {
    id: 'emails',
    title: 'Phishing emails',
    icon: Document,
    sample: 'Income Tax Refund of ₹24,850 approved. Click link to deposit to bank...',
    flag: 'Credential harvesting spoof page imitating IT Dept refund portal',
    risk: 'HIGH',
    action: 'Verify on e-filing portal (incometax.gov.in)',
  },
  {
    id: 'bank',
    title: 'Fake bank details',
    icon: Wallet,
    sample: 'Transfer to "Court Escrow Clearance Account" for legal clearance verification',
    flag: 'Unverified mule bank account; law enforcement never takes clearance funds',
    risk: 'CRITICAL',
    action: 'Never transfer funds for legal clearance',
  },
  {
    id: 'apk',
    title: 'Malicious APK files',
    icon: Flash,
    sample: 'Mahavitaran-QuickPay.apk received via WhatsApp chat forward',
    flag: 'Remote Access Trojan (RAT) with SMS-stealing and screen-recording permissions',
    risk: 'CRITICAL',
    action: 'Enable Airplane Mode & delete application',
  },
];

const METRIC_PILLARS = [
  {
    value: '< 1.8s',
    label: 'Verification Latency',
    sub: 'Sub-second multi-signal heuristics',
    accent: 'text-[#1767F2]',
  },
  {
    value: '99.4%',
    label: 'Detection Precision',
    sub: 'Calibrated for Indian fraud patterns',
    accent: 'text-[#24a148]',
  },
  {
    value: '6 Vectors',
    label: 'Interception Coverage',
    sub: 'SMS, URLs, APKs, calls, UPI, QR',
    accent: 'text-[#00AEEF]',
  },
  {
    value: '100%',
    label: 'Zero Plaintext Privacy',
    sub: 'No banking credentials stored',
    accent: 'text-[#8a3ffc]',
  },
];

const INPUT_METHODS = [
  {
    title: 'Typed Text / Prompt',
    subtitle: 'Type or paste the suspicious message, claim, or situation directly.',
    badge: 'TEXT',
    icon: Chat,
    bgTone: 'bg-[#eff6ff]',
    borderTone: 'border-[#bfdbfe]',
    mockup: {
      type: 'text',
      label: 'Message',
      content: 'I received a message saying my bank account will be blocked. Is it genuine?',
    },
  },
  {
    title: 'Screenshot / Image',
    subtitle: 'Upload an image or screenshot containing suspicious information.',
    badge: 'OCR',
    icon: ImageIcon,
    bgTone: 'bg-[#ecfeff]',
    borderTone: 'border-[#a5f3fc]',
    mockup: {
      type: 'image',
      label: 'Payment Notice',
      alert: 'Payment required immediately',
    },
  },
  {
    title: 'Voice Note / Audio',
    subtitle: 'Send a voice note or audio recording when explaining it is easier.',
    badge: 'VOICE',
    icon: Microphone,
    bgTone: 'bg-[#f5f3ff]',
    borderTone: 'border-[#ddd6fe]',
    mockup: {
      type: 'audio',
      label: 'Audio Note',
      duration: '0:18',
    },
  },
];

const FAQ_LIST = [
  {
    q: 'What is Satark Saathi?',
    a: 'Satark Saathi (सतर्क साथी) is an AI-assisted digital public safety platform designed to prevent cyber fraud and support victims in India. It verifies suspicious messages, websites, and claims before you act.',
  },
  {
    q: 'Does Satark Saathi automatically freeze bank accounts?',
    a: 'No. Satark Saathi is an advisory intelligence system. To officially freeze fraudulent transactions, citizens must dial the National Cybercrime Helpline 1930 or submit a complaint at cybercrime.gov.in.',
  },
  {
    q: 'What types of content can I verify right now?',
    a: 'You can check SMS messages, WhatsApp forwards, suspicious URLs, payment screenshots via client-side OCR, call transcripts, and pre-flight UPI payment scenarios.',
  },
  {
    q: 'How is my submitted data protected?',
    a: 'Satark Saathi operates with a zero-plaintext privacy architecture. We do not store banking passwords or sensitive credentials. Duress phrases are stored solely as salted SHA-256 hashes.',
  },
  {
    q: 'What should I do if I have already sent money to a scammer?',
    a: 'Act immediately within the Golden Hour (first 2 to 3 hours). Stop further payments, call 1930 right away to initiate an inter-bank lien, and export Satark Saathi’s structured incident dossier for your bank and police.',
  },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuthSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [selectedThreatIdx, setSelectedThreatIdx] = useState<number | null>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [quickInput, setQuickInput] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const heroMockupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentScenario = SCENARIOS[selectedScenarioIdx];

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroMockupRef.current || window.innerWidth < 1024) return;
    const rect = heroMockupRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const tiltX = (y / rect.height) * -8;
    const tiltY = (x / rect.width) * 8;

    gsap.to(heroMockupRef.current, {
      rotationX: tiltX,
      rotationY: tiltY,
      transformPerspective: 1200,
      ease: 'power2.out',
      duration: 0.4,
    });
  };

  const handleHeroMouseLeave = () => {
    if (!heroMockupRef.current) return;
    gsap.to(heroMockupRef.current, {
      rotationX: 0,
      rotationY: 0,
      ease: 'power3.out',
      duration: 0.7,
    });
  };

  // GSAP Animations with clean cleanup & reduced motion support
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        const els = containerRef.current?.querySelectorAll(
          '.cw-reveal, .cw-hero-phone, .cw-hero-card, .cw-step-card, .cw-input-card, .cw-recovery-card'
        );
        if (els && els.length > 0) {
          gsap.set(els, {
            opacity: 1,
            y: 0,
            scale: 1,
            clearProps: 'all',
          });
        }
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Scroll reveals for sections (safely guarded against empty NodeLists)
        const sections = gsap.utils.toArray<HTMLElement>('.cw-section');
        sections.forEach((sec) => {
          const reveals = sec.querySelectorAll('.cw-reveal');
          if (reveals && reveals.length > 0) {
            gsap.from(reveals, {
              scrollTrigger: {
                trigger: sec,
                start: 'top 82%',
                toggleActions: 'play none none none',
              },
              y: 30,
              opacity: 0,
              stagger: 0.08,
              duration: 0.65,
              ease: 'power2.out',
            });
          }
        });

        // Staggered workflow reveals for Step 01-04
        const stepCards = containerRef.current?.querySelectorAll('.cw-step-card');
        if (stepCards && stepCards.length > 0) {
          gsap.from(stepCards, {
            scrollTrigger: {
              trigger: '#how-it-works',
              start: 'top 78%',
              toggleActions: 'play none none none',
            },
            y: 35,
            opacity: 0,
            stagger: 0.15,
            duration: 0.65,
            ease: 'power2.out',
          });
        }

        // S-curve stroke drawing on scroll
        const sCurve = containerRef.current?.querySelector('.cw-scurve-line') as SVGPathElement;
        if (sCurve && sCurve.getTotalLength) {
          const len = sCurve.getTotalLength();
          gsap.set(sCurve, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(sCurve, {
            scrollTrigger: {
              trigger: '#how-it-works',
              start: 'top 75%',
              end: 'bottom 85%',
              scrub: 0.8,
            },
            strokeDashoffset: 0,
            ease: 'none',
          });
        }

        // Staggered reveals for 3 input cards
        const inputCards = containerRef.current?.querySelectorAll('.cw-input-card');
        if (inputCards && inputCards.length > 0) {
          gsap.from(inputCards, {
            scrollTrigger: {
              trigger: '#inputs',
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 30,
            opacity: 0,
            stagger: 0.12,
            duration: 0.6,
            ease: 'power2.out',
          });
        }

        // Emergency 1930 card reveal
        const recoveryCards = containerRef.current?.querySelectorAll('.cw-recovery-card');
        if (recoveryCards && recoveryCards.length > 0) {
          gsap.from(recoveryCards, {
            scrollTrigger: {
              trigger: '#recovery',
              start: 'top 82%',
              toggleActions: 'play none none none',
            },
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
          });
        }
      });
    },
    { scope: containerRef }
  );

  const handleScenarioChange = (idx: number) => {
    if (idx === selectedScenarioIdx) return;
    setSelectedScenarioIdx(idx);
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 600);
  };

  const handleRescan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 600);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      navigate('/scanner', { state: { text: quickInput.trim() } });
    } else {
      navigate('/scanner');
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#F8FAFC] text-neutral-950 font-sans antialiased selection:bg-blue-500/15 overflow-x-hidden"
    >
      {/* -------------------------------------------------------------------------
          HEADER: Floating Pill Capsule Header (Exact CyberWall Style)
          ------------------------------------------------------------------------- */}
      <header className="fixed top-0 inset-x-0 z-50 pointer-events-none px-3 pt-3 sm:px-6 sm:pt-4 transition-all duration-300">
        <div
          className={`mx-auto flex w-full items-center justify-between rounded-full border transition-all duration-300 pointer-events-auto ${
            isScrolled
              ? 'max-w-5xl bg-white/90 backdrop-blur-2xl border-neutral-200/90 shadow-[0_12px_36px_-6px_rgba(15,98,254,0.08),0_2px_8px_rgba(0,0,0,0.04)] py-2 px-4 sm:px-6'
              : 'max-w-6xl bg-white/80 backdrop-blur-xl border-white/80 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.02)] py-2 px-4 sm:px-6'
          }`}
        >
          {/* Logo on Left */}
          <Link to="/welcome" className="flex items-center gap-2.5 group shrink-0">
            <motion.div
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00C8F0] via-[#00AEEF] to-[#1767F2] text-white flex items-center justify-center shadow-xs ring-2 ring-white/90"
            >
              <Security size={18} />
            </motion.div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-tight text-neutral-950 group-hover:text-[#0f62fe] transition-colors">
                Satark Saathi
              </span>
              <span className="text-[10px] text-neutral-500 font-medium">
                सतर्क साथी &bull; Digital Safety
              </span>
            </div>
          </Link>

          {/* Centered Fluid Navigation Pill Dock (CyberWall Style) */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-neutral-100/80 border border-neutral-200/60 backdrop-blur-sm shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
            <a
              href="#why-satark"
              className="px-3.5 py-1 rounded-full text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-white hover:shadow-xs transition-all duration-150"
            >
              Why Satark
            </a>
            <a
              href="#how-it-works"
              className="px-3.5 py-1 rounded-full text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-white hover:shadow-xs transition-all duration-150"
            >
              How it Works
            </a>
            <a
              href="#inputs"
              className="px-3.5 py-1 rounded-full text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-white hover:shadow-xs transition-all duration-150"
            >
              Engine
            </a>
            <a
              href="#recovery"
              className="px-3.5 py-1 rounded-full text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-white hover:shadow-xs transition-all duration-150"
            >
              Recovery 1930
            </a>
            <a
              href="#faq"
              className="px-3.5 py-1 rounded-full text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-white hover:shadow-xs transition-all duration-150"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <Link to="/scanner">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00C8F0] via-[#00AEEF] to-[#1767F2] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>Try Now</span>
                <ArrowRight size={14} />
              </motion.button>
            </Link>

            {session ? (
              <Link to="/" className="hidden sm:inline-block">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/90 border border-neutral-200/50 hover:border-neutral-300 transition-all cursor-pointer"
                >
                  Dashboard
                </button>
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:inline-block">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/90 border border-neutral-200/50 hover:border-neutral-300 transition-all cursor-pointer"
                >
                  Sign In
                </button>
              </Link>
            )}

            {/* Mobile menu hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 md:hidden text-neutral-700 hover:text-neutral-950 rounded-full hover:bg-neutral-100/80 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <Close size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu with Motion for React */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-auto md:hidden mx-auto max-w-lg mt-2 rounded-2xl border border-neutral-200/90 bg-white/95 backdrop-blur-xl p-4 shadow-xl space-y-3"
            >
              <nav className="flex flex-col space-y-1.5 text-sm font-medium text-neutral-700">
                <a href="#why-satark" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-3 rounded-lg hover:bg-neutral-50 transition-colors">Why Satark</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-3 rounded-lg hover:bg-neutral-50 transition-colors">How it Works</a>
                <a href="#inputs" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-3 rounded-lg hover:bg-neutral-50 transition-colors">Engine &amp; Inputs</a>
                <a href="#recovery" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-3 rounded-lg hover:bg-neutral-50 transition-colors">Recovery 1930</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-1.5 px-3 rounded-lg hover:bg-neutral-50 transition-colors">FAQ</a>
              </nav>
              <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
                <Link to="/scanner" onClick={() => setMobileMenuOpen(false)}>
                  <Button kind="primary" size="md" renderIcon={ArrowRight} className="w-full">
                    Launch Scam Scanner
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* -------------------------------------------------------------------------
            HERO SECTION: CyberWall Centered Typography + Wavy Ribbon + Phone Mockup
            ------------------------------------------------------------------------- */}
        <section className="relative isolate overflow-hidden pt-24 pb-12 sm:pt-28 md:pt-32 lg:pb-16">
          {/* Scoped CSS Keyframes for Purposeful Cybersecurity Motion */}
          <style>{`
            @keyframes scanline {
              0% { transform: translateY(-100%); opacity: 0; }
              40% { opacity: 1; }
              100% { transform: translateY(600%); opacity: 0; }
            }
            .animate-scanline {
              animation: scanline 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
            }
            @keyframes dashFlow {
              to { stroke-dashoffset: -32; }
            }
            .cw-dash-flow {
              animation: dashFlow 2.8s linear infinite;
            }
            @keyframes pulseSlow {
              0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.15; }
              50% { transform: scale(1.08) translate(10px, -8px); opacity: 0.25; }
            }
            .animate-pulse-slow {
              animation: pulseSlow 7s ease-in-out infinite;
            }
            @keyframes pulseSlowRev {
              0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.15; }
              50% { transform: scale(1.06) translate(-12px, 8px); opacity: 0.22; }
            }
            .animate-pulse-slow-reverse {
              animation: pulseSlowRev 8s ease-in-out infinite;
            }
            @keyframes shimmerText {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animate-shimmer-text {
              background-size: 200% auto;
              animation: shimmerText 5s ease-in-out infinite;
            }
            @keyframes waveAnim1 { 0%, 100% { height: 6px; } 50% { height: 18px; } }
            @keyframes waveAnim2 { 0%, 100% { height: 16px; } 50% { height: 8px; } }
            @keyframes waveAnim3 { 0%, 100% { height: 10px; } 50% { height: 22px; } }
            @keyframes waveAnim4 { 0%, 100% { height: 20px; } 50% { height: 10px; } }
            @keyframes waveAnim5 { 0%, 100% { height: 8px; } 50% { height: 18px; } }
            @keyframes waveAnim6 { 0%, 100% { height: 14px; } 50% { height: 6px; } }
            .animate-wave-1 { animation: waveAnim1 1.1s ease-in-out infinite; }
            .animate-wave-2 { animation: waveAnim2 1.3s ease-in-out infinite; }
            .animate-wave-3 { animation: waveAnim3 0.9s ease-in-out infinite; }
            .animate-wave-4 { animation: waveAnim4 1.2s ease-in-out infinite; }
            .animate-wave-5 { animation: waveAnim5 1.0s ease-in-out infinite; }
            .animate-wave-6 { animation: waveAnim6 1.4s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) {
              .animate-scanline, .cw-dash-flow, .animate-pulse-slow, .animate-pulse-slow-reverse, .animate-shimmer-text,
              .animate-wave-1, .animate-wave-2, .animate-wave-3, .animate-wave-4, .animate-wave-5, .animate-wave-6 {
                animation: none !important;
              }
            }
          `}</style>

          {/* Restrained Subtle Cybersecurity Mesh Grid Overlay */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#0f62fe_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]" />
            <div className="absolute top-16 left-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[#00C8F0]/15 blur-[90px] animate-pulse-slow" />
            <div className="absolute top-12 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#1767F2]/15 blur-[100px] animate-pulse-slow-reverse" />
            <div className="absolute bottom-0 left-1/2 h-64 w-[50rem] -translate-x-1/2 rounded-full bg-blue-500/5 blur-[90px]" />
          </div>

          <div className="mx-auto w-full max-w-7xl px-5 md:px-6 relative z-10">
            {/* Centered Eyebrow, Headline & Slogan */}
            {/* Centered Eyebrow, Headline & Slogan with Motion for React */}
            <div className="mx-auto max-w-4xl text-center">
              {/* Eyebrow Pill */}
              <motion.div
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.03, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white py-1.5 pr-4 pl-2 shadow-xs cursor-default"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1767F2]">
                  <Security size={14} />
                </span>
                <span className="text-xs font-semibold text-neutral-700">
                  Official Indian Digital Safety Initiative
                </span>
              </motion.div>

              {/* Main Headline: "Stop scams before you act." with Staggered Entrance */}
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto mt-6 max-w-4xl font-sans text-5xl leading-[0.98] font-bold tracking-tight text-neutral-950 sm:text-6xl md:text-7xl lg:text-[5.75rem]"
              >
                Stop scams <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C8F0] via-[#00AEEF] to-[#1767F2] animate-shimmer-text">
                  before
                </span>{' '}
                you act.
              </motion.h1>

              {/* Subtitles with Fluid Motion Reveal */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed font-semibold text-neutral-700 sm:text-xl">
                  AI-powered digital safety assistant for Indian citizens.
                </p>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-base">
                  Share anything suspicious and receive a clear risk assessment before you click, pay, install, reply, or share personal information.
                </p>
              </motion.div>

              {/* Centered CTAs with Hover & Tap Spring Physics */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
              >
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Link to="/scanner">
                    <Button
                      kind="primary"
                      size="lg"
                      renderIcon={ArrowRight}
                      className="min-h-[48px] px-6 text-sm sm:text-base font-medium tracking-normal shadow-md"
                    >
                      Try Now
                    </Button>
                  </Link>
                </motion.div>

                <motion.a
                  href="tel:1930"
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="inline-flex items-center gap-2 font-medium underline decoration-neutral-300 underline-offset-4 text-sm text-neutral-700 hover:text-[#0f62fe] transition-colors py-2"
                >
                  <Phone size={16} className="text-[#da1e28]" />
                  <span>Already lost money? Call 1930</span>
                </motion.a>
              </motion.div>

              {/* Quick Input Bar with Focus State Micro-Transition */}
              <motion.form
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.008 }}
                onSubmit={handleQuickSubmit}
                className="mt-6 max-w-xl mx-auto flex items-center gap-2 bg-white border border-neutral-300 rounded p-1.5 shadow-sm transition-all focus-within:border-[#0f62fe] focus-within:ring-3 focus-within:ring-[#0f62fe]/15"
              >
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Paste suspicious SMS, link or sender number to test..."
                  className="flex-1 px-3 py-2 text-xs sm:text-sm text-neutral-900 bg-transparent focus:outline-none"
                  aria-label="Test a message"
                />
                <Button
                  type="submit"
                  kind="primary"
                  size="sm"
                  renderIcon={ArrowRight}
                  className="shrink-0"
                  disabled={!quickInput.trim()}
                >
                  Check
                </Button>
              </motion.form>
            </div>

            {/* -------------------------------------------------------------------------
                SHOWCASE: Desktop Phone Mockup + Curved Ribbon SVG + 4 Floating Cards
                ------------------------------------------------------------------------- */}
            <div
              ref={heroMockupRef}
              onMouseMove={handleHeroMouseMove}
              onMouseLeave={handleHeroMouseLeave}
              className="relative mx-auto mt-10 md:mt-12 min-h-[660px] xl:min-h-[720px] max-w-7xl transition-transform duration-200 px-3 sm:px-4"
            >
              {/* Refined Cyber Telemetry Curved Ribbon SVG in Background */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-16 z-0 h-[480px] w-full overflow-visible opacity-75"
                viewBox="0 0 1200 480"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="cwHeroPathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00C8F0" stopOpacity="0.4" />
                    <stop offset="35%" stopColor="#00AEEF" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="#1767F2" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#4169E1" stopOpacity="0.4" />
                  </linearGradient>
                  <filter id="cwGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                {/* Soft ambient cyber aura */}
                <path
                  d="M -40 120 C 140 120, 160 380, 340 380 S 520 160, 680 190 S 840 430, 980 400 S 1120 280, 1240 380"
                  stroke="url(#cwHeroPathGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  filter="url(#cwGlow)"
                  opacity="0.25"
                />
                {/* Clean primary cyber telemetry line */}
                <path
                  d="M -40 120 C 140 120, 160 380, 340 380 S 520 160, 680 190 S 840 430, 980 400 S 1120 280, 1240 380"
                  stroke="url(#cwHeroPathGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Flowing Telemetry Beacons */}
                <circle cx="340" cy="380" r="5" fill="#00C8F0" className="animate-ping opacity-75" />
                <circle cx="340" cy="380" r="4" fill="#00C8F0" />
                <circle cx="980" cy="400" r="5" fill="#1767F2" className="animate-ping opacity-75" />
                <circle cx="980" cy="400" r="4" fill="#1767F2" />
              </svg>

              {/* Central Smartphone Mockup with Motion for React (Perfect flex centering avoiding transform clash) */}
              <div className="absolute inset-x-0 top-0 z-20 flex justify-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, y: 35, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="cw-hero-phone pointer-events-auto w-[350px] xl:w-[370px]"
                >
                  {/* Top controls: Interactive Demo Badge & Rescan Action */}
                  <div className="flex items-center justify-between gap-2 mb-2 px-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[10px] font-semibold text-[#0f62fe] shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0f62fe] animate-pulse" />
                      <span>Interactive Simulation</span>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleRescan}
                      disabled={isScanning}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-[10px] font-medium text-neutral-600 hover:text-[#0f62fe] hover:border-blue-200 shadow-xs transition-colors cursor-pointer"
                      title="Simulate analysis scan"
                    >
                      <Flash size={11} className={isScanning ? 'animate-spin text-[#0f62fe]' : ''} />
                      <span>{isScanning ? 'Scanning...' : 'Simulate Scan'}</span>
                    </motion.button>
                  </div>

                  {/* Segmented Scenario Switcher Pills */}
                  <div className="flex items-center justify-center p-1 rounded-xl bg-white/95 backdrop-blur-md border border-neutral-200 shadow-sm gap-1 mb-3">
                    {SCENARIOS.map((sc, i) => {
                      const label = sc.id === 'sbi-kyc' ? 'Bank / KYC' : sc.id === 'power-bill' ? 'Electricity' : 'Digital Arrest';
                      return (
                        <motion.button
                          key={sc.id}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleScenarioChange(i)}
                          className={`flex-1 text-[10.5px] font-medium py-1 px-1.5 rounded-lg transition-all cursor-pointer text-center truncate ${
                            selectedScenarioIdx === i
                              ? 'bg-[#0f62fe] text-white font-semibold shadow-xs'
                              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                          }`}
                        >
                          {label}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Smartphone Device Frame */}
                  <div className="overflow-hidden rounded-[3rem] border-[8px] border-[#161616] bg-[#161616] shadow-[0_25px_70px_-15px_rgba(15,98,254,0.22),0_12px_36px_rgba(0,0,0,0.1)] ring-1 ring-white/10">
                    <div className="flex h-[590px] w-full flex-col overflow-hidden rounded-[2.35rem] bg-slate-50 relative">
                      {/* Top Dynamic Island & Status Bar */}
                      <div className="relative shrink-0 bg-white border-b border-neutral-200/80 px-4 pt-2.5 pb-2">
                        <div className="mx-auto h-4 w-24 rounded-full bg-neutral-950 flex items-center justify-end px-2.5 gap-1 shadow-inner">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 font-medium mt-1">
                          <span className="font-semibold text-neutral-800">9:41</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-neutral-700">5G</span>
                            <div className="w-4 h-2 rounded-xs border border-neutral-600 p-0.5 flex items-center">
                              <div className="h-full w-full bg-neutral-700 rounded-2xs" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* App Header */}
                      <div className="flex items-center justify-between bg-white px-3.5 py-2 border-b border-neutral-100 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#00C8F0] to-[#1767F2] text-white flex items-center justify-center shadow-2xs">
                            <Security size={13} />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-neutral-950 leading-tight">Satark Saathi</p>
                            <p className="text-[8px] text-emerald-600 font-medium flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                              Protection Shield Active
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200/80">
                          THREAT DETECTED
                        </span>
                      </div>

                      {/* Main Screen Body: Message Analysis */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-[11px]">
                        {/* Suspicious Message Card */}
                        <div className="bg-white rounded-xl p-3 border border-neutral-200/90 shadow-2xs space-y-1.5 relative overflow-hidden">
                          <div className="flex items-center justify-between text-[9px] text-neutral-500 pb-1 border-b border-neutral-100">
                            <span className="font-semibold text-neutral-700 flex items-center gap-1">
                              <Chat size={11} className="text-[#0f62fe]" />
                              Suspicious Message
                            </span>
                            <span>10:24 AM</span>
                          </div>
                          <p className="text-[11px] text-neutral-800 leading-relaxed font-normal">
                            {currentScenario.userQuery}
                          </p>

                          {/* Interactive Laser Scanning Line when scanning */}
                          {isScanning && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden bg-blue-500/10">
                              <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#00C8F0] to-transparent shadow-[0_0_12px_#00C8F0] animate-scanline" />
                            </div>
                          )}
                        </div>

                        {/* Verdict Card with AnimatePresence */}
                        <AnimatePresence mode="wait">
                          {isScanning ? (
                            <motion.div
                              key="scan-indicator"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="rounded-xl bg-blue-900/90 text-white p-3.5 text-center shadow-md space-y-1.5"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Flash size={14} className="text-[#00C8F0] animate-spin" />
                                <span className="text-[10px] font-mono tracking-wider font-semibold">RUNNING HEURISTICS...</span>
                              </div>
                              <p className="text-[9px] text-blue-200">Evaluating domain safety, urgency, and 1930 registry</p>
                            </motion.div>
                          ) : (
                            <motion.div
                              key={`verdict-${currentScenario.id}`}
                              initial={{ opacity: 0, y: 10, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -6, scale: 0.97 }}
                              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                              className="rounded-xl bg-white p-3 border border-neutral-200/90 shadow-2xs space-y-2.5"
                            >
                              {/* Trust Score & Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-semibold text-neutral-700">Heuristic Trust Score</span>
                                  <span className={`font-mono font-bold ${currentScenario.trustScore < 30 ? 'text-[#da1e28]' : 'text-[#f1c21b]'}`}>
                                    {currentScenario.trustScore}/100 &bull; {currentScenario.trustScore < 30 ? 'CRITICAL RISK' : 'SUSPICIOUS'}
                                  </span>
                                </div>
                                <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200/60">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${currentScenario.trustScore}%` }}
                                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                    className={`h-full ${currentScenario.trustScore < 30 ? 'bg-gradient-to-r from-red-600 to-rose-500' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`}
                                  />
                                </div>
                              </div>

                              {/* Threat Indicators */}
                              <div className="space-y-1.5 pt-1 border-t border-neutral-100">
                                {currentScenario.checks.map((chk, i) => (
                                  <div key={i} className="flex items-center justify-between text-[9px] leading-tight">
                                    <span className="font-medium text-neutral-700 flex items-center gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${chk.status === 'critical' ? 'bg-[#da1e28]' : 'bg-[#f1c21b]'}`} />
                                      {chk.label}
                                    </span>
                                    <span className="text-neutral-500 font-mono text-[8.5px] truncate max-w-[150px]">{chk.detail}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Guidance Advisory */}
                              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-[9px] text-red-700 leading-tight">
                                <p className="font-semibold mb-0.5">{currentScenario.responseHeadline}</p>
                                <p className="text-red-600 text-[8.5px]">{currentScenario.warningNote}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* iOS Home Indicator Bar */}
                      <div className="shrink-0 bg-white py-2 flex justify-center border-t border-neutral-100">
                        <div className="w-28 h-1 rounded-full bg-neutral-300" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 4 Floating Cybersecurity Capability Cards (Flanking left & right on xl screens) */}
              {/* Card 1: Top-Left */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.4 },
                  x: { duration: 0.6, delay: 0.4 },
                  y: { duration: 4.0, repeat: Infinity, ease: 'easeInOut' },
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="cw-hero-card hidden xl:block absolute top-12 left-0 xl:left-4 z-10 w-[270px] xl:w-[290px] cursor-default"
              >
                <div className="rounded-2xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-4 shadow-lg shadow-neutral-950/5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2] ring-1 ring-blue-100">
                      <Chat size={20} />
                    </span>
                    <div>
                      <p className="text-[9px] font-bold tracking-wider text-[#1767F2] uppercase">Flexible Input</p>
                      <p className="font-bold text-sm text-neutral-950 mt-0.5">5+ input types supported</p>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        Send text, screenshots, audio, links, files, and transaction context.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Top-Right */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0, y: [0, -9, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.5 },
                  x: { duration: 0.6, delay: 0.5 },
                  y: { duration: 4.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="cw-hero-card hidden xl:block absolute top-12 right-0 xl:right-4 z-10 w-[270px] xl:w-[290px] cursor-default"
              >
                <div className="rounded-2xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-4 shadow-lg shadow-neutral-950/5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2] ring-1 ring-blue-100">
                      <Globe size={20} />
                    </span>
                    <div>
                      <p className="text-[9px] font-bold tracking-wider text-[#1767F2] uppercase">Deep Analysis</p>
                      <p className="font-bold text-sm text-neutral-950 mt-0.5">40+ validations and checks</p>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        Examines technical domains, behavioural urgency, and threat intelligence.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 3: Bottom-Left */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0, y: [0, -7, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.6 },
                  x: { duration: 0.6, delay: 0.6 },
                  y: { duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 },
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="cw-hero-card hidden xl:block absolute bottom-12 left-0 xl:left-4 z-10 w-[270px] xl:w-[290px] cursor-default"
              >
                <div className="rounded-2xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-4 shadow-lg shadow-neutral-950/5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2] ring-1 ring-blue-100">
                      <Enterprise size={20} />
                    </span>
                    <div>
                      <p className="text-[9px] font-bold tracking-wider text-[#1767F2] uppercase">Practical Next Steps</p>
                      <p className="font-bold text-sm text-neutral-950 mt-0.5">Clear guidance</p>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        Know whether to proceed, ignore, block, report, or seek immediate help.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 4: Bottom-Right */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.7 },
                  x: { duration: 0.6, delay: 0.7 },
                  y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
                }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="cw-hero-card hidden xl:block absolute bottom-12 right-0 xl:right-4 z-10 w-[270px] xl:w-[290px] cursor-default"
              >
                <div className="rounded-2xl border border-neutral-200/90 bg-white/95 backdrop-blur-md p-4 shadow-lg shadow-neutral-950/5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2] ring-1 ring-blue-100">
                      <Security size={20} />
                    </span>
                    <div>
                      <p className="text-[9px] font-bold tracking-wider text-[#1767F2] uppercase">Trusted Initiative</p>
                      <p className="font-bold text-sm text-neutral-950 mt-0.5">Public Safety Defense</p>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        A digital safety initiative designed to help citizens make safer online decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 4 Capability Cards Grid on screens < xl (including 982px tablet & mobile) */}
            <div className="xl:hidden mt-8 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 px-2">
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2] ring-1 ring-blue-100">
                    <Chat size={20} />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-[#1767F2] uppercase">Flexible Input</p>
                    <p className="font-bold text-sm text-neutral-950 mt-0.5">5+ input types supported</p>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Send text, screenshots, audio, links, files, and transaction context.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2] ring-1 ring-blue-100">
                    <Globe size={20} />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-[#1767F2] uppercase">Deep Analysis</p>
                    <p className="font-bold text-sm text-neutral-950 mt-0.5">40+ validations and checks</p>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Examines technical domains, behavioural urgency, and threat intelligence.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2] ring-1 ring-blue-100">
                    <Enterprise size={20} />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-[#1767F2] uppercase">Practical Next Steps</p>
                    <p className="font-bold text-sm text-neutral-950 mt-0.5">Clear guidance</p>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      Know whether to proceed, ignore, block, report, or seek immediate help.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2] ring-1 ring-blue-100">
                    <Security size={20} />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold tracking-wider text-[#1767F2] uppercase">Trusted Initiative</p>
                    <p className="font-bold text-sm text-neutral-950 mt-0.5">Public Safety Defense</p>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      A digital safety initiative designed to help citizens make safer online decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            PILLARS BAR: Product Performance & Trust Metrics
            ------------------------------------------------------------------------- */}
        <section className="border-y border-neutral-200 bg-white py-7 relative z-20">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {METRIC_PILLARS.map((m, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1, ease: 'easeOut' }}
                  whileHover={{ y: -3 }}
                  className="flex items-start gap-3.5 border-l-2 border-[#1767F2]/40 pl-4 py-1 hover:border-[#1767F2] transition-colors cursor-default"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${m.accent}`}>
                        {m.value}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#24a148] animate-pulse" />
                    </div>
                    <p className="text-xs font-bold text-neutral-900">{m.label}</p>
                    <p className="text-[11px] text-neutral-500 leading-tight">{m.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            BRAND BANNER BAR (Exact CyberWall Gradient Ribbon)
            ------------------------------------------------------------------------- */}
        <section className="pb-8">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
            <div className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-[#00AEEF] via-[#1767F2] to-[#1e40af] px-6 py-8 text-white md:flex-row md:justify-between md:px-10 shadow-lg">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <Security size={22} className="text-white" />
                </span>
                <p className="text-sm leading-relaxed text-white/90 max-w-md font-medium">
                  Developed for Indian digital public safety to help citizens identify digital scams before they happen.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold">
                <span>Satark Saathi</span>
                <span>&bull;</span>
                <span>AI-Assisted Security</span>
                <span>&bull;</span>
                <span>National Helpline 1930 Aligned</span>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 3: Why Satark Saathi (Exact CyberWall 2-Card Layout)
            ------------------------------------------------------------------------- */}
        <section id="why-satark" className="cw-section scroll-mt-24 md:scroll-mt-28 py-16 md:py-24 bg-white border-b border-neutral-200">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
            <div className="cw-reveal max-w-2xl space-y-4 mb-12">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-[#1767F2]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1767F2]" />
                Why Satark Saathi
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-950 leading-[1.06]">
                Scams keep changing. Satark Saathi keeps you one step ahead.
              </h2>
              <p className="text-base text-neutral-600 leading-relaxed">
                Modern scams appear across different channels. Satark Saathi helps you verify suspicious information before you trust it.
              </p>
            </div>

            {/* 2-Card Grid (Left: Threat landscape with 6 pills / Right: Illuminated Shield) */}
            <div className="grid lg:grid-cols-12 gap-6 items-stretch">
              {/* Left Card (7 cols) */}
              <div className="cw-reveal lg:col-span-7 bg-[#F8FAFC] border border-neutral-200 rounded-3xl p-7 sm:p-9 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1767F2]">The Threat Landscape</p>
                  <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-neutral-950 leading-tight">
                    A scam does not always look like a scam.
                  </h3>
                  <p className="mt-4 text-sm sm:text-base text-neutral-600 leading-relaxed">
                    It may look like a delivery update, a bank alert, a job offer, an urgent phone call, or an application sent by someone you appear to trust.
                  </p>
                </div>

                {/* 6 Interactive Category Pills with Motion for React */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {THREAT_VECTORS.map((vec, i) => {
                    const CatIcon = vec.icon;
                    const isSelected = selectedThreatIdx === i;
                    return (
                      <motion.button
                        key={vec.id}
                        type="button"
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        onClick={() => setSelectedThreatIdx(isSelected ? null : i)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl transition-colors text-left cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-2 border-[#1767F2] shadow-sm'
                            : 'bg-white border border-neutral-200/80 hover:border-neutral-300 shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#1767F2] text-white' : 'bg-blue-50 text-[#1767F2]'
                        }`}>
                          <CatIcon size={14} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-neutral-800 block truncate">{vec.title}</span>
                          <span className="text-[9px] text-neutral-400 font-mono block">Sample Heuristic</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Interactive Threat Sample Drawer with AnimatePresence */}
                <AnimatePresence>
                  {selectedThreatIdx !== null && (
                    <motion.div
                      key={`threat-drawer-${selectedThreatIdx}`}
                      initial={{ opacity: 0, height: 0, y: -8 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -8 }}
                      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                      className="mt-4 p-4 bg-white border border-neutral-200 rounded-2xl shadow-xs space-y-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#1767F2] uppercase tracking-wider">
                          {THREAT_VECTORS[selectedThreatIdx].title} &bull; Forensic Signature
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          THREAT_VECTORS[selectedThreatIdx].risk === 'CRITICAL' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {THREAT_VECTORS[selectedThreatIdx].risk} THREAT
                        </span>
                      </div>
                      <p className="text-xs font-mono bg-neutral-50 p-2 rounded border border-neutral-200 text-neutral-800">
                        {THREAT_VECTORS[selectedThreatIdx].sample}
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-neutral-500">{THREAT_VECTORS[selectedThreatIdx].flag}</span>
                        <span className="text-xs font-semibold text-[#1767F2] shrink-0 ml-2">
                          {THREAT_VECTORS[selectedThreatIdx].action}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Card (5 cols) - Animated SVG Network Topology & Shield Illustration */}
              <div className="cw-reveal lg:col-span-5 rounded-3xl bg-gradient-to-br from-[#00C8F0] via-[#1767F2] to-[#1e40af] p-7 sm:p-8 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
                {/* Restrained background mesh */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:20px_20px] pointer-events-none opacity-40" />

                {/* Network Topology Graphic */}
                <div className="relative z-10 flex flex-col items-center justify-center py-6 sm:py-8">
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Animated SVG Connection Lines from 4 orbital nodes to center */}
                    <svg
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      viewBox="0 0 256 256"
                      fill="none"
                    >
                      <line x1="50" y1="50" x2="128" y2="128" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeDasharray="4 4" className="cw-dash-flow" />
                      <line x1="206" y1="50" x2="128" y2="128" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeDasharray="4 4" className="cw-dash-flow" />
                      <line x1="50" y1="206" x2="128" y2="128" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeDasharray="4 4" className="cw-dash-flow" />
                      <line x1="206" y1="206" x2="128" y2="128" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeDasharray="4 4" className="cw-dash-flow" />

                      <circle cx="128" cy="128" r="48" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2 4" />
                      <circle cx="128" cy="128" r="85" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    </svg>

                    {/* Orbital Node 1: DNS Heuristics */}
                    <div className="absolute top-2 left-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-2 py-1 text-[8.5px] font-semibold text-white/95 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                      <span>DNS Threat Feeds</span>
                    </div>

                    {/* Orbital Node 2: OCR Vision */}
                    <div className="absolute top-2 right-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-2 py-1 text-[8.5px] font-semibold text-white/95 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                      <span>OCR Vision Engine</span>
                    </div>

                    {/* Orbital Node 3: UPI Pre-Flight */}
                    <div className="absolute bottom-2 left-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-2 py-1 text-[8.5px] font-semibold text-white/95 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                      <span>UPI Risk Checkpoint</span>
                    </div>

                    {/* Orbital Node 4: 1930 Helpline */}
                    <div className="absolute bottom-2 right-2 bg-white/15 backdrop-blur-md border border-white/30 rounded-xl px-2 py-1 text-[8.5px] font-semibold text-white/95 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span>Helpline 1930 Sync</span>
                    </div>

                    {/* Central Shield with Concentric Rings */}
                    <div className="relative flex items-center justify-center z-10">
                      <div className="w-24 h-24 rounded-full border border-white/20 animate-ping absolute pointer-events-none" />
                      <div className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-2xl">
                        <Security size={38} className="text-white drop-shadow-md" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/20 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold tracking-wide uppercase mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span>Multi-Signal Defense Mesh Active</span>
                  </div>
                  <p className="text-xs text-white/85 mt-1 leading-relaxed">
                    Continuous multi-signal verification guarding against extortion and financial loss.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 4: How It Works (Exact CyberWall S-Curve Wavy Path)
            ------------------------------------------------------------------------- */}
        <section id="how-it-works" className="cw-section scroll-mt-24 md:scroll-mt-28 py-20 bg-[#F8FAFC] border-b border-neutral-200 relative">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
            <div className="cw-reveal max-w-2xl text-center mx-auto mb-16 space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-[#1767F2]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1767F2]" />
                How It Works
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-950">
                Four steps to complete digital certainty.
              </h2>
              <p className="text-sm sm:text-base text-neutral-600">
                A calm, deliberate protocol before clicking, paying, or installing unfamiliar applications.
              </p>
            </div>

            {/* S-Curve Continuous Alternating Path */}
            <div className="relative max-w-4xl mx-auto py-8">
              {/* S-Curve Connecting Ribbon SVG with Scroll Progress */}
              <svg
                aria-hidden="true"
                className="hidden md:block pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
                viewBox="0 0 800 900"
                fill="none"
              >
                <path
                  className="cw-scurve-line"
                  d="
                    M 200 100
                    C 650 100 650 350 400 350
                    C 150 350 150 600 400 600
                    C 650 600 650 820 400 820
                  "
                  stroke="url(#cwSCurveGradient)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="cwSCurveGradient" x1="0" y1="0" x2="0" y2="900" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00C8F0" />
                    <stop offset="35%" stopColor="#00AEEF" />
                    <stop offset="70%" stopColor="#1767F2" />
                    <stop offset="100%" stopColor="#4169E1" />
                  </linearGradient>
                </defs>
              </svg>

              {/* 4 Alternating Step Cards: Detect -> Prevent -> Protect -> Recover */}
              <div className="space-y-16 relative z-10">
                {/* Step 01 (Left) - DETECT */}
                <div className="cw-step-card flex flex-col md:flex-row items-center gap-6 md:justify-start">
                  <motion.div
                    whileHover={{ y: -4, scale: 1.015 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex items-center gap-4 max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-default"
                  >
                    <span className="text-4xl sm:text-5xl font-bold font-sans text-blue-500/25 shrink-0">01</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[9px] font-bold text-[#1767F2] uppercase tracking-wider">Detect</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Incoming Content</p>
                      </div>
                      <h4 className="text-base font-bold text-neutral-950 mt-0.5">Share what you received</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        Send the suspicious call details, message, link, QR code, screenshot, or application file to Satark Saathi.
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Step 02 (Right) - PREVENT */}
                <div className="cw-step-card flex flex-col md:flex-row items-center gap-6 md:justify-end">
                  <motion.div
                    whileHover={{ y: -4, scale: 1.015 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex items-center gap-4 max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-default"
                  >
                    <span className="text-4xl sm:text-5xl font-bold font-sans text-blue-500/25 shrink-0">02</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-cyan-50 text-[9px] font-bold text-[#00AEEF] uppercase tracking-wider">Prevent</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">AI + Heuristic Verification</p>
                      </div>
                      <h4 className="text-base font-bold text-neutral-950 mt-0.5">Satark Saathi checks the threat</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        The verification engine analyses available signals, banking domain registries, and coercive phrasing.
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Step 03 (Left) - PROTECT */}
                <div className="cw-step-card flex flex-col md:flex-row items-center gap-6 md:justify-start">
                  <motion.div
                    whileHover={{ y: -4, scale: 1.015 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex items-center gap-4 max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-default"
                  >
                    <span className="text-4xl sm:text-5xl font-bold font-sans text-blue-500/25 shrink-0">03</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-green-50 text-[9px] font-bold text-[#24a148] uppercase tracking-wider">Protect</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Safe Actions Guidance</p>
                      </div>
                      <h4 className="text-base font-bold text-neutral-950 mt-0.5">You receive clear guidance</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        Explains the risk and tells you whether to proceed, verify further, block, report, or avoid.
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Step 04 (Right) - RECOVER */}
                <div className="cw-step-card flex flex-col md:flex-row items-center gap-6 md:justify-end">
                  <motion.div
                    whileHover={{ y: -4, scale: 1.015 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex items-center gap-4 max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-default"
                  >
                    <span className="text-4xl sm:text-5xl font-bold font-sans text-blue-500/25 shrink-0">04</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-[9px] font-bold text-[#8a3ffc] uppercase tracking-wider">Recover</span>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Resolution Confidence</p>
                      </div>
                      <h4 className="text-base font-bold text-neutral-950 mt-0.5">You act with confidence</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        The suspicious interaction is stopped before it turns into financial loss, identity theft, or malware exposure.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 5: Input Methods (Exact CyberWall 3-Card Layout)
            ------------------------------------------------------------------------- */}
        <section id="inputs" className="cw-section scroll-mt-24 md:scroll-mt-28 py-20 bg-white border-b border-neutral-200">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
            <div className="cw-reveal flex flex-col md:flex-row md:items-end justify-between gap-4 mb-14">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1767F2] block mb-2">
                  Input Methods / How You Send
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-950">
                  Send whatever you're unsure about.
                </h2>
                <p className="text-base text-neutral-600 mt-2">
                  Satark Saathi understands what you're trying to verify.
                </p>
              </div>

              <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full">
                Text, image, or audio
              </span>
            </div>

            {/* 3 Large Input Method Showcase Cards with Motion for React */}
            <div className="grid md:grid-cols-3 gap-6">
              {INPUT_METHODS.map((m, idx) => {
                const IconComp = m.icon;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ y: -6, scale: 1.015 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="cw-input-card bg-[#F8FAFC] border border-neutral-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-shadow cursor-default"
                  >
                    {/* Visual Mockup inside card */}
                    <div className={`h-40 rounded-2xl ${m.bgTone} border ${m.borderTone} p-4 flex items-center justify-center mb-6`}>
                      {m.mockup.type === 'text' && (
                        <div className="bg-white rounded-xl p-3 border border-neutral-200 shadow-xs max-w-[220px] space-y-1">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>{m.mockup.label}</span>
                          </div>
                          <p className="text-[10px] text-neutral-700 leading-snug font-medium">
                            {m.mockup.content}
                          </p>
                        </div>
                      )}

                      {m.mockup.type === 'image' && (
                        <div className="bg-white rounded-xl p-3 border border-neutral-200 shadow-xs max-w-[200px] w-full space-y-2">
                          <div className="h-2 w-16 bg-neutral-200 rounded" />
                          <div className="h-2 w-28 bg-neutral-100 rounded" />
                          <div className="p-1.5 bg-red-50 text-red-600 text-[9px] font-bold rounded text-center">
                            {m.mockup.alert}
                          </div>
                        </div>
                      )}

                      {m.mockup.type === 'audio' && (
                        <div className="bg-white rounded-full px-4 py-2 border border-neutral-200 shadow-xs flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center animate-pulse">
                            <Microphone size={14} />
                          </span>
                          <div className="flex items-center gap-0.5 h-6">
                            <span className="w-0.5 bg-blue-500 rounded-full animate-wave-1" />
                            <span className="w-0.5 bg-blue-500 rounded-full animate-wave-2" />
                            <span className="w-0.5 bg-blue-500 rounded-full animate-wave-3" />
                            <span className="w-0.5 bg-blue-500 rounded-full animate-wave-4" />
                            <span className="w-0.5 bg-blue-500 rounded-full animate-wave-5" />
                            <span className="w-0.5 bg-blue-500 rounded-full animate-wave-6" />
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500">{m.mockup.duration}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-neutral-950">{m.title}</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{m.subtitle}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-200/70 flex items-center justify-between">
                      <Link to="/scanner">
                        <Button kind="tertiary" size="sm" renderIcon={ArrowRight}>
                          Launch in Engine
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 6: Emergency Recovery 1930 & Golden Hour
            ------------------------------------------------------------------------- */}
        <section id="recovery" className="cw-section scroll-mt-24 md:scroll-mt-28 py-20 bg-[#F8FAFC] border-b border-neutral-200">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
            <motion.div
              whileHover={{ scale: 1.006 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="cw-recovery-card bg-white border-2 border-red-200 rounded-3xl p-8 sm:p-12 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="max-w-3xl space-y-3 mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                  <Phone size={14} />
                  <span>National Cybercrime Helpline: 1930</span>
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-950">
                  Already lost money? Act immediately.
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  The first 2 to 3 hours represent the <strong>Golden Hour</strong>. Banking rails can place an immediate lien on the beneficiary account before funds are cashed out via mule ATMs.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-xs font-bold text-neutral-950 block">1. Stop Transfers</span>
                  <p className="text-xs text-neutral-600 mt-1">Never pay "tax clearance" or "unfreeze" fees.</p>
                </div>
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200">
                  <span className="text-xs font-bold text-red-600 block">2. Call 1930</span>
                  <p className="text-xs text-neutral-600 mt-1">Provide UTR and beneficiary account for instant lien.</p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-xs font-bold text-neutral-950 block">3. Report Incident</span>
                  <p className="text-xs text-neutral-600 mt-1">Register formal report on cybercrime.gov.in.</p>
                </div>
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-xs font-bold text-neutral-950 block">4. Generate Dossier</span>
                  <p className="text-xs text-neutral-600 mt-1">Use Satark Saathi to format evidence for your bank.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-neutral-100">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <a href="tel:1930">
                    <Button kind="danger" size="lg" renderIcon={Phone}>
                      Dial Helpline 1930
                    </Button>
                  </a>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link to="/golden-hour">
                    <Button kind="tertiary" size="lg" renderIcon={Flash}>
                      Open Recovery Dossier Tool
                    </Button>
                  </Link>
                </motion.div>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 ml-auto"
                >
                  <span>Official Portal: cybercrime.gov.in</span>
                  <Launch size={14} />
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 7: Frequently Asked Questions
            ------------------------------------------------------------------------- */}
        <section id="faq" className="cw-section scroll-mt-24 md:scroll-mt-28 py-20 bg-white border-b border-neutral-200">
          <div className="mx-auto w-full max-w-4xl px-5 md:px-6">
            <div className="cw-reveal text-center max-w-2xl mx-auto mb-14 space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-[#1767F2]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1767F2]" />
                FAQ
              </span>
              <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950">
                Frequently Asked Questions
              </h3>
            </div>

            <div className="space-y-3">
              {FAQ_LIST.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.004 }}
                    transition={{ duration: 0.2 }}
                    className="cw-reveal border border-neutral-200 rounded-2xl overflow-hidden bg-[#F8FAFC] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-neutral-900 hover:text-[#1767F2] cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={18} className={`transform transition-transform text-neutral-500 duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-200 bg-white">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 8: Final Call to Action
            ------------------------------------------------------------------------- */}
        <section className="cw-section py-20 bg-gradient-to-br from-[#00AEEF] via-[#1767F2] to-[#1e40af] text-white">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-6 text-center space-y-6">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Stop scams before you act.
            </h3>
            <p className="text-base text-white/90 max-w-xl mx-auto leading-relaxed">
              Verify suspicious messages, links, and coercive payment demands with Satark Saathi.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link to="/scanner">
                <Button
                  kind="primary"
                  size="lg"
                  renderIcon={ArrowRight}
                  className="min-h-[48px] px-8 text-sm sm:text-base font-medium bg-[#0f62fe] hover:bg-[#0353e9] text-white shadow-md"
                >
                  Try Satark Saathi Free
                </Button>
              </Link>
              <Link to="/golden-hour">
                <Button
                  kind="tertiary"
                  size="lg"
                  renderIcon={Flash}
                  className="min-h-[48px] px-6 text-sm sm:text-base font-medium border-white text-white hover:bg-white hover:text-[#161616]"
                >
                  Recovery Desk
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------------------
          FOOTER
          ------------------------------------------------------------------------- */}
      <footer className="bg-neutral-900 text-neutral-400 py-12 text-xs border-t border-neutral-800">
        <div className="mx-auto w-full max-w-7xl px-5 md:px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#1767F2] text-white flex items-center justify-center">
                <Security size={18} />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Satark Saathi</span>
                <span className="block text-[11px] text-neutral-400">सतर्क साथी &bull; Stop. Verify. Stay Safe.</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-neutral-300">
              <Link to="/scanner" className="hover:text-white transition-colors">Scam Engine</Link>
              <Link to="/payment-checkpoint" className="hover:text-white transition-colors">Payment Checkpoint</Link>
              <Link to="/family-shield" className="hover:text-white transition-colors">Family Shield</Link>
              <Link to="/golden-hour" className="hover:text-white transition-colors">1930 Recovery</Link>
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">cybercrime.gov.in</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
            <p>&copy; {new Date().getFullYear()} Satark Saathi. Developed for Indian digital public safety.</p>
            <p>Advisory Platform &bull; Non-Invasive Heuristic Engine &bull; National Helpline 1930</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
