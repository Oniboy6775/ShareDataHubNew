import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authService } from '../../services/auth.service'
import api, { errMsg } from '../../services/api'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { CreditCard, Copy, Building2, Plus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function FundWallet() {
  const { user, setUser } = useAuth()
  const [amount, setAmount] = useState('')
  const [paymentData, setPaymentData] = useState(null)

  // Fetch available BillStack banks from admin settings (via public theme endpoint)
  const { data: themeData } = useQuery({
    queryKey: ['public-theme'],
    queryFn: () => api.get('/theme').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  })
  const billstackBanks = (themeData?.billstackBanks || '')
    .split(',').map(b => b.trim().toUpperCase()).filter(Boolean)

  const accounts = user?.accountNumbers || []
  const hasBank = (bank) => accounts.some(a => a.bankName?.toUpperCase() === bank)

  const { mutate: requestMonnify, isPending: requestingMonnify } = useMutation({
    mutationFn: authService.createReservedAccount,
    onSuccess: ({ data }) => { toast.success(data.msg); setUser(data.user) },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: requestBillStack, isPending: requestingBillStack, variables: bsVars } = useMutation({
    mutationFn: (bankName) => authService.createBillStackAccount({ bankName }),
    onSuccess: ({ data }) => { toast.success(data.msg); setUser(data.user) },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: initiate, isPending } = useMutation({
    mutationFn: (d) => authService.initiateFunding(d),
    onSuccess: ({ data }) => setPaymentData(data),
    onError: (err) => toast.error(errMsg(err)),
  })

  const copyAccount = (number) => { navigator.clipboard.writeText(number); toast.success('Copied!') }

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Fund Wallet</h2>

      {/* ── Dedicated Accounts ── */}
      <Card>
        <Card.Header>Dedicated Account Numbers (Instant)</Card.Header>
        <Card.Body className="space-y-4">
          {accounts.length > 0 && (
            <div className="space-y-2">
              {accounts.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">{a.bankName}</p>
                    <p className="font-bold text-lg text-gray-900 tracking-widest">{a.accountNumber}</p>
                  </div>
                  <button onClick={() => copyAccount(a.accountNumber)} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                    <Copy size={16} className="text-gray-500" />
                  </button>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">Transfer to any account above — wallet is credited automatically.</p>
            </div>
          )}

          {/* Monnify */}
          {accounts.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center space-y-3">
              <Building2 className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">No dedicated accounts yet. Generate one below.</p>
            </div>
          )}

          <div className="pt-1 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Generate new account</p>

            {/* Monnify button — only if no accounts yet */}
            {accounts.length === 0 && (
              <Button variant="outline" className="w-full justify-start gap-2" loading={requestingMonnify} onClick={() => requestMonnify()}>
                <Plus size={14} /> Generate Monnify Account
              </Button>
            )}

            {/* BillStack banks */}
            {billstackBanks.map(bank => (
              <Button
                key={bank}
                variant="outline"
                className="w-full justify-start gap-2"
                loading={requestingBillStack && bsVars === bank}
                disabled={hasBank(bank) || (requestingBillStack && bsVars !== bank)}
                onClick={() => requestBillStack(bank)}
              >
                {hasBank(bank) ? (
                  <span className="text-green-600 font-semibold">✓ {bank} — already generated</span>
                ) : (
                  <><Plus size={14} /> Generate {bank} Account</>
                )}
              </Button>
            ))}

            {billstackBanks.length === 0 && accounts.length > 0 && (
              <p className="text-xs text-gray-400">Contact support to add more bank options.</p>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* ── Checkout ── */}
      <Card>
        <Card.Header>Pay via Checkout</Card.Header>
        <Card.Body>
          {!paymentData ? (
            <form onSubmit={e => { e.preventDefault(); initiate({ amount: Number(amount) }) }} className="space-y-4">
              <Input
                label="Amount (₦)"
                type="number"
                min="100"
                placeholder="500"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" loading={isPending}>
                <CreditCard size={16} className="mr-2" />
                Proceed to payment
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-green-700 font-medium">Payment initiated</p>
              {paymentData.checkoutUrl && (
                <a
                  href={paymentData.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Open payment page
                </a>
              )}
              <button onClick={() => setPaymentData(null)} className="text-xs text-gray-400 hover:text-gray-600 w-full text-center">
                Start over
              </button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
