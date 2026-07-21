import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Copy, MessageCircle, Bell } from 'lucide-react'
import { adminService } from '../../services/admin.service'
import { errMsg } from '../../services/api'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const TRIGGERS = [
  { key: 'guestPurchaseSuccess', label: 'Guest — Purchase Success', hint: 'Appended after a guest completes a purchase.' },
  { key: 'registeredPurchaseSuccess', label: 'Registered — Purchase Success', hint: 'Appended after a registered user completes a purchase.' },
  { key: 'guestBalanceCheck', label: 'Guest — Balance Check', hint: 'Appended to the guest balance reply.' },
  { key: 'registeredBalanceCheck', label: 'Registered — Balance Check', hint: 'Appended to the registered balance reply.' },
  { key: 'guestMainMenu', label: 'Guest — Main Menu', hint: 'Appended to the main menu shown to guests.' },
  { key: 'registeredMainMenu', label: 'Registered — Main Menu', hint: 'Appended to the main menu shown to registered users.' },
]

export default function AdminWhatsApp() {
  const qc = useQueryClient()

  const [form, setForm] = useState({ whatsappBotToken: '', whatsappPhoneId: '', whatsappVerifyToken: '', botWalletUserId: '' })
  const [notifs, setNotifs] = useState({})

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminService.getSettings().then(r => r.data),
  })

  const data = settingsRes?.settings

  useEffect(() => {
    if (!data) return
    setForm({
      whatsappBotToken: '',
      whatsappPhoneId: data.whatsappPhoneId ?? '',
      whatsappVerifyToken: data.whatsappVerifyToken ?? '',
      botWalletUserId: data.botWalletUserId ?? '',
    })
    const base = {}
    TRIGGERS.forEach(({ key }) => {
      base[key] = { enabled: !!data.botNotifications?.[key]?.enabled, message: data.botNotifications?.[key]?.message ?? '' }
    })
    setNotifs(base)
  }, [data])

  const { mutate: saveConfig, isPending: savingConfig } = useMutation({
    mutationFn: adminService.updateSettings,
    onSuccess: () => {
      toast.success('Bot configuration saved!')
      setForm(p => ({ ...p, whatsappBotToken: '' }))
      qc.invalidateQueries(['admin-settings'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: saveNotifs, isPending: savingNotifs } = useMutation({
    mutationFn: adminService.updateSettings,
    onSuccess: () => {
      toast.success('Bot notifications saved!')
      qc.invalidateQueries(['admin-settings'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const webhookUrl = `${window.location.origin}/api/v1/whatsapp/webhook`

  const copy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied!')
  }

  const setNotif = (key, field, value) => setNotifs(p => ({ ...p, [key]: { ...p[key], [field]: value } }))

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-gray-900">WhatsApp Bot</h2>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2"><MessageCircle size={16} />Bot Configuration</div>
        </Card.Header>
        <Card.Body className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Webhook URL</label>
            <div className="flex items-center gap-2">
              <input readOnly value={webhookUrl} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 font-mono text-xs" />
              <button onClick={() => copy(webhookUrl)} className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200">
                <Copy size={14} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Enter this URL as the callback URL in your Meta App's WhatsApp webhook configuration.</p>
          </div>

          <Input
            label="WhatsApp Token"
            type="password"
            placeholder="Enter to update (permanent token from Meta)"
            value={form.whatsappBotToken}
            onChange={e => setForm(p => ({ ...p, whatsappBotToken: e.target.value }))}
            autoComplete="new-password"
          />
          <Input
            label="Phone Number ID"
            placeholder="From Meta dashboard"
            value={form.whatsappPhoneId}
            onChange={e => setForm(p => ({ ...p, whatsappPhoneId: e.target.value }))}
          />
          <Input
            label="Webhook Verify Token"
            placeholder="Any string — must match the value entered in Meta"
            value={form.whatsappVerifyToken}
            onChange={e => setForm(p => ({ ...p, whatsappVerifyToken: e.target.value }))}
          />
          <div>
            <Input
              label="Bot Wallet User ID"
              placeholder="The _id of the platform user that acts as the bot's wallet"
              value={form.botWalletUserId}
              onChange={e => setForm(p => ({ ...p, botWalletUserId: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">Create a dedicated user account, fund it, and paste its _id here. This wallet covers guest purchases.</p>
          </div>

          <Button
            loading={savingConfig}
            onClick={() => {
              const updates = {
                whatsappPhoneId: form.whatsappPhoneId,
                whatsappVerifyToken: form.whatsappVerifyToken,
                botWalletUserId: form.botWalletUserId,
              }
              if (form.whatsappBotToken.trim()) updates.whatsappBotToken = form.whatsappBotToken.trim()
              saveConfig(updates)
            }}
          >
            Save Configuration
          </Button>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2"><Bell size={16} />Bot Notifications</div>
        </Card.Header>
        <Card.Body className="space-y-5">
          <p className="text-xs text-gray-500">Custom messages appended after specific bot events. Leave disabled to keep the default reply only.</p>
          {TRIGGERS.map(({ key, label, hint }) => (
            <div key={key} className="rounded-xl border border-gray-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400">{hint}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotif(key, 'enabled', !notifs[key]?.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${notifs[key]?.enabled ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${notifs[key]?.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="Custom message…"
                value={notifs[key]?.message || ''}
                onChange={e => setNotif(key, 'message', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          ))}
          <Button loading={savingNotifs} onClick={() => saveNotifs({ botNotifications: notifs })}>
            Save All Notifications
          </Button>
        </Card.Body>
      </Card>
    </div>
  )
}
