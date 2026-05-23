import { Link } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

export default function LandingFooter() {
  const theme = useTheme()
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--color-darker)' }} className="text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              {theme.logo
                ? <img src={theme.logo} alt={theme.siteName} className="h-8 w-auto" />
                : <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: 'var(--color-primary)' }}>
                    {theme.siteName?.charAt(0) || 'D'}
                  </div>
              }
              <span className="font-extrabold text-white text-lg">{theme.siteName}</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              Nigeria's most affordable data and airtime reseller platform. Fast, secure, and always available 24/7.
            </p>
            <div className="flex gap-4 pt-1">
              {theme.supportWhatsapp && (
                <a href={`https://wa.me/${theme.supportWhatsapp}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors font-medium">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp Support
                </a>
              )}
              {theme.channelLink && (
                <a href={theme.channelLink} target="_blank" rel="noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Join Channel
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Services</h3>
            <ul className="space-y-2.5 text-sm">
              {['Data Bundles', 'Airtime Top-up', 'Electricity Tokens', 'Cable TV'].map(s => (
                <li key={s}><Link to="/register" className="hover:text-white transition-colors">{s}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/data-deletion" className="hover:text-white transition-colors">Data Deletion Request</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
          <span>© {year} {theme.siteName}. All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/data-deletion" className="hover:text-white transition-colors">Data Deletion</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
