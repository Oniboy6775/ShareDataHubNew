import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth.service'
import { errMsg } from '../../services/api'
import {
  Copy, RefreshCw, Eye, EyeOff, CheckCircle,
  ChevronRight, Code2, Globe, Lock, Zap, Database,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function Badge({ method }) {
  const colors = {
    GET:  { bg: '#dcfce7', text: '#15803d' },
    POST: { bg: '#dbeafe', text: '#1d4ed8' },
  }
  const c = colors[method] || { bg: '#f3f4f6', text: '#374151' }
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-extrabold tracking-wide"
      style={{ background: c.bg, color: c.text }}>{method}</span>
  )
}

function CodeBlock({ code, lang = 'json' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: '#0d1117' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <span className="text-xs font-semibold" style={{ color: '#6b7280' }}>{lang}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: copied ? '#22c55e' : '#6b7280' }}>
          {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto leading-relaxed m-0"
        style={{ color: '#e6edf3', fontFamily: '"Fira Code", "Cascadia Code", monospace', fontSize: '12.5px' }}>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function ParamRow({ name, type, required, desc }) {
  return (
    <tr className="border-b border-gray-50">
      <td className="py-2.5 pr-3 align-top">
        <code className="text-xs font-bold text-indigo-600">{name}</code>
        {required && <span className="ml-1.5 text-[10px] font-semibold text-red-500">required</span>}
      </td>
      <td className="py-2.5 pr-3 align-top">
        <span className="text-xs text-gray-400">{type}</span>
      </td>
      <td className="py-2.5 text-xs text-gray-500 align-top">{desc}</td>
    </tr>
  )
}

function Endpoint({ id, method, path, title, desc, params = [], bodyExample, responseExample, curlExample }) {
  const [tab, setTab] = useState('response')
  return (
    <div id={id} className="scroll-mt-20 rounded-2xl border border-gray-100 overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white">
        <Badge method={method} />
        <code className="text-sm font-bold text-gray-800">{path}</code>
        <span className="text-gray-400 text-sm hidden sm:inline">—</span>
        <span className="text-gray-600 text-sm hidden sm:inline">{title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        {/* Left: description + params */}
        <div className="p-5 bg-white">
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{desc}</p>
          {params.length > 0 && (
            <>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                {method === 'GET' ? 'Query Parameters' : 'Request Body'}
              </p>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-[10px] font-bold text-gray-400 uppercase pb-2 pr-3">Name</th>
                    <th className="text-[10px] font-bold text-gray-400 uppercase pb-2 pr-3">Type</th>
                    <th className="text-[10px] font-bold text-gray-400 uppercase pb-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {params.map(p => <ParamRow key={p.name} {...p} />)}
                </tbody>
              </table>
            </>
          )}
          {bodyExample && (
            <div className="mt-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Request Body Example</p>
              <CodeBlock code={bodyExample} lang="json" />
            </div>
          )}
        </div>

        {/* Right: code examples */}
        <div className="p-5" style={{ background: '#f9fafb' }}>
          <div className="flex gap-2 mb-3">
            {[['response', 'Response'], ['curl', 'cURL'], ['js', 'JavaScript']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                style={tab === key
                  ? { background: 'var(--color-primary)', color: '#fff' }
                  : { background: '#e5e7eb', color: '#374151' }}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'response' && <CodeBlock code={responseExample} lang="json" />}
          {tab === 'curl' && <CodeBlock code={curlExample} lang="bash" />}
          {tab === 'js' && <CodeBlock code={buildJsExample(method, path, bodyExample)} lang="javascript" />}
        </div>
      </div>
    </div>
  )
}

function buildJsExample(method, path, body) {
  const hasBody = method === 'POST' && body
  return `const response = await fetch(\`\${BASE_URL}${path}\`, {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${YOUR_API_KEY}\`,
  },${hasBody ? `
  body: JSON.stringify(${body}),` : ''}
})

const data = await response.json()
console.log(data)`
}

// ─── Docs data ───────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'authentication', label: 'Authentication', icon: Lock },
  { id: 'plans',          label: 'Plans',           icon: Database },
  { id: 'buy-data',       label: 'Buy Data',        icon: Zap },
  { id: 'buy-airtime',    label: 'Buy Airtime',     icon: Zap },
  { id: 'buy-electricity',label: 'Electricity',     icon: Zap },
  // { id: 'buy-cable',      label: 'Cable TV',        icon: Zap },
  { id: 'validate-meter', label: 'Validate Meter',  icon: Zap },
  { id: 'transactions',   label: 'Transactions',    icon: Database },
  { id: 'profile',        label: 'Profile',         icon: Database },
]

// ─── Main component ──────────────────────────────────────────────────────────

export default function ApiDocs() {
  const { user, setUser } = useAuth()
  const qc = useQueryClient()
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const apiKey = user?.apiToken || ''
  const maskedKey = apiKey ? apiKey.slice(0, 8) + '••••••••••••••••••••••••' : 'Not generated yet'

  const copyKey = () => {
    if (!apiKey) return toast.error('Generate an API key first')
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const { mutate: generateKey, isPending: generating } = useMutation({
    mutationFn: authService.generateApiKey,
    onSuccess: ({ data }) => {
      toast.success('New API key generated')
      setUser(prev => ({ ...prev, apiToken: data.apiKey }))
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const BASE_URL_DISPLAY = `${window.location.origin}/api`

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Code2 size={22} style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-xl font-bold text-gray-900">API Documentation</h2>
        </div>
        <p className="text-gray-500 text-sm">
          Integrate purchases directly into your application. All endpoints accept and return JSON.
        </p>
      </div>

      {/* ── API Key card ── */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))' }}>
          <Lock size={15} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold text-gray-900 text-sm">Your API Key</span>
        </div>
        <div className="bg-white p-5 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex-1 min-w-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
              <code className="text-sm font-mono text-gray-700 flex-1 truncate">
                {showKey && apiKey ? apiKey : maskedKey}
              </code>
              <button onClick={() => setShowKey(v => !v)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button onClick={copyKey}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold transition-colors hover:bg-gray-50"
              style={{ color: copied ? '#16a34a' : '#374151' }}>
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => generateKey()}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Generating…' : apiKey ? 'Regenerate' : 'Generate Key'}
            </button>
          </div>
          {apiKey && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
              ⚠️ Keep your API key secret. Regenerating will invalidate the old key immediately and break any existing integrations.
            </p>
          )}
        </div>
      </div>

      {/* ── Base URL ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-gray-200 bg-white">
        <Globe size={16} style={{ color: 'var(--color-primary)' }} />
        <span className="text-sm text-gray-500 font-medium">Base URL</span>
        <code className="text-sm font-mono text-gray-800 flex-1">{BASE_URL_DISPLAY}</code>
      </div>

      {/* ── Section nav ── */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors bg-white">
            <ChevronRight size={11} />
            {s.label}
          </a>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── AUTHENTICATION ── */}
      <section id="authentication" className="scroll-mt-20">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--color-primary)' }}>1</span>
          Authentication
        </h3>
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden mb-4">
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              All API requests must include your API key in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 text-xs">Authorization</code> header. Both <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Bearer</code> and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Token</code> prefixes are accepted.
            </p>
            <CodeBlock lang="http" code={`Authorization: Bearer YOUR_API_KEY
# or
Authorization: Token YOUR_API_KEY`} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                { label: 'Smart Earner (user)', desc: 'Standard selling price' },
                { label: 'Reseller', desc: 'Reseller discounted price' },
                { label: 'API User', desc: 'API-tier price (best rates)' },
              ].map(t => (
                <div key={t.label} className="rounded-xl border border-gray-100 p-3.5">
                  <p className="font-semibold text-gray-800 text-sm">{t.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{t.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">
              Prices returned are based on your account type. Contact your admin to upgrade to <strong>API User</strong> for the best rates.
            </p>
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section id="plans" className="scroll-mt-20">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--color-primary)' }}>2</span>
          Plans
        </h3>
        <Endpoint
          id="plans-list"
          method="GET"
          path="/api/v1/plans"
          title="List available plans"
          desc="Returns all available data plans. Prices are automatically resolved to your account tier (user / reseller / API user). Filter by network and plan type using query parameters."
          params={[
            { name: 'network', type: 'string', required: false, desc: 'Filter by network — MTN, GLO, AIRTEL, 9MOBILE' },
            { name: 'planType', type: 'string', required: false, desc: 'Filter by type — SME, GIFTING, DIRECT, etc.' },
            { name: 'planCategory', type: 'string', required: false, desc: 'Filter by category if applicable' },
          ]}
          responseExample={`{
  "plans": [
    {
      "planId": 1,
      "network": "MTN",
      "planName": "1.0GB",
      "planType": "SME",
      "planCategory": "",
      "sellingPrice": 280,
      "resellerPrice": 265,
      "apiPrice": 250,
      "price": 250,
      "isAvailable": true,
      "isHot": true
    }
    // ...
  ]
}`}
          curlExample={`curl -X GET "${BASE_URL_DISPLAY}/api/v1/plans?network=MTN" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        />
      </section>

      {/* ── BUY DATA ── */}
      <section id="buy-data" className="scroll-mt-20">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--color-primary)' }}>3</span>
          Buy Data
        </h3>
        <Endpoint
          id="buy-data-endpoint"
          method="POST"
          path="/api/v1/buy/data"
          title="Purchase a data bundle"
          desc="Deducts the plan price from your wallet and sends the data bundle to the specified phone number. The price is resolved based on your account type. Transaction is saved and a receipt is returned."
          params={[
            { name: 'plan',           type: 'number',  required: true,  desc: 'Plan ID from /api/v1/plans response' },
            { name: 'network',        type: 'string',  required: true,  desc: 'Network — MTN, GLO, AIRTEL, 9MOBILE' },
            { name: 'mobile_number',  type: 'string',  required: true,  desc: 'Recipient phone number e.g. 08012345678' },
            { name: 'transactionPin', type: 'string',  required: false, desc: 'Required if PIN is enabled on your account' },
          ]}
          bodyExample={`{
  "plan": 1,
  "network": "MTN",
  "mobile_number": "08012345678",
  "transactionPin": "1234"
}`}
          responseExample={`{
  "msg": "Data purchase was successful",
  "receipt": {
    "trans_Id": "2025-DATA-abc123",
    "trans_Type": "data",
    "trans_Network": "MTN",
    "trans_amount": 250,
    "phone_number": "08012345678",
    "trans_Status": "success",
    "balance_Before": 5000,
    "balance_After": 4750,
    "trans_Date": "Thu May 22 2025 12:00:00"
  }
}`}
          curlExample={`curl -X POST "${BASE_URL_DISPLAY}/api/v1/buy/data" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"plan":1,"network":"MTN","mobile_number":"08012345678"}'`}
        />
      </section>

      {/* ── BUY AIRTIME ── */}
      <section id="buy-airtime" className="scroll-mt-20">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--color-primary)' }}>4</span>
          Buy Airtime
        </h3>
        <Endpoint
          id="buy-airtime-endpoint"
          method="POST"
          path="/api/v1/buy/airtime"
          title="Top up airtime"
          desc="Sends airtime of the specified amount to a phone number. The exact amount is deducted from your wallet — there is no markup on airtime."
          params={[
            { name: 'network',        type: 'string',  required: true,  desc: 'Network — MTN, GLO, AIRTEL, 9MOBILE' },
            { name: 'mobile_number',  type: 'string',  required: true,  desc: 'Recipient phone number e.g. 08012345678' },
            { name: 'amount',         type: 'number',  required: true,  desc: 'Amount in Naira (minimum ₦50)' },
            { name: 'transactionPin', type: 'string',  required: false, desc: 'Required if PIN is enabled on your account' },
          ]}
          bodyExample={`{
  "network": "MTN",
  "mobile_number": "08012345678",
  "amount": 500,
  "transactionPin": "1234"
}`}
          responseExample={`{
  "msg": "Airtime purchase was successful",
  "receipt": {
    "trans_Id": "2025-AIRTIME-xyz789",
    "trans_Type": "airtime",
    "trans_Network": "MTN",
    "trans_amount": 500,
    "phone_number": "08012345678",
    "trans_Status": "success",
    "balance_Before": 4750,
    "balance_After": 4250
  }
}`}
          curlExample={`curl -X POST "${BASE_URL_DISPLAY}/api/v1/buy/airtime" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"network":"MTN","mobile_number":"08012345678","amount":500}'`}
        />
      </section>

      {/* ── VALIDATE METER ── */}
      <section id="validate-meter" className="scroll-mt-20">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--color-primary)' }}>5</span>
          Electricity
        </h3>
        <Endpoint
          id="validate-meter-endpoint"
          method="POST"
          path="/api/v1/buy/validateMeter"
          title="Validate electricity meter"
          desc="Validates a meter number before payment. Always call this first to confirm the meter exists and get the customer name to display to your user for confirmation."
          params={[
            { name: 'meterNumber', type: 'string', required: true,  desc: 'The electricity meter number' },
            { name: 'discoName',   type: 'string', required: true,  desc: 'DISCO code e.g. EEDC, IKEDC, EKEDC, PHED, BEDC, etc.' },
            { name: 'meterType',   type: 'string', required: true,  desc: '"prepaid" or "postpaid"' },
          ]}
          bodyExample={`{
  "meterNumber": "1234567890",
  "discoName": "EEDC",
  "meterType": "prepaid"
}`}
          responseExample={`{
  "msg": "Meter validated",
  "customerName": "JOHN DOE",
  "meterNumber": "1234567890"
}`}
          curlExample={`curl -X POST "${BASE_URL_DISPLAY}/api/v1/buy/validateMeter" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"meterNumber":"1234567890","discoName":"EEDC","meterType":"prepaid"}'`}
        />
        <Endpoint
          id="buy-electricity-endpoint"
          method="POST"
          path="/api/v1/buy/electricity"
          title="Purchase electricity token"
          desc="Purchases a prepaid/postpaid electricity token and returns the token number. Always validate the meter number first using the /validateMeter endpoint."
          params={[
            { name: 'meterNumber',    type: 'string',  required: true,  desc: 'Validated meter number' },
            { name: 'discoName',      type: 'string',  required: true,  desc: 'DISCO code e.g. EEDC, IKEDC, EKEDC' },
            { name: 'meterType',      type: 'string',  required: true,  desc: '"prepaid" or "postpaid"' },
            { name: 'amount',         type: 'number',  required: true,  desc: 'Amount in Naira (minimum ₦1,000)' },
            { name: 'phoneNumber',    type: 'string',  required: true,  desc: 'Customer phone number for token delivery' },
            { name: 'transactionPin', type: 'string',  required: false, desc: 'Required if PIN is enabled' },
          ]}
          bodyExample={`{
  "meterNumber": "1234567890",
  "discoName": "EEDC",
  "meterType": "prepaid",
  "amount": 5000,
  "phoneNumber": "08012345678",
  "transactionPin": "1234"
}`}
          responseExample={`{
  "msg": "Electricity token purchase successful",
  "receipt": {
    "trans_Id": "2025-ELEC-def456",
    "trans_Type": "electricity",
    "trans_Network": "EEDC",
    "trans_amount": 5000,
    "phone_number": "1234567890",
    "trans_Status": "success",
    "apiResponse": "Token: 1234-5678-9012-3456"
  }
}`}
          curlExample={`curl -X POST "${BASE_URL_DISPLAY}/api/v1/buy/electricity" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"meterNumber":"1234567890","discoName":"EEDC","meterType":"prepaid","amount":5000,"phoneNumber":"08012345678"}'`}
        />
      </section>

      {/* ── CABLE TV (commented out) ── */}
      {/* <section id="buy-cable" className="scroll-mt-20">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--color-primary)' }}>6</span>
          Cable TV
        </h3>
        <Endpoint
          id="buy-cable-endpoint"
          method="POST"
          path="/api/v1/buy/cable"
          title="Renew cable TV subscription"
          desc="Renews a DSTV, GOtv, or Startimes subscription. Provide the smart card / IUC number and the plan code."
          params={[
            { name: 'cableName',      type: 'string',  required: true,  desc: 'Provider — DSTV, GOTV, STARTIMES' },
            { name: 'cableNumber',    type: 'string',  required: true,  desc: 'Smart card / IUC number' },
            { name: 'plan',           type: 'string',  required: true,  desc: 'Subscription plan code from provider' },
            { name: 'transactionPin', type: 'string',  required: false, desc: 'Required if PIN is enabled' },
          ]}
          bodyExample={`{
  "cableName": "DSTV",
  "cableNumber": "1234567890",
  "plan": "CONFAM",
  "transactionPin": "1234"
}`}
          responseExample={`{
  "msg": "Cable subscription renewed successfully",
  "receipt": {
    "trans_Id": "2025-CABLE-ghi012",
    "trans_Type": "cable",
    "trans_Network": "DSTV",
    "trans_amount": 2800,
    "phone_number": "1234567890",
    "trans_Status": "success"
  }
}`}
          curlExample={`curl -X POST "${BASE_URL_DISPLAY}/api/v1/buy/cable" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"cableName":"DSTV","cableNumber":"1234567890","plan":"CONFAM"}'`}
        />
      </section> */}

      {/* ── TRANSACTIONS ── */}
      <section id="transactions" className="scroll-mt-20">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--color-primary)' }}>7</span>
          Transactions & Profile
        </h3>
        <Endpoint
          id="transactions-endpoint"
          method="GET"
          path="/api/v1/auth/transactions"
          title="List your transactions"
          desc="Returns a paginated list of all transactions for your account. Filter by status and type."
          params={[
            { name: 'page',   type: 'number', required: false, desc: 'Page number (default 1)' },
            { name: 'limit',  type: 'number', required: false, desc: 'Results per page (default 20, max 100)' },
            { name: 'status', type: 'string', required: false, desc: 'Filter by status — success, failed, processing' },
            { name: 'type',   type: 'string', required: false, desc: 'Filter by type — data, airtime, electricity, cable, wallet' },
            { name: 'search', type: 'string', required: false, desc: 'Search by phone number, network, or transaction ID' },
          ]}
          responseExample={`{
  "transactions": [
    {
      "trans_Id": "2025-DATA-abc123",
      "trans_Type": "data",
      "trans_Network": "MTN",
      "trans_amount": 250,
      "phone_number": "08012345678",
      "trans_Status": "success",
      "trans_Date": "Thu May 22 2025 12:00:00",
      "balance_Before": 5000,
      "balance_After": 4750
    }
  ],
  "total": 145,
  "page": 1,
  "pages": 8
}`}
          curlExample={`curl -X GET "${BASE_URL_DISPLAY}/api/v1/auth/transactions?page=1&type=data" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        />
        <Endpoint
          id="profile-endpoint"
          method="GET"
          path="/api/v1/auth/profile"
          title="Get account profile & balance"
          desc="Returns your account details including current wallet balance. Use this to check your balance before making purchases."
          params={[]}
          responseExample={`{
  "user": {
    "userName": "john_doe",
    "email": "john@example.com",
    "phoneNumber": "08012345678",
    "balance": 4750,
    "userType": "api user",
    "isSpecial": false,
    "accountNumbers": [
      { "bankName": "PALMPAY", "accountNumber": "8012345678" }
    ]
  }
}`}
          curlExample={`curl -X GET "${BASE_URL_DISPLAY}/api/v1/auth/profile" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
        />
      </section>

      {/* ── Error responses ── */}
      <section className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100" style={{ background: '#fafafa' }}>
          <h3 className="font-bold text-gray-900 text-sm">Error Responses</h3>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-500 mb-4">All errors return a JSON object with a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">msg</code> field describing the problem.</p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-xs font-bold text-gray-400 uppercase pb-2 pr-4">Status</th>
                <th className="text-xs font-bold text-gray-400 uppercase pb-2">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                { code: '200', meaning: 'Success' },
                { code: '400', meaning: 'Bad request — missing or invalid parameters' },
                { code: '401', meaning: 'Unauthorized — missing or invalid API key' },
                { code: '403', meaning: 'Forbidden — wrong PIN, suspended account, or insufficient balance' },
                { code: '404', meaning: 'Resource not found' },
                { code: '500', meaning: 'Transaction failed on the network side — balance may be automatically refunded' },
              ].map(r => (
                <tr key={r.code} className="border-b border-gray-50">
                  <td className="py-2.5 pr-4">
                    <code className={`text-xs font-bold ${r.code.startsWith('2') ? 'text-green-600' : r.code.startsWith('4') ? 'text-amber-600' : 'text-red-600'}`}>{r.code}</code>
                  </td>
                  <td className="py-2.5 text-gray-600 text-sm">{r.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5">
            <CodeBlock lang="json" code={`// Error response format
{
  "msg": "Insufficient balance. Kindly fund your wallet"
}`} />
          </div>
        </div>
      </section>

      {/* Bottom padding */}
      <div className="h-8" />
    </div>
  )
}
