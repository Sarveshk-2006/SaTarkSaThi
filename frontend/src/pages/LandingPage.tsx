import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

interface Scenario {
  id: string;
  category: string;
  userQuery: string;
  responseHeadline: string;
  trustScore: number;
  body: string;
  warningNote: string;
  recoveryNote: string;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [quickInput, setQuickInput] = useState('');

  const currentScenario = SCENARIOS[selectedScenarioIdx];

  // GSAP Animations matching CyberWall style
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('.cw-reveal, .cw-hero-phone, .cw-hero-card, .cw-wavy-path', {
          opacity: 1,
          y: 0,
          scale: 1,
          clearProps: 'all',
        });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Hero entrance sequence
        const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });

        tl.from('.cw-hero-badge', { y: -15, opacity: 0, duration: 0.5 })
          .from('.cw-hero-title', { y: 25, opacity: 0, duration: 0.7 }, '-=0.3')
          .from('.cw-hero-sub', { y: 18, opacity: 0, duration: 0.6 }, '-=0.4')
          .from('.cw-hero-cta', { y: 16, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.3')
          .from('.cw-hero-phone', { y: 40, opacity: 0, scale: 0.95, duration: 0.9 }, '-=0.5')
          .from('.cw-hero-card', { y: 24, opacity: 0, stagger: 0.12, duration: 0.6 }, '-=0.5');

        // Continuous floating motion on floating cards
        gsap.to('.cw-float-1', { y: -8, duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        gsap.to('.cw-float-2', { y: -10, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.4 });
        gsap.to('.cw-float-3', { y: -7, duration: 2.9, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.8 });
        gsap.to('.cw-float-4', { y: -9, duration: 3.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.2 });

        // Scroll reveals for sections
        const sections = gsap.utils.toArray<HTMLElement>('.cw-section');
        sections.forEach((sec) => {
          gsap.from(sec.querySelectorAll('.cw-reveal'), {
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
        });
      });
    },
    { scope: containerRef }
  );

  const handleScenarioChange = (idx: number) => {
    if (idx === selectedScenarioIdx) return;
    setSelectedScenarioIdx(idx);

    gsap.fromTo(
      '.cw-phone-chat',
      { opacity: 0.5, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
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
      <header className="sticky top-0 z-50 px-3 pt-3">
        <div className="mx-auto flex h-fit w-full max-w-7xl items-center justify-between rounded-full border border-neutral-200/80 bg-white/85 px-4 py-2.5 shadow-sm shadow-neutral-950/5 backdrop-blur-xl md:px-6">
          {/* Logo on Left */}
          <Link to="/welcome" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00C8F0] via-[#00AEEF] to-[#1767F2] text-white flex items-center justify-center shadow-sm">
              <Security size={18} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-tight text-neutral-950">
                Satark Saathi
              </span>
              <span className="text-[10px] text-neutral-500 font-medium">
                सतर्क साथी &bull; Digital Safety
              </span>
            </div>
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            <a href="#why-satark" className="hover:text-[#1767F2] transition-colors">Why Satark</a>
            <a href="#how-it-works" className="hover:text-[#1767F2] transition-colors">How it Works</a>
            <a href="#inputs" className="hover:text-[#1767F2] transition-colors">Engine</a>
            <a href="#recovery" className="hover:text-[#1767F2] transition-colors">Recovery 1930</a>
            <a href="#faq" className="hover:text-[#1767F2] transition-colors">FAQ</a>
          </nav>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            <Link to="/scanner">
              <button
                type="button"
                className="bg-gradient-to-r from-[#00AEEF] to-[#1767F2] hover:opacity-95 text-white font-semibold text-xs sm:text-sm rounded-full px-5 py-2 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
              >
                Try Now
              </button>
            </Link>

            {session ? (
              <Link to="/" className="hidden sm:inline-block">
                <Button kind="ghost" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/login" className="hidden sm:inline-block">
                <Button kind="ghost" size="sm">Sign In</Button>
              </Link>
            )}

            {/* Mobile menu hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 md:hidden text-neutral-700 hover:text-neutral-950"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <Close size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mx-auto max-w-7xl mt-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-neutral-700">
              <a href="#why-satark" onClick={() => setMobileMenuOpen(false)} className="py-1 px-2 rounded hover:bg-neutral-50">Why Satark</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1 px-2 rounded hover:bg-neutral-50">How it Works</a>
              <a href="#inputs" onClick={() => setMobileMenuOpen(false)} className="py-1 px-2 rounded hover:bg-neutral-50">Engine &amp; Inputs</a>
              <a href="#recovery" onClick={() => setMobileMenuOpen(false)} className="py-1 px-2 rounded hover:bg-neutral-50">Recovery 1930</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-1 px-2 rounded hover:bg-neutral-50">FAQ</a>
            </nav>
            <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
              <Link to="/scanner" onClick={() => setMobileMenuOpen(false)}>
                <button type="button" className="w-full bg-[#1767F2] text-white py-2 rounded-xl font-semibold text-xs">
                  Launch Scam Scanner
                </button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* -------------------------------------------------------------------------
            HERO SECTION: CyberWall Centered Typography + Wavy Ribbon + Phone Mockup
            ------------------------------------------------------------------------- */}
        <section className="relative isolate overflow-hidden pt-8 pb-12 sm:pt-12 md:pt-14 lg:pb-16">
          {/* Ambient Blurred Colored Glow Blobs (Exact CyberWall Style) */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute top-16 left-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[#00C8F0]/15 blur-[90px]" />
            <div className="absolute top-12 right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[#1767F2]/15 blur-[100px]" />
            <div className="absolute bottom-0 left-1/2 h-64 w-[50rem] -translate-x-1/2 rounded-full bg-blue-500/5 blur-[90px]" />
          </div>

          <div className="mx-auto w-full max-w-7xl px-5 md:px-6 relative z-10">
            {/* Centered Eyebrow, Headline & Slogan */}
            <div className="mx-auto max-w-4xl text-center">
              {/* Eyebrow Pill */}
              <div className="cw-hero-badge inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white py-1.5 pr-4 pl-2 shadow-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1767F2]">
                  <Security size={14} />
                </span>
                <span className="text-xs font-semibold text-neutral-700">
                  Official Indian Digital Safety Initiative
                </span>
              </div>

              {/* Main Headline: "Stop scams before you act." */}
              <h1 className="cw-hero-title mx-auto mt-6 max-w-4xl font-sans text-5xl leading-[0.98] font-bold tracking-tight text-neutral-950 sm:text-6xl md:text-7xl lg:text-[5.75rem]">
                Stop scams <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C8F0] via-[#00AEEF] to-[#1767F2]">
                  before
                </span>{' '}
                you act.
              </h1>

              {/* Subtitles */}
              <p className="cw-hero-sub mx-auto mt-5 max-w-2xl text-lg leading-relaxed font-semibold text-neutral-700 sm:text-xl">
                AI-powered digital safety assistant for Indian citizens.
              </p>
              <p className="cw-hero-sub mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-base">
                Share anything suspicious and receive a clear risk assessment before you click, pay, install, reply, or share personal information.
              </p>

              {/* Centered CTAs */}
              <div className="cw-hero-cta mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
                <Link to="/scanner">
                  <button
                    type="button"
                    className="bg-gradient-to-r from-[#00AEEF] to-[#1767F2] hover:opacity-95 text-white font-semibold text-base rounded-full px-8 py-3.5 shadow-lg shadow-blue-500/25 transition-all min-w-36 cursor-pointer"
                  >
                    Try Now
                  </button>
                </Link>

                <a
                  href="tel:1930"
                  className="inline-flex items-center gap-1.5 font-medium underline decoration-neutral-300 underline-offset-4 text-sm text-neutral-600 hover:text-[#1767F2] transition-colors"
                >
                  <Phone size={14} className="text-[#D92D20]" />
                  <span>Already lost money? Call 1930</span>
                </a>
              </div>

              {/* Quick Input Bar (Instant Free Resource) */}
              <form onSubmit={handleQuickSubmit} className="mt-6 max-w-xl mx-auto flex items-center gap-2 bg-white border border-neutral-300 rounded-full p-1.5 shadow-sm">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Paste suspicious SMS, link or sender number to test..."
                  className="flex-1 px-4 py-2 text-xs sm:text-sm text-neutral-900 bg-transparent focus:outline-none"
                  aria-label="Test a message"
                />
                <button
                  type="submit"
                  className="bg-[#1767F2] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-full transition-colors shrink-0"
                >
                  Check
                </button>
              </form>
            </div>

            {/* -------------------------------------------------------------------------
                SHOWCASE: Desktop Phone Mockup + Curved Ribbon SVG + 4 Floating Cards
                ------------------------------------------------------------------------- */}
            <div className="relative mx-auto mt-10 hidden min-h-[620px] max-w-6xl lg:block">
              {/* Exact CyberWall Hero Curved Ribbon SVG Line */}
              <svg
                aria-hidden="true"
                className="cw-wavy-path pointer-events-none absolute inset-x-0 top-12 z-0 h-[500px] w-full overflow-visible"
                viewBox="0 0 1200 500"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="
                    M-60 80
                    C120 80 130 360 300 360
                    S470 140 620 180
                    S760 420 920 390
                    S1080 250 1260 440
                  "
                  stroke="url(#cwHeroPathGradient)"
                  strokeWidth="19"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <defs>
                  <linearGradient id="cwHeroPathGradient" x1="-60" y1="310" x2="1260" y2="310" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00C8F0" />
                    <stop offset="45%" stopColor="#00AEEF" />
                    <stop offset="70%" stopColor="#1767F2" />
                    <stop offset="100%" stopColor="#4169E1" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Central Smartphone Mockup (iPhone with WhatsApp Simulation) */}
              <div className="cw-hero-phone absolute top-4 left-1/2 z-10 -translate-x-1/2 w-64">
                {/* Scenario switcher pills above phone */}
                <div className="flex items-center justify-center gap-1.5 mb-2.5">
                  {SCENARIOS.map((sc, i) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleScenarioChange(i)}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                        selectedScenarioIdx === i
                          ? 'bg-[#1767F2] text-white shadow-xs'
                          : 'bg-white/90 text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                      }`}
                    >
                      {sc.category.split('/')[0].trim()}
                    </button>
                  ))}
                </div>

                <div className="aspect-[9/19] overflow-hidden rounded-[2.65rem] border-[7px] border-neutral-950 bg-neutral-950 shadow-2xl shadow-blue-500/20">
                  <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-[#efeae2]">
                    {/* Phone Header */}
                    <div className="relative flex shrink-0 items-center gap-2 bg-white px-2.5 pt-5 pb-2 shadow-xs">
                      <span className="absolute top-1.5 left-1/2 h-3 w-12 -translate-x-1/2 rounded-full bg-neutral-950" />
                      <span className="text-sm font-bold text-neutral-700">‹</span>
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-[#1767F2] ring-1 ring-neutral-200">
                        <Security size={16} />
                      </span>
                      <div className="min-w-0 flex-1 leading-tight">
                        <p className="truncate text-[10px] font-bold text-neutral-950">Satark Saathi</p>
                        <p className="text-[7px] text-[#24a148] font-medium">online</p>
                      </div>
                      <span className="text-xs text-neutral-500">⋮</span>
                    </div>

                    {/* Chat Area */}
                    <div className="cw-phone-chat flex-1 overflow-y-auto px-2 py-2 space-y-2 text-[9px] bg-[#efeae2]">
                      <div className="flex justify-center">
                        <span className="rounded bg-white/90 px-1.5 py-0.5 text-[7px] font-medium text-neutral-500">Today</span>
                      </div>

                      {/* Outgoing User Message */}
                      <div className="ml-auto max-w-[88%] rounded-lg rounded-tr-none bg-[#d9fdd3] p-2 shadow-xs text-neutral-800 leading-relaxed">
                        <p>{currentScenario.userQuery}</p>
                        <div className="mt-0.5 text-right text-[6px] text-neutral-400">10:24 ✓✓</div>
                      </div>

                      {/* Incoming Satark Saathi Analysis */}
                      <div className="mr-auto max-w-[94%] rounded-lg rounded-tl-none bg-white p-2.5 shadow-xs text-neutral-800 space-y-1.5 leading-relaxed">
                        <p className="font-semibold text-neutral-950">{currentScenario.responseHeadline}</p>
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[8px] font-bold">
                          Trust Score: {currentScenario.trustScore}/100 &bull; DANGEROUS
                        </div>
                        <p className="text-[8.5px] text-neutral-600">{currentScenario.body}</p>
                        <p className="text-[8.5px] text-neutral-600">{currentScenario.warningNote}</p>
                        <p className="text-[8px] text-neutral-500 pt-0.5 border-t border-neutral-100">{currentScenario.recoveryNote}</p>
                        <div className="text-right text-[6px] text-neutral-400">10:25</div>
                      </div>
                    </div>

                    {/* Bottom Input Pill */}
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-neutral-100 border-t border-neutral-200">
                      <div className="flex-1 bg-white rounded-full px-2 py-1 text-[8px] text-neutral-400">Message</div>
                      <div className="w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[9px]">
                        <Microphone size={10} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Floating White Cards (Exact CyberWall Placements) */}
              {/* Card 1: Top-Left */}
              <div className="cw-hero-card cw-float-1 absolute top-[90px] left-[6%] z-30 w-[270px] -rotate-1">
                <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xl transition-transform hover:-translate-y-1">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2]">
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
              </div>

              {/* Card 2: Top-Right */}
              <div className="cw-hero-card cw-float-2 absolute top-[105px] right-[5%] z-30 w-[280px] rotate-1">
                <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xl transition-transform hover:-translate-y-1">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2]">
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
              </div>

              {/* Card 3: Bottom-Left */}
              <div className="cw-hero-card cw-float-3 absolute bottom-[65px] left-[7%] z-30 w-[270px] rotate-1">
                <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xl transition-transform hover:-translate-y-1">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2]">
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
              </div>

              {/* Card 4: Bottom-Right */}
              <div className="cw-hero-card cw-float-4 absolute bottom-[45px] right-[7%] z-30 w-[280px] -rotate-1">
                <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xl transition-transform hover:-translate-y-1">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1767F2]">
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

            {/* Mobile Stack Visual for Small Screens */}
            <div className="lg:hidden mt-8 max-w-sm mx-auto space-y-4">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-md space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                  <Security size={16} className="text-[#1767F2]" />
                  <span className="text-xs font-bold text-neutral-950">WhatsApp Threat Simulation</span>
                </div>
                <div className="p-3 bg-[#d9fdd3] rounded-lg text-xs text-neutral-900 leading-relaxed">
                  {currentScenario.userQuery}
                </div>
                <div className="p-3 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 space-y-1.5">
                  <Tag type="red" size="sm">Trust Score: {currentScenario.trustScore}/100 &bull; Dangerous</Tag>
                  <p className="font-semibold text-neutral-950">{currentScenario.responseHeadline}</p>
                  <p className="text-neutral-600">{currentScenario.body}</p>
                </div>
              </div>
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
        <section id="why-satark" className="cw-section py-16 md:py-24 bg-white border-b border-neutral-200">
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

                {/* 6 Category Pills (Exact CyberWall Grid) */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { title: 'Suspicious websites', icon: Globe },
                    { title: 'Fraudulent SMS', icon: Chat },
                    { title: 'Unknown calls', icon: Phone },
                    { title: 'Phishing emails', icon: Document },
                    { title: 'Fake bank details', icon: Wallet },
                    { title: 'Malicious APK files', icon: Flash },
                  ].map((cat, i) => {
                    const CatIcon = cat.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 p-3 bg-white border border-neutral-200/80 rounded-xl shadow-2xs hover:shadow-sm transition-all"
                      >
                        <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#1767F2] flex items-center justify-center shrink-0">
                          <CatIcon size={14} />
                        </span>
                        <span className="text-xs font-semibold text-neutral-800">{cat.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Card (5 cols) - Illuminated Shield Banner */}
              <div className="cw-reveal lg:col-span-5 rounded-3xl bg-gradient-to-br from-[#00C8F0] via-[#1767F2] to-[#1e40af] p-8 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col items-center justify-center py-12">
                  {/* Concentric Pulsing Radar Rings */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full border border-white/20 animate-ping absolute" />
                    <div className="w-28 h-28 rounded-full border border-white/30 animate-pulse absolute" />
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl">
                      <Security size={40} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/20 text-center">
                  <p className="text-sm font-bold">The Satark Saathi Shield</p>
                  <p className="text-xs text-white/80 mt-1">
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
        <section id="how-it-works" className="cw-section py-20 bg-[#F8FAFC] border-b border-neutral-200 relative">
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
              {/* S-Curve Connecting Ribbon SVG */}
              <svg
                aria-hidden="true"
                className="hidden md:block pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
                viewBox="0 0 800 900"
                fill="none"
              >
                <path
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

              {/* 4 Alternating Step Cards */}
              <div className="space-y-16 relative z-10">
                {/* Step 01 (Left) */}
                <div className="cw-reveal flex flex-col md:flex-row items-center gap-6 md:justify-start">
                  <div className="flex items-center gap-4 max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <span className="text-4xl sm:text-5xl font-bold font-sans text-blue-500/25 shrink-0">01</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#1767F2]">Incoming Content</p>
                      <h4 className="text-base font-bold text-neutral-950 mt-0.5">Share what you received</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        Send the suspicious call details, message, link, QR code, screenshot, or application file to Satark Saathi.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 02 (Right) */}
                <div className="cw-reveal flex flex-col md:flex-row items-center gap-6 md:justify-end">
                  <div className="flex items-center gap-4 max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <span className="text-4xl sm:text-5xl font-bold font-sans text-blue-500/25 shrink-0">02</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#1767F2]">AI + Heuristic Verification</p>
                      <h4 className="text-base font-bold text-neutral-950 mt-0.5">Satark Saathi checks the threat</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        The verification engine analyses available signals, banking domain registries, and coercive phrasing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 03 (Left) */}
                <div className="cw-reveal flex flex-col md:flex-row items-center gap-6 md:justify-start">
                  <div className="flex items-center gap-4 max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <span className="text-4xl sm:text-5xl font-bold font-sans text-blue-500/25 shrink-0">03</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#1767F2]">Safe Actions</p>
                      <h4 className="text-base font-bold text-neutral-950 mt-0.5">You receive clear guidance</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        Explains the risk and tells you whether to proceed, verify further, block, report, or avoid.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 04 (Right) */}
                <div className="cw-reveal flex flex-col md:flex-row items-center gap-6 md:justify-end">
                  <div className="flex items-center gap-4 max-w-md bg-white border border-neutral-200 rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow">
                    <span className="text-4xl sm:text-5xl font-bold font-sans text-blue-500/25 shrink-0">04</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#1767F2]">Protection Active</p>
                      <h4 className="text-base font-bold text-neutral-950 mt-0.5">You act with confidence</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        The suspicious interaction is stopped before it turns into financial loss, identity theft, or malware exposure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 5: Input Methods (Exact CyberWall 3-Card Layout)
            ------------------------------------------------------------------------- */}
        <section id="inputs" className="cw-section py-20 bg-white border-b border-neutral-200">
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

            {/* 3 Large Input Method Showcase Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {INPUT_METHODS.map((m, idx) => {
                const IconComp = m.icon;
                return (
                  <div
                    key={idx}
                    className="cw-reveal bg-[#F8FAFC] border border-neutral-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
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
                          <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Microphone size={14} />
                          </span>
                          <div className="flex items-center gap-0.5">
                            <span className="w-0.5 h-3 bg-blue-500 rounded" />
                            <span className="w-0.5 h-5 bg-blue-500 rounded" />
                            <span className="w-0.5 h-2 bg-blue-500 rounded" />
                            <span className="w-0.5 h-4 bg-blue-500 rounded" />
                            <span className="w-0.5 h-6 bg-blue-500 rounded" />
                            <span className="w-0.5 h-3 bg-blue-500 rounded" />
                          </div>
                          <span className="text-[10px] font-mono text-neutral-500">{m.mockup.duration}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-neutral-950">{m.title}</h4>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{m.subtitle}</p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-neutral-200/70 flex items-center justify-between text-xs font-semibold text-[#1767F2]">
                      <Link to="/scanner" className="inline-flex items-center gap-1 hover:underline">
                        <span>Launch in Engine</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 6: Emergency Recovery 1930 & Golden Hour
            ------------------------------------------------------------------------- */}
        <section id="recovery" className="cw-section py-20 bg-[#F8FAFC] border-b border-neutral-200">
          <div className="mx-auto w-full max-w-7xl px-5 md:px-6">
            <div className="cw-reveal bg-white border-2 border-red-200 rounded-3xl p-8 sm:p-12 shadow-md">
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
                <a href="tel:1930">
                  <Button kind="danger" size="lg" renderIcon={Phone}>
                    Dial Helpline 1930
                  </Button>
                </a>
                <Link to="/golden-hour">
                  <Button kind="tertiary" size="lg" renderIcon={Flash}>
                    Open Recovery Dossier Tool
                  </Button>
                </Link>
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
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------------------
            SECTION 7: Frequently Asked Questions
            ------------------------------------------------------------------------- */}
        <section id="faq" className="cw-section py-20 bg-white border-b border-neutral-200">
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
                  <div
                    key={idx}
                    className="cw-reveal border border-neutral-200 rounded-2xl overflow-hidden bg-[#F8FAFC] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-neutral-900 hover:text-[#1767F2] cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown size={18} className={`transform transition-transform text-neutral-500 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-200 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
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
                <button
                  type="button"
                  className="bg-white text-[#1767F2] hover:bg-neutral-100 font-bold text-sm sm:text-base rounded-full px-8 py-3.5 shadow-xl transition-all cursor-pointer"
                >
                  Try Satark Saathi Free
                </button>
              </Link>
              <Link to="/golden-hour">
                <button
                  type="button"
                  className="bg-black/30 hover:bg-black/50 text-white font-semibold text-sm sm:text-base rounded-full px-7 py-3.5 border border-white/20 transition-all cursor-pointer"
                >
                  Recovery Desk
                </button>
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
