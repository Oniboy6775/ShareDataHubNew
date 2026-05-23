import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { Menu, X } from 'lucide-react'

export default function LandingNav() {
  const theme = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex items-center gap-2.5">
            {theme.logo
              ? <img src={theme.logo} alt={theme.siteName} className="h-8 w-auto" />
              : <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: 'var(--color-primary)' }}>
                  {theme.siteName?.charAt(0) || 'D'}
                </div>
            }
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">{theme.siteName}</span>
          </Link>

          <div className="hidden md:flex items-center gap-7">
            {[['/#services','Services'],['/#pricing','Pricing'],['/#how-it-works','How It Works'],['/#faq','FAQ']].map(([href, label]) => (
              <a key={href} href={href} className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">{label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 transition-colors">
              Login
            </Link>
            <Link to="/register"
              className="text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
              Get Started Free
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
          {[['/#services','Services'],['/#pricing','Pricing'],['/#how-it-works','How It Works'],['/#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block text-sm text-gray-700 font-medium px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">{label}</a>
          ))}
          <div className="pt-3 border-t border-gray-100 flex gap-2 mt-1">
            <Link to="/login" onClick={() => setOpen(false)}
              className="flex-1 text-center text-sm font-semibold py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Login
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}
              className="flex-1 text-center text-sm font-bold py-2.5 rounded-xl text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
