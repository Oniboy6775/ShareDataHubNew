import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { purchaseService } from '../../services/purchase.service'
import { errMsg, naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const meterTypes = ['prepaid', 'postpaid']

export default function BuyElectricity() {
  const [form, setForm] = useState({ meterId: '', meterType: 'prepaid', meterNumber: '', amount: '' })
  const [validated, setValidated] = useState(null)
  const [last, setLast] = useState(null)

  const { data: discos = [], isLoading: loadingDiscos } = useQuery({
    queryKey: ['discos'],
    queryFn: () => purchaseService.fetchDiscos().then(r => r.data.discos || r.data),
  })

  const { mutate: validate, isPending: validating } = useMutation({
    mutationFn: purchaseService.validateMeter,
    onSuccess: ({ data }) => setValidated(data),
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: buy, isPending: buying } = useMutation({
    mutationFn: purchaseService.buyElectricity,
    onSuccess: ({ data }) => {
      toast.success(data.msg || 'Electricity token purchased!')
      setLast(data)
      setValidated(null)
      setForm(p => ({ ...p, meterNumber: '', amount: '' }))
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleValidate = (e) => {
    e.preventDefault()
    if (!form.meterId) return toast.error('Select a disco')
    validate({ meterId: form.meterId, meterType: form.meterType, meterNumber: form.meterNumber })
  }

  const handleBuy = () => buy({ ...form, customerName: validated?.name })

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Buy Electricity</h2>
      <Card>
        <Card.Body>
          <form onSubmit={handleValidate} className="space-y-4">
            <Select label="Disco" value={form.meterId} onChange={set('meterId')}>
              <option value="">{loadingDiscos ? 'Loading...' : '-- Select disco --'}</option>
              {discos.map(d => (
                <option key={d.id || d.code || d} value={d.id ?? d.code ?? d}>
                  {d.name || d}
                </option>
              ))}
            </Select>
            <Select label="Meter type" value={form.meterType} onChange={set('meterType')}>
              {meterTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
            <Input label="Meter number" placeholder="Enter meter number" value={form.meterNumber} onChange={set('meterNumber')} required />
            {!validated && (
              <Button type="submit" className="w-full" loading={validating}>
                Validate Meter
              </Button>
            )}
          </form>

          {validated && (
            <div className="mt-4 space-y-4">
              <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                <p className="text-sm font-semibold text-green-700">{validated.name}</p>
                <p className="text-xs text-gray-500">{validated.address || validated.meterNumber}</p>
              </div>
              <Input label="Amount (₦)" type="number" min="100" placeholder="500" value={form.amount} onChange={set('amount')} required />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setValidated(null)} className="flex-1">Back</Button>
                <Button onClick={handleBuy} loading={buying} className="flex-1">
                  Pay {form.amount ? naira(Number(form.amount) + 50) : ''}
                </Button>
              </div>
              <p className="text-xs text-gray-400">₦50 service charge included.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {last && (
        <Card className="mt-4 border-green-100">
          <Card.Body>
            <p className="text-sm font-semibold text-green-700 mb-1">Token purchased!</p>
            <p className="text-xs text-gray-600 break-all">{last.token || last.msg}</p>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
