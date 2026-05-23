import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { purchaseService } from '../../services/purchase.service'
import { errMsg } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import PhoneInput from '../../components/ui/PhoneInput'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import PinModal from '../../components/ui/PinModal'

const networks = ['MTN', 'GLO', 'AIRTEL', '9MOBILE']

export default function BuyAirtime() {
  const { user } = useAuth()
  const [form, setForm] = useState({ network: 'MTN', mobile_number: '', amount: '' })
  const [contactName, setContactName] = useState('')
  const [last, setLast] = useState(null)
  const [pinOpen, setPinOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState(null)

  const { mutate, isPending } = useMutation({
    mutationFn: purchaseService.buyAirtime,
    onSuccess: ({ data }) => {
      toast.success(data.msg || 'Airtime sent!')
      setLast(data)
      setContactName('')
      setForm(p => ({ ...p, mobile_number: '', amount: '' }))
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (user?.pinEnabled) {
      setPendingPayload(form)
      setPinOpen(true)
    } else {
      mutate(form)
    }
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Buy Airtime</h2>
      <PinModal
        open={pinOpen}
        loading={isPending}
        onClose={() => { setPinOpen(false); setPendingPayload(null) }}
        onSubmit={(pin) => { setPinOpen(false); mutate({ ...pendingPayload, transactionPin: pin }) }}
      />
      <Card>
        <Card.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Network" value={form.network} onChange={set('network')}>
              {networks.map(n => <option key={n}>{n}</option>)}
            </Select>
            <PhoneInput
              label="Phone number"
              placeholder="08012345678"
              value={form.mobile_number}
              onChange={set('mobile_number')}
              contactName={contactName}
              onContactPick={({ number, name }) => {
                setForm(p => ({ ...p, mobile_number: number }))
                setContactName(name)
              }}
              required
            />
            <Input label="Amount (₦)" type="number" placeholder="100" min="50" value={form.amount} onChange={set('amount')} required />
            <Button type="submit" className="w-full" loading={isPending}>
              Send Airtime
            </Button>
          </form>
        </Card.Body>
      </Card>

      {last && (
        <Card className="mt-4 border-green-100">
          <Card.Body>
            <p className="text-sm font-semibold text-green-700 mb-1">Airtime sent successfully</p>
            <p className="text-xs text-gray-600">{last.msg}</p>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
