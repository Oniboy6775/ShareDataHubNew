import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth.service'
import { errMsg } from '../../services/api'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { Copy, Building2, ShieldCheck, ShieldOff } from 'lucide-react'

export default function Profile() {
  const { user, setUser } = useAuth()
  const qc = useQueryClient()
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [webhookUrl, setWebhookUrl] = useState(user?.webhookUrl || '')
  const [coupon, setCoupon] = useState('')

  const { mutate: changePassword, isPending: changingPw } = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: ({ data }) => {
      toast.success(data.msg || 'Password changed!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: saveWebhook, isPending: savingWebhook } = useMutation({
    mutationFn: (d) => authService.updateProfile(d),
    onSuccess: ({ data }) => {
      toast.success('Webhook URL saved!')
      setUser(data.user)
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: genApiKey, isPending: generatingKey } = useMutation({
    mutationFn: authService.generateApiKey,
    onSuccess: ({ data }) => {
      toast.success('New API key generated!')
      setUser(data.user)
      qc.invalidateQueries(['profile-full'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const [pinForm, setPinForm] = useState({ pin: '', confirm: '' })
  const [showChangePinForm, setShowChangePinForm] = useState(false)

  const { mutate: setPinMutation, isPending: settingPin } = useMutation({
    mutationFn: authService.setPin,
    onSuccess: ({ data }) => {
      toast.success(data.msg)
      setUser(u => ({ ...u, pinEnabled: true }))
      setPinForm({ pin: '', confirm: '' })
      setShowChangePinForm(false)
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: removePinMutation, isPending: removingPin } = useMutation({
    mutationFn: authService.removePin,
    onSuccess: ({ data }) => {
      toast.success(data.msg)
      setUser(u => ({ ...u, pinEnabled: false }))
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const handleSetPin = (e) => {
    e.preventDefault()
    if (!/^\d{4}$/.test(pinForm.pin)) return toast.error('PIN must be exactly 4 digits')
    if (pinForm.pin !== pinForm.confirm) return toast.error('PINs do not match')
    setPinMutation({ pin: pinForm.pin })
  }

  const { mutate: requestAccount, isPending: requesting } = useMutation({
    mutationFn: authService.createReservedAccount,
    onSuccess: ({ data }) => { toast.success(data.msg); setUser(data.user) },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: redeemCoupon, isPending: redeeming } = useMutation({
    mutationFn: authService.redeemCoupon,
    onSuccess: ({ data }) => {
      toast.success(data.msg || 'Coupon redeemed!')
      setCoupon('')
      setUser(data.user)
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const handlePwSubmit = (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('Passwords do not match')
    changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Profile</h2>

      <Card>
        <Card.Header>Account Info</Card.Header>
        <Card.Body className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Username</p>
              <p className="font-medium">{user?.userName}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium">{user?.phoneNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Account type</p>
              <p className="font-medium capitalize">{user?.userType}</p>
            </div>
          </div>

        </Card.Body>
      </Card>

      {/* Transaction PIN */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            {user?.pinEnabled ? <ShieldCheck size={16} className="text-green-500" /> : <ShieldOff size={16} className="text-gray-400" />}
            Transaction PIN
            {user?.pinEnabled && <span className="ml-auto text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Enabled</span>}
          </div>
        </Card.Header>
        <Card.Body>
          {user?.pinEnabled ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">A 4-digit PIN is required before every purchase.</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" loading={settingPin} onClick={() => { setPinForm({ pin: '', confirm: '' }); setShowChangePinForm(true) }}>
                  Change PIN
                </Button>
                <Button variant="outline" size="sm" loading={removingPin} onClick={() => removePinMutation()}>
                  Remove PIN
                </Button>
              </div>
              {(showChangePinForm || settingPin) && (
                <form onSubmit={handleSetPin} className="space-y-3 pt-2 border-t border-gray-100">
                  <Input label="New PIN (4 digits)" type="password" inputMode="numeric" maxLength={4} placeholder="••••"
                    value={pinForm.pin} onChange={e => setPinForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0,4) }))} />
                  <Input label="Confirm new PIN" type="password" inputMode="numeric" maxLength={4} placeholder="••••"
                    value={pinForm.confirm} onChange={e => setPinForm(p => ({ ...p, confirm: e.target.value.replace(/\D/g, '').slice(0,4) }))} />
                  <Button type="submit" size="sm" loading={settingPin}>Update PIN</Button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSetPin} className="space-y-3">
              <p className="text-sm text-gray-500">Set a 4-digit PIN to secure your purchases. Optional — you can remove it anytime.</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="New PIN (4 digits)" type="password" inputMode="numeric" maxLength={4} placeholder="••••"
                  value={pinForm.pin} onChange={e => setPinForm(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0,4) }))} />
                <Input label="Confirm PIN" type="password" inputMode="numeric" maxLength={4} placeholder="••••"
                  value={pinForm.confirm} onChange={e => setPinForm(p => ({ ...p, confirm: e.target.value.replace(/\D/g, '').slice(0,4) }))} />
              </div>
              <Button type="submit" size="sm" loading={settingPin}>Enable Transaction PIN</Button>
            </form>
          )}
        </Card.Body>
      </Card>

      {/* Virtual / Dedicated Accounts */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2"><Building2 size={16} />Dedicated Account</div>
        </Card.Header>
        <Card.Body className="space-y-3">
          {user?.accountNumbers?.length > 0 ? (
            <>
              {user.accountNumbers.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500">{a.bankName}</p>
                    <p className="font-bold text-base text-gray-900 tracking-widest">{a.accountNumber}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(a.accountNumber); toast.success('Copied!') }} className="p-2 rounded-lg hover:bg-gray-200">
                    <Copy size={14} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-400">Transfers to these accounts credit your wallet automatically.</p>
            </>
          ) : (
            <div className="text-center py-3 space-y-3">
              <p className="text-sm text-gray-500">No dedicated account yet.</p>
              <Button loading={requesting} onClick={() => requestAccount()}>
                Request Dedicated Account
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Change Password</Card.Header>
        <Card.Body>
          <form onSubmit={handlePwSubmit} className="space-y-4">
            <Input label="Current password" type="password" placeholder="••••••••"
              value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required />
            <Input label="New password" type="password" placeholder="••••••••" minLength={6}
              value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required />
            <Input label="Confirm new password" type="password" placeholder="••••••••"
              value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
            <Button type="submit" loading={changingPw}>Update Password</Button>
          </form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>API Key</Card.Header>
        <Card.Body className="space-y-3">
          {user?.apiToken ? (
            <div className="flex items-center gap-2">
              <input readOnly value={user.apiToken} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-mono text-xs" />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No API key generated yet.</p>
          )}
          <Button variant="outline" size="sm" loading={generatingKey} onClick={() => genApiKey()}>
            {user?.apiToken ? 'Regenerate Key' : 'Generate Key'}
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Webhook URL</Card.Header>
        <Card.Body>
          <div className="space-y-3">
            <Input placeholder="https://yourapp.com/webhook" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} />
            <Button variant="outline" size="sm" loading={savingWebhook} onClick={() => saveWebhook({ webhookUrl })}>
              Save Webhook
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Redeem Coupon</Card.Header>
        <Card.Body>
          <div className="flex gap-2">
            <Input placeholder="Enter coupon code" value={coupon} onChange={e => setCoupon(e.target.value)} className="flex-1" />
            <Button loading={redeeming} onClick={() => redeemCoupon({ couponCode: coupon })} disabled={!coupon}>
              Redeem
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}
