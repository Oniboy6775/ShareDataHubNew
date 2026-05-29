import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  LayoutDashboard, Wifi, Phone, Zap, Tv, CreditCard, Receipt,
  User, DollarSign, Users, BarChart3, Settings, Bell, Tag, X,
  LogOut, ShieldCheck, UserCircle, Megaphone, Code2, ArrowLeftRight,
} from 'lucide-react'

const userNav = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/buy/data',        icon: Wifi,            label: 'Buy Data' },
  { to: '/buy/airtime',     icon: Phone,           label: 'Buy Airtime' },
  { to: '/buy/electricity', icon: Zap,             label: 'Electricity' },
  // { to: '/buy/cable',       icon: Tv,              label: 'Cable TV' },
  { to: '/fund-wallet',     icon: CreditCard,      label: 'Fund Wallet' },
  { to: '/transactions',    icon: Receipt,         label: 'Transactions' },
  { to: '/earnings',        icon: DollarSign,      label: 'Earnings' },
  { to: '/api-docs',        icon: Code2,           label: 'API Docs' },
  { to: '/profile',         icon: User,            label: 'Profile' },
]

const adminNav = [
  { to: '/admin/dashboard',     icon: BarChart3, label: 'Dashboard' },
  { to: '/admin/users',         icon: Users,          label: 'Users'    },
  { to: '/admin/transfer',      icon: ArrowLeftRight, label: 'Transfer' },
  { to: '/admin/transactions',  icon: Receipt,   label: 'Transactions' },
  { to: '/admin/plans',         icon: Wifi,      label: 'Plans' },
  { to: '/admin/coupons',       icon: Tag,       label: 'Coupons' },
  { to: '/admin/notifications', icon: Bell,      label: 'Notifications' },
  { to: '/admin/broadcast',     icon: Megaphone, label: 'Broadcast' },
  { to: '/admin/settings',      icon: Settings,  label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
  const { user, logout, isAdmin, inAdminMode, switchMode } = useAuth()
  const theme = useTheme()
  const navigate = useNavigate()
  const nav = inAdminMode ? adminNav : userNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSwitch = () => {
    if (inAdminMode) {
      switchMode('user')
      navigate('/dashboard')
    } else {
      switchMode('admin')
      navigate('/admin/dashboard')
    }
    onClose()
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: theme.colors.dark }}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            {theme.logo
              ? <img src={theme.logo} alt="logo" className="h-8 w-8 object-contain" />
              : <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: theme.colors.primary }}>
                  {theme.siteName[0]}
                </div>
            }
            <div>
              <span className="text-white font-semibold text-sm leading-tight block">{theme.siteName}</span>
              {isAdmin && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: inAdminMode ? theme.colors.primary : '#16a34a', color: '#fff' }}>
                  {inAdminMode ? 'Admin' : 'User view'}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'text-white font-medium'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`
              }
              style={({ isActive }) => isActive ? { background: theme.colors.primary } : {}}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
          {isAdmin && (
            <button
              onClick={handleSwitch}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors text-white/60 hover:text-white hover:bg-white/10"
            >
              {inAdminMode ? <UserCircle size={18} /> : <ShieldCheck size={18} />}
              {inAdminMode ? 'Switch to User View' : 'Switch to Admin Panel'}
            </button>
          )}

          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0" style={{ background: theme.colors.primary }}>
              {user?.userName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.userName}</p>
              <p className="text-white/50 text-xs truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
