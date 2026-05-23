import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Palette, CreditCard, Mail, Settings2 } from 'lucide-react'
import { adminService } from '../../services/admin.service'
import { errMsg } from '../../services/api'
import { useUpdateTheme } from '../../context/ThemeContext'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const DEFAULT_COLORS = {
  primary:   '#6366f1',
  secondary: '#8b5cf6',
  dark:      '#1a2035',
  darker:    '#101320',
  light:     '#f5f5f5',
}

const TABS = [
  { key: 'general', label: 'General',  icon: Settings2 },
  { key: 'theme',   label: 'Theme',    icon: Palette   },
  { key: 'email',   label: 'Email',    icon: Mail      },
  { key: 'payment', label: 'Payment',  icon: CreditCard},
]

function ColorSwatch({ label, field, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || DEFAULT_COLORS[field]}
        onChange={e => onChange(field, e.target.value)}
        className="h-9 w-9 rounded-lg cursor-pointer border border-gray-200 p-0.5 shrink-0"
        title={label}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 capitalize">{label}</p>
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(field, e.target.value)}
          placeholder={DEFAULT_COLORS[field]}
          className="text-xs font-mono text-gray-500 border-0 p-0 bg-transparent w-full focus:outline-none"
          maxLength={7}
        />
      </div>
      {value && value !== DEFAULT_COLORS[field] && (
        <button type="button" onClick={() => onChange(field, '')} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">
          Reset
        </button>
      )}
    </div>
  )
}

export default function AdminSettings() {
  const qc = useQueryClient()
  const updateTheme = useUpdateTheme()
  const [tab, setTab] = useState('general')

  const [form, setForm] = useState({ registrationBonus: '', mainPlatformUrl: '', mainPlatformApiKey: '', googleFormUrl: '' })
  const [themeForm, setThemeForm] = useState({
    themeSiteName: '', themeLogoUrl: '', themeSupportPhone: '', themeChannelLink: '',
    themePrimary: '', themeSecondary: '', themeDark: '', themeDarker: '', themeLight: '',
  })
  const [paymentForm, setPaymentForm] = useState({
    monnifyApiKey: '', monnifySecretKey: '', monnifyContractCode: '', monnifyBaseUrl: '', frontendUrl: '',
    billstackApi: '', billstackSecret: '', billstackBanks: '',
  })
  const [smtpForm, setSmtpForm] = useState({
    smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', smtpFrom: '',
  })

  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminService.getSettings().then(r => r.data),
  })

  const data = settingsRes?.settings
  const paymentEnv = settingsRes?.paymentEnv || {}

  useEffect(() => {
    if (!data) return
    setForm({
      registrationBonus: data.registrationBonus ?? '',
      mainPlatformUrl:   data.mainPlatformUrl   ?? '',
      mainPlatformApiKey: data.mainPlatformApiKey ?? '',
      googleFormUrl: data.googleFormUrl ?? '',
    })
    setThemeForm({
      themeSiteName:     data.themeSiteName     ?? '',
      themeLogoUrl:      data.themeLogoUrl      ?? '',
      themeSupportPhone: data.themeSupportPhone ?? '',
      themeChannelLink:  data.themeChannelLink  ?? '',
      themePrimary:      data.themePrimary      ?? '',
      themeSecondary:    data.themeSecondary    ?? '',
      themeDark:         data.themeDark         ?? '',
      themeDarker:       data.themeDarker       ?? '',
      themeLight:        data.themeLight        ?? '',
    })
  }, [data])

  const { mutate: saveGeneral, isPending: savingGeneral } = useMutation({
    mutationFn: adminService.updateSettings,
    onSuccess: () => { toast.success('Saved!'); qc.invalidateQueries(['admin-settings']) },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: saveTheme, isPending: savingTheme } = useMutation({
    mutationFn: adminService.updateSettings,
    onSuccess: (_, vars) => { toast.success('Theme saved!'); updateTheme(vars); qc.invalidateQueries(['admin-settings']) },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: saveSmtp, isPending: savingSmtp } = useMutation({
    mutationFn: adminService.updateSettings,
    onSuccess: () => {
      toast.success('Email settings saved!')
      setSmtpForm({ smtpHost: '', smtpPort: '', smtpUser: '', smtpPass: '', smtpFrom: '' })
      qc.invalidateQueries(['admin-settings'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: savePayment, isPending: savingPayment } = useMutation({
    mutationFn: adminService.updateSettings,
    onSuccess: () => {
      toast.success('Payment settings saved!')
      setPaymentForm({ monnifyApiKey: '', monnifySecretKey: '', monnifyContractCode: '', monnifyBaseUrl: '', frontendUrl: '', billstackApi: '', billstackSecret: '', billstackBanks: '' })
      qc.invalidateQueries(['admin-settings'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))
  const setColor = (field, value) => setThemeForm(p => ({ ...p, [field]: value }))

  const previewPrimary = themeForm.themePrimary || DEFAULT_COLORS.primary
  const previewDark    = themeForm.themeDark    || DEFAULT_COLORS.dark

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Settings</h2>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${tab === key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* General tab */}
      {tab === 'general' && (
        <Card>
          <Card.Body className="space-y-5">
            <div className="space-y-4">
              <Input
                label="Main platform URL"
                placeholder="https://datareloaded.com/api/v1"
                value={form.mainPlatformUrl}
                onChange={set('mainPlatformUrl')}
              />
              <div>
                <Input
                  label="Main platform API key"
                  type="password"
                  placeholder="Your API key from main platform account"
                  value={form.mainPlatformApiKey}
                  onChange={set('mainPlatformApiKey')}
                />
                <p className="text-xs text-gray-400 mt-1">API key of your account on the main DataReloaded platform.</p>
              </div>
              <div>
                <Input
                  label="Registration bonus (₦)"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.registrationBonus}
                  onChange={set('registrationBonus')}
                />
                <p className="text-xs text-gray-400 mt-1">Credited to new users on registration. Set 0 to disable.</p>
              </div>
              <div>
                <Input
                  label="Data Deletion Request Form URL"
                  placeholder="https://docs.google.com/forms/..."
                  value={form.googleFormUrl}
                  onChange={set('googleFormUrl')}
                />
                <p className="text-xs text-gray-400 mt-1">Google Form URL shown on the public Data Deletion page.</p>
              </div>
            </div>
            <Button loading={savingGeneral} onClick={() => saveGeneral({
              mainPlatformUrl:   form.mainPlatformUrl,
              mainPlatformApiKey: form.mainPlatformApiKey,
              registrationBonus: Number(form.registrationBonus),
              googleFormUrl:     form.googleFormUrl,
            })}>
              Save
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Theme tab */}
      {tab === 'theme' && (
        <Card>
          <Card.Body className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Site name"
                placeholder="My Data Hub"
                value={themeForm.themeSiteName}
                onChange={e => setThemeForm(p => ({ ...p, themeSiteName: e.target.value }))}
              />
              <Input
                label="Support WhatsApp"
                placeholder="2348012345678"
                value={themeForm.themeSupportPhone}
                onChange={e => setThemeForm(p => ({ ...p, themeSupportPhone: e.target.value }))}
              />
            </div>

            <div>
              <Input
                label="Logo URL"
                placeholder="https://cdn.example.com/logo.png"
                value={themeForm.themeLogoUrl}
                onChange={e => setThemeForm(p => ({ ...p, themeLogoUrl: e.target.value }))}
              />
              {themeForm.themeLogoUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={themeForm.themeLogoUrl}
                    alt="logo preview"
                    className="h-10 w-10 rounded-lg object-contain border border-gray-200 bg-gray-50"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  <p className="text-xs text-gray-400">Preview</p>
                </div>
              )}
            </div>

            <div>
              <Input
                label="Channel link (Telegram / WhatsApp group)"
                placeholder="https://t.me/yourchannel"
                value={themeForm.themeChannelLink}
                onChange={e => setThemeForm(p => ({ ...p, themeChannelLink: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Shows as a floating button. Leave blank to hide.</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Brand Colors</p>
              <div className="grid grid-cols-2 gap-4">
                <ColorSwatch label="Primary"    field="themePrimary"   value={themeForm.themePrimary}   onChange={setColor} />
                <ColorSwatch label="Secondary"  field="themeSecondary" value={themeForm.themeSecondary} onChange={setColor} />
                <ColorSwatch label="Sidebar"    field="themeDark"      value={themeForm.themeDark}      onChange={setColor} />
                <ColorSwatch label="Darker"     field="themeDarker"    value={themeForm.themeDarker}    onChange={setColor} />
                <ColorSwatch label="Background" field="themeLight"     value={themeForm.themeLight}     onChange={setColor} />
              </div>
            </div>

            {/* Mini preview */}
            <div className="rounded-xl overflow-hidden border border-gray-200 flex" style={{ height: 80 }}>
              <div className="w-20 flex flex-col items-center justify-center gap-1.5" style={{ background: previewDark }}>
                <div className="h-1.5 w-10 rounded-full" style={{ background: previewPrimary }} />
                <div className="h-1.5 w-8 rounded-full opacity-40 bg-white" />
                <div className="h-1.5 w-8 rounded-full opacity-40 bg-white" />
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2 px-4" style={{ background: themeForm.themeLight || DEFAULT_COLORS.light }}>
                <div className="h-2.5 w-24 rounded-full opacity-85" style={{ background: previewPrimary }} />
                <div className="h-2 w-36 rounded-full bg-gray-200" />
                <div className="h-6 w-16 rounded-lg flex items-center justify-center" style={{ background: previewPrimary }}>
                  <div className="h-1.5 w-8 rounded-full bg-white opacity-90" />
                </div>
              </div>
            </div>

            <Button loading={savingTheme} onClick={() => saveTheme({
              themeSiteName:     themeForm.themeSiteName,
              themeLogoUrl:      themeForm.themeLogoUrl,
              themeSupportPhone: themeForm.themeSupportPhone,
              themeChannelLink:  themeForm.themeChannelLink,
              themePrimary:      themeForm.themePrimary,
              themeSecondary:    themeForm.themeSecondary,
              themeDark:         themeForm.themeDark,
              themeDarker:       themeForm.themeDarker,
              themeLight:        themeForm.themeLight,
            })}>
              Save Theme
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Email tab */}
      {tab === 'email' && (
        <Card>
          <Card.Body className="space-y-4">
            <p className="text-xs text-gray-500">Required for forgot-password emails. Leave blank to keep current values. Password is write-only.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'smtpHost', label: 'SMTP Host',           type: 'text',     placeholder: 'smtp.gmail.com' },
                { key: 'smtpPort', label: 'Port',                type: 'number',   placeholder: '587' },
                { key: 'smtpUser', label: 'Username / Email',    type: 'text',     placeholder: 'you@gmail.com' },
                { key: 'smtpPass', label: 'Password',            type: 'password', placeholder: 'Enter to update' },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={smtpForm[key]}
                    onChange={e => setSmtpForm(p => ({ ...p, [key]: e.target.value }))}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">From address</label>
              <input
                type="text"
                placeholder="DataHub <no-reply@yourdomain.com>"
                value={smtpForm.smtpFrom}
                onChange={e => setSmtpForm(p => ({ ...p, smtpFrom: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <Button loading={savingSmtp} onClick={() => {
              const updates = {}
              Object.entries(smtpForm).forEach(([k, v]) => { if (String(v).trim()) updates[k] = k === 'smtpPort' ? Number(v) : v.trim() })
              if (!Object.keys(updates).length) return toast.error('No values entered')
              saveSmtp(updates)
            }}>
              Save Email Settings
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Payment tab */}
      {tab === 'payment' && (
        <Card>
          <Card.Body className="space-y-4">
            <p className="text-xs text-gray-500">Enter values to save to the database. Leave blank to keep the current value. Secrets are write-only and never shown.</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: 'monnifyApiKey',       label: 'API Key',       envKey: 'MONNIFY_API_KEY',       placeholder: 'MK_TEST_…' },
                { field: 'monnifySecretKey',    label: 'Secret Key',    envKey: 'MONNIFY_SECRET_KEY',    placeholder: 'Enter to update' },
                { field: 'monnifyContractCode', label: 'Contract Code', envKey: 'MONNIFY_CONTRACT_CODE', placeholder: 'Enter to update' },
                { field: 'monnifyBaseUrl',      label: 'Base URL',      envKey: 'MONNIFY_BASE_URL',      placeholder: 'https://api.monnify.com' },
                { field: 'frontendUrl',         label: 'Frontend URL',  envKey: 'FRONTEND_URL',          placeholder: 'https://your-site.com' },
              ].map(({ field, label, envKey, placeholder }) => (
                <div key={field}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-sm font-medium text-gray-700">{label}</label>
                    {paymentEnv[envKey]
                      ? <span className="flex items-center gap-0.5 text-xs text-green-600"><CheckCircle size={11} /> Set</span>
                      : <span className="flex items-center gap-0.5 text-xs text-red-400"><XCircle size={11} /> Not set</span>
                    }
                  </div>
                  <input
                    type="password"
                    placeholder={placeholder}
                    value={paymentForm[field]}
                    onChange={e => setPaymentForm(p => ({ ...p, [field]: e.target.value }))}
                    autoComplete="new-password"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">BillStack Virtual Accounts</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { field: 'billstackApi',    label: 'API Base URL', envKey: 'BILLSTACK_API',    placeholder: 'https://api.billstack.co/v1', isSecret: false },
                  { field: 'billstackSecret', label: 'Secret Key',   envKey: 'BILLSTACK_SECRET', placeholder: 'Enter to update',             isSecret: true  },
                ].map(({ field, label, envKey, placeholder, isSecret }) => (
                  <div key={field}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <label className="text-sm font-medium text-gray-700">{label}</label>
                      {paymentEnv[envKey]
                        ? <span className="flex items-center gap-0.5 text-xs text-green-600"><CheckCircle size={11} /> Set</span>
                        : <span className="flex items-center gap-0.5 text-xs text-red-400"><XCircle size={11} /> Not set</span>
                      }
                    </div>
                    <input
                      type={isSecret ? 'password' : 'text'}
                      placeholder={placeholder}
                      value={paymentForm[field]}
                      onChange={e => setPaymentForm(p => ({ ...p, [field]: e.target.value }))}
                      autoComplete="new-password"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-1">Available Banks <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                  <input
                    type="text"
                    placeholder="PALMPAY,MONIEPOINT,WEMA"
                    value={paymentForm.billstackBanks}
                    onChange={e => setPaymentForm(p => ({ ...p, billstackBanks: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">Controls which bank buttons appear on the Fund Wallet page. Current: <span className="font-medium">{data?.billstackBanks || 'PALMPAY,MONIEPOINT,WEMA'}</span></p>
                </div>
              </div>
            </div>
            <Button loading={savingPayment} onClick={() => {
              const updates = {}
              Object.entries(paymentForm).forEach(([k, v]) => { if (v.trim()) updates[k] = v.trim() })
              if (!Object.keys(updates).length) return toast.error('No values entered')
              savePayment(updates)
            }}>
              Save Payment Settings
            </Button>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
