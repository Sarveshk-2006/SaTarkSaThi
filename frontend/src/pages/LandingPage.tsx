import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Wallet,
  View,
  Help,
  WarningAlt,
  Phone,
  Security,
  UserMultiple,
  Flash,
  Launch,
} from '@carbon/icons-react';
import { Tile, Button, Tag } from '@carbon/react';
import { useAuthSession } from '../context/AuthSessionContext';

const FEATURES = [
  {
    icon: WarningAlt,
    title: 'Scam Analyzer',
    body: 'Paste a suspicious SMS, WhatsApp message, link or call transcript and get an explainable, risk-scored assessment.',
  },
  {
    icon: Wallet,
    title: 'Payment Checkpoint',
    body: 'Pre-flight transactional verification and coercive pressure check-in before funds leave your account.',
  },
  {
    icon: UserMultiple,
    title: 'Family Shield',
    body: 'Authoritative two-way consent architecture linking elderly parents with trusted family guardians.',
  },
  {
    icon: Flash,
    title: 'One-Tap Golden Hour',
    body: 'Instant simultaneous multi-desk recovery dossier: Cyber Crime 1930 portal, bank lien recall, and cyber police complaint.',
  },
  {
    icon: View,
    title: 'Senior Citizen Mode',
    body: 'Large typography, high-contrast visual cues, minimum 44px tap targets, and dedicated one-tap emergency shortcuts.',
  },
  {
    icon: Security,
    title: 'Zero-Leakage Architecture',
    body: 'Discreet safety phrases stored only as salted cryptographic hashes; zero transmission of plain-text secrets.',
  },
];

const PROBLEMS = [
  {
    title: '“Digital Arrest” & Extortion Calls',
    body: 'Impersonators posing as CBI, ED, or Mumbai Police keep victims isolated on video calls while demanding urgent security deposits.',
  },
  {
    title: 'Instantaneous Panic UPI Transfers',
    body: 'Immediate payment rails give victims zero buffer to consult trusted family members when threatened with arrest or power cutoffs.',
  },
  {
    title: 'The Lost Golden Hour Window',
    body: 'The critical first 2 to 3 hours slip away while panicked citizens struggle to compile bank statements, UTRs, and police filings.',
  },
];

export const LandingPage: React.FC = () => {
  const { session } = useAuthSession();
  const cta = session ? { to: '/', label: 'Open Command Centre' } : { to: '/login', label: 'Launch Interactive Demo' };

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-[#161616]">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 bg-[#161616] text-white border-b border-[#393939]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/welcome" className="flex items-center gap-3">
            <span className="w-8 h-8 bg-[#0f62fe] text-white flex items-center justify-center">
              <Security size={20} />
            </span>
            <div className="leading-tight">
              <span className="block font-semibold text-sm tracking-tight">Satark Saathi</span>
              <span className="block text-[11px] text-[#c6c6c6]">सतर्क साथी &bull; Cyber-Fraud Defense</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#c6c6c6]" aria-label="Page sections">
            <a href="#problem" className="hover:text-white transition-colors">Threat Context</a>
            <a href="#features" className="hover:text-white transition-colors">Defense Modules</a>
            <a href="#how" className="hover:text-white transition-colors">Golden Hour Protocol</a>
          </nav>
          <Link to={cta.to}>
            <Button kind="primary" size="sm" renderIcon={ArrowRight}>
              {session ? 'Dashboard' : 'Sign in'}
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-[#e0e0e0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <Tag type="teal" size="md">
                Active Intervention &bull; Not Just Another Passive Log
              </Tag>
              <h1 className="mt-4 text-4xl sm:text-5xl font-semibold tracking-tight text-[#161616] leading-[1.15]">
                Stop. Verify. <span className="text-[#0f62fe]">Stay Safe.</span>
              </h1>
              <p className="mt-5 text-base text-[#525252] leading-relaxed max-w-2xl">
                Satark Saathi provides enterprise-grade cyber-fraud prevention and rapid golden-hour recovery designed for Indian citizens. It inspects deceptive threats, intercepts panic transactions with family consent, and prepares formal 1930 dispute dossiers with zero fabrication.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={cta.to}>
                  <Button kind="primary" size="lg" renderIcon={ArrowRight}>
                    {cta.label}
                  </Button>
                </Link>
                <a href="#how">
                  <Button kind="secondary" size="lg">
                    Examine Recovery Workflow
                  </Button>
                </a>
              </div>
              <p className="mt-4 text-xs text-[#8d8d8d]">
                Evaluation Prototype. Dispatches to banks and police portals are simulated for safe demonstration.
              </p>
            </div>

            {/* Illustrative phone card */}
            <div className="lg:col-span-5 flex justify-center" aria-hidden="true">
              <div className="w-[320px] bg-[#161616] text-white border-4 border-[#393939] shadow-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-[#393939] pb-3">
                  <div className="flex items-center gap-2">
                    <Security size={18} className="text-[#0f62fe]" />
                    <span className="text-xs font-semibold tracking-tight">Payment Checkpoint</span>
                  </div>
                  <Tag type="red" size="sm">CRITICAL RISK</Tag>
                </div>

                <div className="bg-[#262626] p-4 border-l-4 border-l-[#da1e28] space-y-2">
                  <p className="text-xs text-[#c6c6c6]">Recipient: CBI Escrow Clearance Cell</p>
                  <p className="text-2xl font-mono font-bold text-white">₹50,000</p>
                  <div className="text-[11px] text-[#ff8389] space-y-1 pt-1">
                    <p>&bull; Personal UPI handle posing as authority</p>
                    <p>&bull; Active coercion: isolation demand</p>
                    <p>&bull; Coercion phrase detected in response</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <a
                    href="tel:1930"
                    className="p-2.5 bg-[#da1e28] text-white font-semibold text-center flex items-center justify-center gap-1.5"
                  >
                    <Phone size={14} /> Call 1930
                  </a>
                  <div className="p-2.5 bg-[#0f62fe] text-white font-semibold text-center flex items-center justify-center gap-1.5">
                    <UserMultiple size={14} /> Alert Guardian
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Threat Context */}
        <section id="problem" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#161616]">Why Existing Banking Apps Fail in Panic Moments</h2>
            <p className="text-sm text-[#525252] mt-2 max-w-3xl">
              Traditional UPI applications prioritize transfer friction reduction. When victims are subjected to psychological coercion and fear tactics, passive balance notifications arrive too late.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PROBLEMS.map((p) => (
              <Tile key={p.title} className="p-6 shadow-sm border border-[#e0e0e0] bg-white">
                <h3 className="font-semibold text-base text-[#161616]">{p.title}</h3>
                <p className="mt-2 text-xs text-[#525252] leading-relaxed">{p.body}</p>
              </Tile>
            ))}
          </div>
        </section>

        {/* Defense Modules */}
        <section id="features" className="bg-white border-y border-[#e0e0e0] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#161616]">Integrated Defense Architecture</h2>
              <p className="text-sm text-[#525252] mt-2">
                Built on IBM Carbon principles: clarity, accessibility, and high information-density without cognitive overload.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <Tile key={title} className="p-6 border border-[#e0e0e0] shadow-sm space-y-3">
                  <span className="inline-flex p-2.5 bg-[#edf5ff] text-[#0f62fe]">
                    <Icon size={22} />
                  </span>
                  <h3 className="font-semibold text-base text-[#161616]">{title}</h3>
                  <p className="text-xs text-[#525252] leading-relaxed">{body}</p>
                </Tile>
              ))}
            </div>
          </div>
        </section>

        {/* Golden Hour Protocol */}
        <section id="how" className="bg-[#161616] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-8">
              <span className="text-xs font-semibold text-[#0f62fe] uppercase tracking-wider">
                End-to-End Incident Lifecycle
              </span>
              <h2 className="text-2xl font-semibold text-white mt-1">
                Before, During &amp; After Financial Dispatches
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: 'Phase 1: Verification', title: 'Scam Analyzer', body: 'Analyze suspected SMS, URLs, OCR screenshots, or voice call transcripts with full explainability.' },
                { step: 'Phase 2: Checkpoint', title: 'Guardian Interception', body: 'Pause unconfirmed transactions; require family guardian approval or invoke discreet duress phrases.' },
                { step: 'Phase 3: Golden Hour', title: 'Multi-Desk Action', body: 'Compile non-fabricated 1930 dispute text, bank nodal recall notices, and police filings in one tap.' },
              ].map((s) => (
                <div key={s.step} className="border border-[#393939] bg-[#262626] p-6 space-y-2">
                  <p className="text-[11px] font-semibold text-[#4589ff] uppercase tracking-wider">{s.step}</p>
                  <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                  <p className="text-xs text-[#c6c6c6] leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to={cta.to}>
                <Button kind="primary" size="lg" renderIcon={ArrowRight}>
                  {cta.label}
                </Button>
              </Link>
              <a href="tel:1930" className="cds--btn cds--btn--danger cds--btn--lg inline-flex items-center gap-2">
                <Phone size={18} /> Call 1930 Cyber Helpline
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-xs text-[#525252] flex flex-wrap items-center justify-between gap-4 border-t border-[#e0e0e0]">
        <div className="flex items-center gap-2">
          <Help size={16} className="text-[#0f62fe]" />
          <span>National Cyber Crime Helpline: <strong>1930</strong> &bull;{' '}
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="underline font-semibold text-[#0f62fe]">
              cybercrime.gov.in
            </a>
          </span>
        </div>
        <span>Satark Saathi Prototype &bull; Carbon Design System Compliant &bull; Non-Affiliated Academic Implementation</span>
      </footer>
    </div>
  );
};
