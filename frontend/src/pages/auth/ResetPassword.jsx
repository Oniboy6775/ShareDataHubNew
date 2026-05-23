import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '../../services/auth.service'
import { errMsg } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function ResetPassword() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const { data } = await authService.resetPassword({ token, password: form.password })
      toast.success(data.msg)
      navigate('/login')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light px-4">
        <div className="text-center space-y-3">
          <p className="text-gray-700 font-medium">Invalid reset link</p>
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">Request a new one</Link>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="text-gray-500 text-sm mt-1">Choose a strong password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              required
            />
            <Button type="submit" className="w-full" loading={loading}>
              Reset password
            </Button>
            <p className="text-center text-sm text-gray-500">
              <Link to="/login" className="text-primary font-medium hover:underline">Back to login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
