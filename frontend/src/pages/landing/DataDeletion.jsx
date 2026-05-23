import LandingNav from '../../components/landing/LandingNav'
import LandingFooter from '../../components/landing/LandingFooter'
import { useTheme } from '../../context/ThemeContext'
import { ShieldCheck, Clock, CheckCircle } from 'lucide-react'

export default function DataDeletion() {
  const theme = useTheme()

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Data Deletion Request</h1>
        <p className="text-sm text-gray-400 mb-10">Your right to be forgotten — we take it seriously.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: ShieldCheck, title: 'Your Right',    desc: 'Under NDPA 2023, you have the right to request deletion of your personal data.' },
            { icon: Clock,       title: '7-Day SLA',     desc: 'We process all deletion requests within 7 business days of submission.' },
            { icon: CheckCircle, title: 'Confirmation',  desc: 'You will receive an email confirmation once your data has been deleted.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-5 rounded-2xl border border-gray-100 bg-gray-50">
              <Icon size={22} className="mb-3" style={{ color: 'var(--color-primary)' }} />
              <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-10">
          <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Before you proceed</p>
          <ul className="text-sm text-amber-700 space-y-1.5 list-disc pl-4">
            <li>Deleting your account will permanently remove all your personal data, transaction history, and wallet balance.</li>
            <li>This action is <strong>irreversible</strong>. Any remaining wallet balance will be forfeited.</li>
            <li>Outstanding transactions or disputes must be resolved before deletion can be processed.</li>
          </ul>
        </div>

        {theme.googleFormUrl ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Your Request</h2>
            <p className="text-gray-500 text-sm mb-6">
              Complete the form below to submit your data deletion request. Our team will review and process it within 7 business days.
            </p>
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <iframe
                src={theme.googleFormUrl}
                title="Data Deletion Request Form"
                className="w-full"
                style={{ height: '600px', border: 'none' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Having trouble with the form?{' '}
              <a href={theme.googleFormUrl} target="_blank" rel="noreferrer"
                className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
                Open it in a new tab →
              </a>
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
            <p className="text-gray-500 text-sm mb-4">
              To submit a data deletion request, please contact our support team directly via WhatsApp. Include your registered email address and username in your message.
            </p>
            {theme.supportWhatsapp && (
              <a
                href={`https://wa.me/${theme.supportWhatsapp}?text=I%20would%20like%20to%20request%20deletion%20of%20my%20account%20and%20personal%20data.`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
                style={{ background: '#25D366' }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Contact Support on WhatsApp
              </a>
            )}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-400 space-y-1">
          <p>This page is provided in compliance with the Nigeria Data Protection Act (NDPA) 2023.</p>
          <p>For more information, see our <a href="/privacy" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>.</p>
        </div>
      </div>
      <LandingFooter />
    </div>
  )
}
