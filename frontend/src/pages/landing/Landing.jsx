import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { useTheme } from '../../context/ThemeContext'
import api, { naira } from '../../services/api'
import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'
import {
  Wifi, Phone, Zap, Tv, ArrowRight, Flame, Star,
  ChevronDown, ChevronUp, CheckCircle, ShieldCheck,
  Banknote, BadgeCheck, Users, Headphones, Lock,
  TrendingDown, Timer, RefreshCw, Code2,
} from 'lucide-react'

// ─── Static data ─────────────────────────────────────────────────────────────

const SERVICES = [
  {
    icon: Wifi, title: 'Data Bundles', desc: 'SME, gifting & direct data across all networks at Nigeria\'s absolute lowest rates.',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    shadow: 'rgba(79,70,229,0.35)',
  },
  {
    icon: Phone, title: 'Airtime Top-up', desc: 'MTN, GLO, Airtel & 9Mobile. Instant airtime credited in under 3 seconds, guaranteed.',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
    shadow: 'rgba(220,38,38,0.35)',
  },
  {
    icon: Zap, title: 'Electricity Tokens', desc: 'Pay bills across all DISCOs. Tokens delivered to your screen within seconds, 24/7.',
    gradient: 'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
    shadow: 'rgba(180,83,9,0.35)',
  },
  {
    icon: Tv, title: 'Cable TV', desc: 'Renew DSTV, GOtv & Startimes subscriptions instantly. Never miss a game again.',
    gradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)',
    shadow: 'rgba(4,120,87,0.35)',
  },
]

const STEPS = [
  { num: '01', icon: BadgeCheck, title: 'Create Free Account', desc: 'Sign up in under 2 minutes. No paperwork, no verification delays — just an email and phone number.' },
  { num: '02', icon: Banknote,   title: 'Fund Your Wallet',    desc: 'Get a dedicated bank account number. Transfer any amount — wallet is credited instantly, 24/7.' },
  { num: '03', icon: Zap,        title: 'Buy & Earn',          desc: 'Pick a service, enter details, confirm. Transaction completes in under 5 seconds every single time.' },
]

const TESTIMONIALS = [
  { name: 'Adebayo O.', role: 'Business Owner', location: 'Lagos', text: 'Best data platform in Nigeria. Prices are unbeatable and every transaction completes in seconds. I\'ve tried many — this is the one I trust.' },
  { name: 'Chinwe M.',  role: 'HR Manager',     location: 'Abuja', text: 'I buy data for 20+ staff every month. This platform saves me thousands compared to everywhere else. Not a single failed transaction in 6 months.' },
  { name: 'Ibrahim K.', role: 'Reseller',        location: 'Kano',  text: 'Very reliable. Failed transactions get reversed instantly. The reseller pricing is the best I\'ve seen anywhere. I run my entire business here.' },
]

const FAQS = [
  { q: 'How do I fund my wallet?',       a: 'After registration you get a dedicated bank account number. Transfer any amount from any Nigerian bank — your wallet is credited instantly, 24/7, including weekends.' },
  { q: 'How fast are transactions?',     a: 'Most transactions complete within 3–5 seconds. In rare network delay cases, delivery happens within 2 minutes. You\'re always notified by SMS and in-app.' },
  { q: 'What networks do you support?',  a: 'MTN, GLO, Airtel, and 9Mobile for data and airtime. Electricity covers all major DISCOs. Cable TV covers DSTV, GOtv, and Startimes.' },
  { q: 'What if a transaction fails?',   a: 'Failed transactions are automatically reversed to your wallet within seconds. You are never charged for a failed transaction — this is our guarantee.' },
  { q: 'Is my money secure?',            a: 'Yes. Your wallet balance and data are protected with industry-standard encryption and a transaction PIN. We never share your information with third parties.' },
  { q: 'Can I resell to others?',        a: 'Absolutely. We have reseller and API accounts with heavily discounted rates. Contact support on WhatsApp to upgrade your account and start earning.' },
]

const FEATURES = [
  { icon: ShieldCheck, title: 'PIN-secured transactions',        desc: 'Every purchase protected by your personal PIN.' },
  { icon: Banknote,    title: 'Instant bank transfer funding',   desc: 'Your dedicated account, credited in seconds.' },
  { icon: BadgeCheck,  title: 'Virtual account number',          desc: 'Dedicated bank account for every user.' },
  { icon: Code2,       title: 'Developer API access',            desc: 'Automate purchases with our full REST API.' },
  { icon: Users,       title: 'Reseller programme',              desc: 'Heavily discounted rates for bulk buyers.' },
  { icon: RefreshCw,   title: 'Automatic failure reversal',      desc: 'Failed transactions reversed in under 10 secs.' },
  { icon: Headphones,  title: '24/7 WhatsApp support',           desc: 'Real human support always available.' },
  { icon: TrendingDown,title: 'Nigeria\'s lowest prices',        desc: 'Direct aggregator partnerships, no middlemen.' },
]

const NETWORKS = ['MTN', 'GLO', 'AIRTEL', '9MOBILE']
const NET = {
  MTN:       { bg: '#FFCC00', text: '#1a1a1a', light: '#FFFBEB', ring: 'rgba(255,204,0,0.3)' },
  GLO:       { bg: '#007A00', text: '#ffffff', light: '#ECFDF5', ring: 'rgba(0,122,0,0.3)' },
  AIRTEL:    { bg: '#EF1C25', text: '#ffffff', light: '#FEF2F2', ring: 'rgba(239,28,37,0.3)' },
  '9MOBILE': { bg: '#006B5E', text: '#ffffff', light: '#F0FDF9', ring: 'rgba(0,107,94,0.3)' },
}

const MARQUEE_ITEMS = [
  { text: 'MTN Network', dot: '#FFCC00' },
  { text: 'GLO Network', dot: '#007A00' },
  { text: 'Airtel Network', dot: '#EF1C25' },
  { text: '9Mobile Network', dot: '#006B5E' },
  { text: '⚡ Instant Delivery' },
  { text: '🔒 Secure Payments' },
  { text: '✓ 99.9% Uptime' },
  { text: '📲 24/7 Support' },
  { text: 'DSTV & GOtv' },
  { text: 'Electricity Tokens' },
  { text: '🚀 3-Second Transactions' },
  { text: '💰 Nigeria\'s Best Rates' },
]

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="relative animate-float" style={{ width: '260px', margin: '0 auto' }}>
      {/* Glow behind phone */}
      <div className="absolute inset-0 -z-10 rounded-[50%]" style={{ filter: 'blur(60px)', background: 'radial-gradient(ellipse, rgba(99,102,241,0.5), rgba(139,92,246,0.3) 50%, transparent 80%)', transform: 'scale(1.3) translateY(10%)' }} />

      {/* Phone frame */}
      <div className="rounded-[44px] overflow-hidden relative"
        style={{
          background: '#18182a',
          border: '9px solid #26263e',
          boxShadow: '0 0 0 1.5px rgba(255,255,255,0.08), 0 40px 80px rgba(0,0,0,0.6)',
        }}>

        {/* Dynamic island */}
        <div className="flex justify-center items-center" style={{ background: '#18182a', paddingTop: '10px', paddingBottom: '6px' }}>
          <div style={{ width: '100px', height: '22px', background: '#000', borderRadius: '100px' }} />
        </div>

        {/* Screen */}
        <div style={{ height: '490px', overflowY: 'hidden', background: '#0d0d20' }}>

          {/* Status bar */}
          <div className="flex justify-between items-center px-4 py-1.5">
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 600 }}>9:41</span>
            <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px' }}>
              <span>▲▲▲</span><span>WiFi</span><span>▐▌</span>
            </div>
          </div>

          {/* Greeting */}
          <div className="px-4 pb-3 pt-0.5">
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>Good morning,</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px' }}>Adebayo 👋</div>
          </div>

          {/* Wallet card */}
          <div className="mx-3 rounded-2xl p-3.5 mb-3"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Wallet Balance</div>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '22px', marginTop: '2px', letterSpacing: '-0.02em' }}>₦ 12,450<span style={{ fontSize: '14px', opacity: 0.7 }}>.00</span></div>
            <div className="flex gap-1.5 mt-2.5">
              {['Fund Wallet', 'Buy Data', 'Airtime'].map(a => (
                <div key={a} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.18)', color: '#fff', fontSize: '8px', fontWeight: 700, padding: '5px 0', borderRadius: '8px' }}>{a}</div>
              ))}
            </div>
          </div>

          {/* Service icons */}
          <div className="px-3 mb-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
            {[
              { emoji: '📶', label: 'Data',    bg: 'rgba(99,102,241,0.2)' },
              { emoji: '📱', label: 'Airtime', bg: 'rgba(239,68,68,0.2)' },
              { emoji: '💡', label: 'Power',   bg: 'rgba(245,158,11,0.2)' },
              { emoji: '📺', label: 'Cable',   bg: 'rgba(16,185,129,0.2)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{s.emoji}</div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '8px', fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Transactions label */}
          <div className="px-3 mb-1.5">
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Recent</span>
          </div>

          {/* Transaction rows */}
          {[
            { emoji: '📶', name: 'MTN 1GB Data',   time: '2m ago',   amt: '-₦280',   c: '#6366f1' },
            { emoji: '📱', name: 'Airtel ₦1000',   time: '1hr ago',  amt: '-₦1,000', c: '#ef4444' },
            { emoji: '💡', name: 'EEDC ₦5000',     time: 'Yesterday', amt: '-₦5,000', c: '#f59e0b' },
          ].map((t, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-2">
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${t.c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>{t.emoji}</div>
                <div>
                  <div style={{ color: '#fff', fontSize: '10px', fontWeight: 600 }}>{t.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>{t.time} · Success</div>
                </div>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 700 }}>{t.amt}</div>
            </div>
          ))}
        </div>

        {/* Home bar */}
        <div className="flex justify-center items-center" style={{ background: '#18182a', padding: '8px 0' }}>
          <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px' }} />
        </div>

        {/* Side buttons */}
        <div style={{ position: 'absolute', top: '80px', right: '-11px', width: '4px', height: '52px', background: '#26263e', borderRadius: '0 3px 3px 0' }} />
        <div style={{ position: 'absolute', top: '64px', left: '-11px', width: '4px', height: '32px', background: '#26263e', borderRadius: '3px 0 0 3px' }} />
        <div style={{ position: 'absolute', top: '104px', left: '-11px', width: '4px', height: '48px', background: '#26263e', borderRadius: '3px 0 0 3px' }} />
      </div>

      {/* Floating badge — top right */}
      <div className="absolute -top-3 -right-10 bg-white rounded-2xl shadow-2xl flex items-center gap-2.5 z-20 animate-float-slow"
        style={{ padding: '10px 14px', minWidth: '150px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle size={16} color="#fff" />
        </div>
        <div>
          <div style={{ color: '#111827', fontSize: '11px', fontWeight: 800 }}>Data Delivered! ✓</div>
          <div style={{ color: '#9ca3af', fontSize: '10px' }}>0803 ••• 9411 · 3s</div>
        </div>
      </div>

      {/* Floating badge — bottom left */}
      <div className="absolute -bottom-4 -left-10 bg-white rounded-2xl shadow-2xl z-20 animate-float"
        style={{ padding: '10px 16px', animationDelay: '1.5s' }}>
        <div style={{ color: '#9ca3af', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Saved today</div>
        <div style={{ color: '#111827', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.03em' }}>₦ 1,240 <span style={{ color: '#22c55e', fontSize: '12px' }}>↑</span></div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Landing() {
  const theme = useTheme()
  const [activeNetwork, setActiveNetwork] = useState('MTN')
  const [openFaq, setOpenFaq] = useState(null)

  const { data: plansData } = useQuery({
    queryKey: ['public-plans', activeNetwork],
    queryFn: () => api.get('/plans/public').then(r => r.data.plans),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })

  const plans = plansData?.[activeNetwork] || []
  const net = NET[activeNetwork]

  return (
    <div className="min-h-screen font-sans overflow-x-hidden">
      <LandingNav />

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #06061a 0%, #0e0e2a 40%, #0a0a20 100%)' }}>

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* Radial glow blobs */}
        <div className="absolute top-0 right-0 w-[700px] h-[700px] pointer-events-none" style={{ background: 'radial-gradient(circle at 70% 30%, rgba(99,102,241,0.22), transparent 60%)', zIndex: 0 }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 70%, rgba(139,92,246,0.16), transparent 60%)', zIndex: 0 }} />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(79,70,229,0.10), transparent 60%)', zIndex: 0 }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* ── Left copy ── */}
            <div>
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-8 border"
                style={{ background: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.3)', color: 'rgba(255,255,255,0.75)' }}>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Trusted by 10,000+ Nigerians
              </div>

              {/* Headline */}
              <h1 className="font-black text-white leading-[1.04] tracking-tight mb-6"
                style={{ fontSize: 'clamp(42px, 6vw, 68px)' }}>
                Buy Data &<br />
                <span style={{ background: 'linear-gradient(90deg, #818cf8, #a78bfa, #f0abfc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Airtime
                </span>{' '}at<br />
                Nigeria's Best
                <span style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> Rates</span>
              </h1>

              <p className="text-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.52)', maxWidth: '460px' }}>
                Data bundles, airtime, electricity tokens & cable TV — delivered in under 5 seconds with zero delays, 24 hours a day.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link to="/register"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.97]"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', boxShadow: '0 10px 40px -8px rgba(99,102,241,0.65)' }}>
                  Get Started Free <ArrowRight size={18} />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:bg-white/10 border"
                  style={{ color: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.12)' }}>
                  Sign In to Dashboard
                </Link>
              </div>

              {/* Network chips */}
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'MTN',    bg: '#FFCC00', tc: '#1a1a1a' },
                  { name: 'GLO',    bg: '#007A00', tc: '#fff' },
                  { name: 'AIRTEL', bg: '#EF1C25', tc: '#fff' },
                  { name: '9MOBILE',bg: '#006B5E', tc: '#fff' },
                ].map(n => (
                  <span key={n.name} className="px-3 py-1.5 rounded-full text-xs font-extrabold tracking-wide"
                    style={{ background: n.bg, color: n.tc }}>{n.name}</span>
                ))}
                {['DSTV', 'GOtv', 'EEDC', 'IKEDC'].map(s => (
                  <span key={s} className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                    style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>{s}</span>
                ))}
              </div>
            </div>

            {/* ── Right phone ── */}
            <div className="hidden lg:flex justify-center items-center">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ════════════════════════════════════════════════════════════ */}
      <div className="py-4 overflow-hidden border-y border-gray-200" style={{ background: '#fff' }}>
        <div className="flex" style={{ width: 'max-content' }}>
          <div className="flex gap-10 items-center animate-marquee pr-10">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <div key={i} className="flex items-center gap-2 whitespace-nowrap">
                {item.dot && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.dot }} />}
                <span className="text-sm font-semibold" style={{ color: '#374151' }}>{item.text}</span>
                <span className="text-gray-200 font-light ml-8">|</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ STATS ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { value: '10,000+', label: 'Active Users',        sub: 'and growing daily' },
              { value: '₦500M+',  label: 'Transactions Processed', sub: 'and counting' },
              { value: '3 secs',  label: 'Average Delivery',    sub: 'guaranteed speed' },
            ].map(s => (
              <div key={s.label}
                className="group text-center p-8 rounded-3xl border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300"
                style={{ background: 'white' }}
                onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #fafafa, #f3f4f6)'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <p className="font-black mb-1.5 tracking-tight leading-none"
                  style={{ fontSize: 'clamp(36px, 5vw, 52px)', background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {s.value}
                </p>
                <p className="font-bold text-gray-900 text-base">{s.label}</p>
                <p className="text-gray-400 text-sm mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICES ═══════════════════════════════════════════════════════════ */}
      <section id="services" className="py-24" style={{ background: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--color-primary)' }}>What We Offer</p>
            <h2 className="font-extrabold text-gray-900 tracking-tight leading-tight" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>
              Every service you need.<br />One platform.
            </h2>
            <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
              Every Nigerian utility service at unbeatable prices — with instant delivery, always.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map(({ icon: Icon, title, desc, gradient, shadow }) => (
              <div key={title}
                className="group relative rounded-3xl p-7 overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-3"
                style={{ background: gradient, boxShadow: `0 12px 40px ${shadow}` }}>
                {/* Shimmer overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
                {/* Icon */}
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <Icon size={28} color="white" />
                </div>
                <h3 className="font-extrabold text-white text-lg mb-2.5">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>{desc}</p>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-white">
                  Get started <ArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #06061a 0%, #0e0e2a 60%, #0a0a20 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15), transparent 55%)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--color-primary)' }}>Simple Process</p>
            <h2 className="font-extrabold text-white tracking-tight leading-tight" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>
              Up and running in 3 steps
            </h2>
            <p className="text-gray-500 mt-4 text-lg">No technical knowledge required. If you can send a WhatsApp message, you can use this.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[60px] left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-px pointer-events-none"
              style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.6), rgba(139,92,246,0.6))' }} />

            {STEPS.map(({ num, icon: Icon, title, desc }) => (
              <div key={num} className="text-center group">
                <div className="relative inline-flex w-[120px] h-[120px] rounded-3xl items-center justify-center mx-auto mb-7 transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    boxShadow: '0 16px 48px -8px rgba(99,102,241,0.5)',
                  }}>
                  <Icon size={42} color="white" />
                  <span className="absolute -top-3.5 -right-3.5 w-9 h-9 rounded-full bg-white flex items-center justify-center font-black shadow-xl"
                    style={{ color: 'var(--color-primary)', fontSize: '13px' }}>{num}</span>
                </div>
                <h3 className="font-extrabold text-white text-xl mb-3">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link to="/register"
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', boxShadow: '0 12px 40px -8px rgba(99,102,241,0.5)' }}>
              Create Free Account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══ WHY US / FEATURES ══════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: headline + statement */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--color-primary)' }}>Why Choose Us</p>
              <h2 className="font-extrabold text-gray-900 tracking-tight leading-tight mb-6" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
                Built for speed.<br />Designed for savings.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
                We partner directly with networks and aggregators to secure the lowest possible rates — and pass every kobo of savings directly to you.
              </p>

              {/* Highlight stats */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { val: '₦0',   label: 'Setup fee — ever' },
                  { val: '100%', label: 'Failure reversal rate' },
                  { val: '3s',   label: 'Average transaction time' },
                  { val: '24/7', label: 'Support availability' },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl border border-gray-100 p-4"
                    style={{ background: 'linear-gradient(135deg, #fafafa, #f3f4f6)' }}>
                    <div className="font-black text-2xl mb-0.5"
                      style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {s.val}
                    </div>
                    <div className="text-gray-500 text-xs font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              <Link to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                Start Saving Today <ArrowRight size={16} />
              </Link>
            </div>

            {/* Right: feature grid */}
            <div className="grid grid-cols-1 gap-3">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))' }}>
                    <Icon size={18} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24" style={{ background: '#f8fafc' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--color-primary)' }}>Live Prices</p>
            <h2 className="font-extrabold text-gray-900 tracking-tight leading-tight" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>
              Best rates, updated daily
            </h2>
            <p className="text-gray-500 mt-4 text-lg">Real prices. No hidden charges. No surprises at checkout.</p>
          </div>

          {/* Network selector */}
          <div className="flex justify-center gap-3 flex-wrap mb-10">
            {NETWORKS.map(n => {
              const nc = NET[n]
              const active = activeNetwork === n
              return (
                <button key={n} onClick={() => setActiveNetwork(n)}
                  className="px-7 py-3 rounded-2xl font-extrabold text-sm transition-all duration-200 border-2"
                  style={active
                    ? { background: nc.bg, color: nc.text, borderColor: nc.bg, boxShadow: `0 6px 24px ${nc.ring}` }
                    : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }}>
                  {n}
                </button>
              )
            })}
          </div>

          {/* Plan grid */}
          {plans.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {plans.map((plan, idx) => (
                <div key={plan.planId}
                  className="relative rounded-2xl overflow-hidden bg-white border-2 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200"
                  style={{ borderColor: `${net.bg}50` }}>
                  {plan.isHot && (
                    <span className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full z-10">
                      <Flame size={8} /> HOT
                    </span>
                  )}
                  <div className="py-2.5 text-center" style={{ background: net.bg }}>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: net.text }}>{plan.planType}</p>
                  </div>
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs font-semibold text-gray-600 leading-tight">{plan.planName}</p>
                    <p className="text-xl font-extrabold" style={{ color: 'var(--color-primary)' }}>{naira(plan.sellingPrice)}</p>
                    <Link to="/register"
                      className="block text-xs font-extrabold py-1.5 rounded-xl transition-all hover:opacity-90"
                      style={{ background: `${net.bg}25`, color: net.bg === '#FFCC00' ? '#92400e' : net.bg }}>
                      Buy Now →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center gap-1.5 py-16">
              {[0, 120, 240].map(d => (
                <div key={d} className="w-2.5 h-2.5 rounded-full animate-bounce"
                  style={{ background: 'var(--color-primary)', animationDelay: `${d}ms` }} />
              ))}
            </div>
          )}

          <p className="text-center mt-10 text-sm text-gray-500">
            <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
              Register to see all plans, reseller pricing &amp; API rates →
            </Link>
          </p>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═══════════════════════════════════════════════════════ */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--color-primary)' }}>Testimonials</p>
            <h2 className="font-extrabold text-gray-900 tracking-tight leading-tight" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>
              Nigerians trust us daily
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i}
                className="relative bg-white rounded-3xl p-7 border border-gray-100 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden group flex flex-col">
                {/* Gradient top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                  style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' }} />
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role} · {t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-24" style={{ background: '#f8fafc' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.22em] mb-3" style={{ color: 'var(--color-primary)' }}>FAQ</p>
            <h2 className="font-extrabold text-gray-900 tracking-tight leading-tight" style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}>
              Got questions?
            </h2>
            <p className="text-gray-500 mt-4 text-lg">Everything you need to know before you get started.</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i}
                className="bg-white rounded-2xl overflow-hidden transition-shadow"
                style={{ border: openFaq === i ? '1px solid rgba(99,102,241,0.3)' : '1px solid #f3f4f6', boxShadow: openFaq === i ? '0 4px 24px rgba(99,102,241,0.08)' : 'none' }}>
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="font-bold text-gray-900 text-sm pr-4">{faq.q}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: openFaq === i ? 'var(--color-primary)' : '#f3f4f6' }}>
                    {openFaq === i
                      ? <ChevronUp size={14} color="white" />
                      : <ChevronDown size={14} color="#9ca3af" />}
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 border-t border-gray-50">
                    <p className="text-gray-500 text-sm leading-relaxed pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ════════════════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #4338ca 45%, #1e40af 100%)' }}>
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12), transparent 70%)' }} />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
            style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Join 10,000+ active users
          </div>

          <h2 className="font-black text-white tracking-tight leading-tight mb-5"
            style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
            Start saving on data<br />right now
          </h2>
          <p className="mb-10 text-lg leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Free to sign up, no credit card required. Fund your wallet with any amount and buy your first data bundle in under 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-gray-900 text-base transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}>
              Create Free Account <ArrowRight size={18} />
            </Link>
            {theme.supportWhatsapp && (
              <a href={`https://wa.me/${theme.supportWhatsapp}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-white text-base transition-all hover:bg-white/15 border border-white/20">
                Chat on WhatsApp
              </a>
            )}
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>
            {['✓ Free to sign up', '✓ No credit card', '✓ Instant wallet funding', '✓ 24/7 support'].map(b => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
