import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '../../services/auth.service'
import { errMsg } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ForgotPassword() {
  const theme = useTheme()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.forgotPassword({ email })
      setSent(true)
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-3 overflow-hidden" style={{ background: theme.colors.primary }}>
            {theme.logo
              ? <img src={theme.logo} alt="logo" className="h-full w-full object-contain" />
              : <span className="text-white font-bold text-xl">{theme.siteName[0]}</span>
            }
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {sent ? (
            <div className="text-center py-2 space-y-3">
              <div className="text-4xl">📬</div>
              <p className="text-sm text-gray-700 font-medium">Check your inbox</p>
              <p className="text-xs text-gray-500">If <strong>{email}</strong> is registered, a password reset link has been sent. Check your spam folder if you don't see it.</p>
              <Link to="/login" className="block mt-4 text-sm font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Send reset link
              </Button>
              <p className="text-center text-sm text-gray-500">
                <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
