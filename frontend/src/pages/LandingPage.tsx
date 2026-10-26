import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CreditCard,
  Eye,
  LifeBuoy,
  MessageSquareWarning,
  PhoneCall,
  Shield,
  ShieldCheck,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';
import { useAuthSession } from '../context/AuthSessionContext';

const FEATURES = [
  {
    icon: MessageSquareWarning,
    title: 'Scam Analyzer',
    body: 'Paste a suspicious SMS, WhatsApp message, link or call transcript and get a plain-language risk explanation.',
  },
  {
    icon: CreditCard,
    title: 'Payment Checkpoint',
    body: 'Before money leaves, explained risk signals and a short Safety Check-in in English, Hindi, Marathi or Kannada.',
  },
  {
    icon: Users,
    title: 'Family Shield',
    body: 'Up to two trusted guardians who must accept the role — and can approve or decline a risky payment.',
  },
  {
    icon: Zap,
    title: 'One-tap Golden Hour',
    body: 'Lost money? Describe it once, press one button: complaint, bank lien request and police intimation are prepared together.',
  },
  {
    icon: Eye,
    title: 'Senior Mode',
    body: 'Large text, strong contrast, big buttons and a four-choice home screen with one-tap calls to 1930 and family.',
  },
  {
    icon: Smartphone,
    title: 'App mode (mock UPI)',
    body: 'Switch from Web to App to see how a payment app could call the Satark safety SDK before the PIN screen.',
  },
];

const PROBLEMS = [
  {
    title: '“Digital arrest” calls',
    body: 'A fake officer keeps the victim on a video call, demands secrecy and pushes an urgent “clearance” payment.',
  },
  {
    title: 'Panic payments',
    body: 'UPI is instant. Fear, urgency and isolation make people pay before anyone they trust can say “wait”.',
  },
  {
    title: 'The lost golden hour',
    body: 'After fraud, the first hours matter most — but victims don’t know whom to call, what to write, or in what order.',
  },
];

export const LandingPage: React.FC = () => {
  const { session } = useAuthSession();
  const cta = session ? { to: '/', label: 'Open your dashboard' } : { to: '/login', label: 'Try the live demo' };

  return (
    <div className="min-h-screen bg-[#F7F8F4] text-[#142A36]">
      {/* Top navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/welcome" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#176B58] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#DCEDE5]" />
            </span>
            <span className="leading-tight">
              <span className="block font-bold">Satark Saathi</span>
              <span className="block text-[11px] text-[#64748B]">सतर्क साथी</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#334155]" aria-label="Page sections">
            <a href="#problem" className="hover:text-[#176B58]">Problem</a>
            <a href="#features" className="hover:text-[#176B58]">Features</a>
            <a href="#how" className="hover:text-[#176B58]">How it works</a>
          </nav>
          <Link to={cta.to} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176B58] hover:bg-[#135948] text-white text-sm font-bold">
            {session ? 'Dashboard' : 'Sign in'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#DCEDE5] text-[#176B58]">
              Active protection, not another dashboard
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Stop. Verify. <span className="text-[#176B58]">Stay Safe.</span>
            </h1>
            <p className="mt-5 text-lg text-[#334155] leading-relaxed">
              Satark Saathi stands between a frightened person and an irreversible payment. It checks suspicious messages,
              pauses risky transfers, brings family in — and when money is lost, turns the golden hour into one button.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={cta.to} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#176B58] hover:bg-[#135948] text-white font-bold">
                {cta.label}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#how" className="inline-flex items-center px-6 py-3 rounded-xl border-2 border-[#142A36] font-bold">
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs text-[#64748B]">Hackathon prototype. Bank, police and UPI integrations are simulated and clearly labelled.</p>
          </div>

          {/* Illustrative phone card */}
          <div className="flex justify-center" aria-hidden="true">
            <div className="w-[300px] rounded-[2rem] border-[10px] border-[#0E1E27] bg-white shadow-2xl overflow-hidden">
              <div className="bg-[#142A36] text-white px-4 py-3 text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300" /> Satark check
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-[#64748B]">Paying “CBI Escrow Cell”</p>
                <p className="text-2xl font-extrabold font-mono">₹50,000</p>
                <div className="rounded-xl border-2 border-red-300 bg-red-50 p-3 text-xs text-red-950">
                  <p className="font-bold">Please don’t send this money now</p>
                  <ul className="mt-1.5 list-disc pl-4 space-y-0.5">
                    <li>Official-sounding personal UPI ID</li>
                    <li>Told to keep it secret</li>
                    <li>Paying during a call</li>
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <span className="rounded-lg bg-[#142A36] text-white py-2 text-center">Call 1930</span>
                  <span className="rounded-lg bg-[#176B58] text-white py-2 text-center">Ask Aarav</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section id="problem" className="bg-white border-y border-[#E2E8F0]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-3xl font-bold">Today’s apps show information. Nobody acts.</h2>
            <p className="mt-3 max-w-3xl text-[#334155]">
              Payment apps show your balance. Investment apps show your portfolio. Banks send an SMS after the money has gone.
              In the moment of fear, people need something that tells them what to do — and does the next step for them.
            </p>
            <div className="mt-8 grid md:grid-cols-3 gap-5">
              {PROBLEMS.map((p) => (
                <div key={p.title} className="rounded-2xl border border-[#E2E8F0] p-5 bg-[#F7F8F4]">
                  <h3 className="font-bold text-lg">{p.title}</h3>
                  <p className="mt-2 text-sm text-[#334155] leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="text-3xl font-bold">What Satark Saathi does</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-white border border-[#E2E8F0] p-5 shadow-sm">
                <span className="inline-flex p-2.5 rounded-xl bg-[#DCEDE5] text-[#176B58]">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="mt-3 font-bold text-lg">{title}</h3>
                <p className="mt-1.5 text-sm text-[#334155] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-[#142A36] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-3xl font-bold">Before, during and after</h2>
            <div className="mt-8 grid md:grid-cols-3 gap-5">
              {[
                { step: 'Before', title: 'Verify', body: 'Check the message or link. See exactly why it looks risky.' },
                { step: 'During', title: 'Pause & bring family in', body: 'Answer a few questions; a guardian can approve or decline the payment.' },
                { step: 'After', title: 'One tap, golden hour', body: 'Complaint, bank lien request and police intimation prepared in one go — plus the real steps to take.' },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">{s.step}</p>
                  <h3 className="mt-1 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-200 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to={cta.to} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">
                {cta.label}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="tel:1930" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 text-slate-950 font-bold">
                <PhoneCall className="w-5 h-5" /> Real emergency? Call 1930
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-xs text-[#64748B] flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <LifeBuoy className="w-4 h-4" /> National Cyber Crime Helpline 1930 &bull;{' '}
          <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="underline">cybercrime.gov.in</a>
        </span>
        <span>Prototype for demonstration. It does not replace police, banks or legal advice.</span>
      </footer>
    </div>
  );
};
