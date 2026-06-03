import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { authService } from '../../services/auth.service'
import { naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { Wifi, Phone, Zap, Tv, CreditCard, List, Copy, Building2, Database } from 'lucide-react'
import toast from 'react-hot-toast'

const statusVariant = { success: 'success', failed: 'danger', processing: 'warning', pending: 'warning', refunded: 'info' }

const quickLinks = [
  { to: '/buy/data',        icon: Wifi,  label: 'Data',       color: 'bg-blue-50 text-blue-600' },
  { to: '/buy/airtime',     icon: Phone, label: 'Airtime',    color: 'bg-green-50 text-green-600' },
  { to: '/buy/electricity', icon: Zap,   label: 'Electricity',color: 'bg-yellow-50 text-yellow-600' },
  // { to: '/buy/cable',       icon: Tv,    label: 'Cable TV',   color: 'bg-purple-50 text-purple-600' },
  { to: '/fund-wallet',     icon: CreditCard, label: 'Fund',         color: 'bg-pink-50 text-pink-600' },
  { to: '/transactions',    icon: List,       label: 'Transactions', color: 'bg-orange-50 text-orange-600' },
]

function AccountNumberTabs({ accounts, primaryColor }) {
  const [active, setActive] = useState(0)
  const [copied, setCopied] = useState(false)
  const acc = accounts[active]

  const copy = () => {
    navigator.clipboard.writeText(acc.accountNumber)
    setCopied(true)
    toast.success('Account number copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Format 10-digit number as XXX XXX XXXX
  const fmt = (n = '') => {
    const s = String(n).replace(/\D/g, '')
    if (s.length === 10) return `${s.slice(0,3)} ${s.slice(3,6)} ${s.slice(6)}`
    return s
  }

  return (
    <div className="space-y-4">
      {/* Bank pill selector */}
      {accounts.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {accounts.map((a, i) => (
            <button
              key={i}
              onClick={() => { setActive(i); setCopied(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
              style={active === i
                ? { background: primaryColor, color: '#fff', borderColor: primaryColor, boxShadow: `0 3px 12px -3px ${primaryColor}` }
                : { background: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }}
            >
              <Building2 size={11} />
              {a.bankName}
            </button>
          ))}
        </div>
      )}

      {/* Virtual card */}
      <div
        className="relative rounded-2xl overflow-hidden select-none"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #1e3a5f 100%)',
          minHeight: '200px',
        }}
      >
        {/* Mesh / noise circles */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }} />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)' }} />

        {/* Subtle grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        <div className="relative p-6 flex flex-col gap-5">
          {/* Top row: chip + bank name */}
          <div className="flex items-center justify-between">
            {/* EMV chip */}
            <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
              <rect x="0" y="0" width="36" height="28" rx="5" fill="#d4a017" />
              <rect x="0" y="10" width="36" height="8" fill="#b8860b" />
              <rect x="13" y="0" width="10" height="28" fill="#b8860b" />
              <rect x="13" y="10" width="10" height="8" fill="#c9a227" />
              <rect x="2" y="2" width="32" height="24" rx="4" fill="none" stroke="#e8c547" strokeWidth="0.6" opacity="0.5"/>
            </svg>

            <div className="text-right">
              <p className="text-xs font-bold tracking-widest uppercase"
                style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', letterSpacing: '0.2em' }}>
                Virtual Account
              </p>
              <p className="text-sm font-bold text-white mt-0.5">{acc.bankName}</p>
            </div>
          </div>

          {/* Account number */}
          <div>
            <p className="text-white font-mono font-bold tracking-[0.22em]"
              style={{ fontSize: 'clamp(20px, 5.5vw, 28px)' }}>
              {fmt(acc.accountNumber)}
            </p>
            {acc.accountName && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em' }}>
                {acc.accountName}
              </p>
            )}
          </div>

          {/* Bottom row: hint + copy */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Instant · 24/7 · Any amount
            </p>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                background: copied ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.12)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.18)'}`,
                color: copied ? '#4ade80' : '#fff',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Copy size={12} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Tap-to-copy hint */}
      <p className="text-center text-xs text-gray-400">
        Send money to this account to fund your wallet instantly
      </p>
    </div>
  )
}

export default function Dashboard() {
  const { user, setUser } = useAuth()
  const theme = useTheme()

  const { data: txData, isLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => authService.getProfile().then(r => r.data),
    onSuccess: (d) => setUser(d.user),
  })

  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => authService.getStats().then(r => r.data),
    refetchInterval: 60_000,
  })

  const referralLink = `${window.location.origin}/register?ref=${user?.userName}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.userName} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your account today.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500 mb-1">Wallet Balance</p>
          <p className="text-3xl font-bold text-gray-900">{naira(user?.balance ?? 0)}</p>
          <Link to="/fund-wallet" className="mt-3 inline-block text-xs text-primary font-medium hover:underline">
            + Add funds
          </Link>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">GB Sold Today</p>
              <p className="text-2xl font-bold text-gray-900">{((statsData?.gbSoldToday ?? 0)).toFixed(2)} GB</p>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
              <Database size={20} />
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">GB Sold This Month</p>
              <p className="text-2xl font-bold text-gray-900">{((statsData?.gbSoldThisMonth ?? 0)).toFixed(2)} GB</p>
            </div>
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
              <Database size={20} />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Card.Header>Quick Actions</Card.Header>
        <Card.Body>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickLinks.map(({ to, icon: Icon, label, color }) => (
              <Link key={to} to={to} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors text-center">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs text-gray-600 font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </Card.Body>
      </Card>

      {user?.accountNumbers?.length > 0 && (
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-primary" />
              Fund Wallet — Dedicated Account Numbers
            </div>
          </Card.Header>
          <Card.Body>
            <AccountNumberTabs accounts={user.accountNumbers} primaryColor={theme.colors.primary} />
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Header>Referral Link</Card.Header>
        <Card.Body>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
            />
            <button
              onClick={() => { navigator.clipboard.writeText(referralLink); toast.success('Copied!') }}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Copy size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Share this link to earn commissions on every purchase your referrals make.
          </p>
        </Card.Body>
      </Card>
    </div>
  )
}
