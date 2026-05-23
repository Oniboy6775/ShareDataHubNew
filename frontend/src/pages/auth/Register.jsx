import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth.service'
import { errMsg } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

export default function Register() {
  const theme = useTheme()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({
    userName: '',
    email: '',
    phoneNumber: '',
    password: '',
    referralCode: params.get('ref') || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authService.register(form)
      login(data.token, data.user)
      toast.success(data.msg || 'Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="min-h-screen flex items-center justify-center bg-light px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-3" style={{ background: theme.colors.primary }}>
            <span className="text-white font-bold text-xl">{theme.siteName[0]}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">{theme.siteName}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Username" placeholder="johndoe" value={form.userName} onChange={set('userName')} required />
            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            <Input label="Phone number" placeholder="08012345678" value={form.phoneNumber} onChange={set('phoneNumber')} required />
            <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={6} />
            <Input label="Referral code (optional)" placeholder="username" value={form.referralCode} onChange={set('referralCode')} />
            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
