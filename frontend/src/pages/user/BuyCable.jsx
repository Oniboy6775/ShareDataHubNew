import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { purchaseService } from '../../services/purchase.service'
import { errMsg, naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'

const providers = ['DSTV', 'GOTV', 'Startimes']

export default function BuyCable() {
  const [provider, setProvider] = useState('DSTV')
  const [smartCardNo, setSmartCardNo] = useState('')
  const [planId, setPlanId] = useState('')
  const [last, setLast] = useState(null)

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['cable-plans', provider],
    queryFn: () => purchaseService.getPlans({ network: provider, planType: 'CABLE' }).then(r => r.data.plans),
  })

  const selectedPlan = plans.find(p => String(p.planId) === String(planId))

  const { mutate, isPending } = useMutation({
    mutationFn: purchaseService.buyCable,
    onSuccess: ({ data }) => {
      toast.success(data.msg || 'Subscription successful!')
      setLast(data)
      setPlanId('')
      setSmartCardNo('')
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Cable TV Subscription</h2>
      <Card>
        <Card.Body>
          <form onSubmit={e => { e.preventDefault(); mutate({ provider, smartCardNo, planId: Number(planId) }) }} className="space-y-4">
            <Select label="Provider" value={provider} onChange={e => { setProvider(e.target.value); setPlanId('') }}>
              {providers.map(p => <option key={p}>{p}</option>)}
            </Select>
            <Input label="Smart card / IUC number" placeholder="Enter card number" value={smartCardNo} onChange={e => setSmartCardNo(e.target.value)} required />
            <Select label="Package" value={planId} onChange={e => setPlanId(e.target.value)}>
              <option value="">{loadingPlans ? 'Loading...' : '-- Choose package --'}</option>
              {plans.map(p => (
                <option key={p.planId} value={p.planId}>
                  {p.planName} — {naira(p.price ?? p.sellingPrice)}
                </option>
              ))}
            </Select>
            {selectedPlan && (
              <div className="bg-primary/5 rounded-lg p-3 text-sm text-gray-700">
                {selectedPlan.planName} — {naira(selectedPlan.price ?? selectedPlan.sellingPrice)}
              </div>
            )}
            <Button type="submit" className="w-full" loading={isPending}>
              Subscribe
            </Button>
          </form>
        </Card.Body>
      </Card>

      {last && (
        <Card className="mt-4 border-green-100">
          <Card.Body>
            <p className="text-sm font-semibold text-green-700 mb-1">Subscription successful</p>
            <p className="text-xs text-gray-600">{last.msg}</p>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}
