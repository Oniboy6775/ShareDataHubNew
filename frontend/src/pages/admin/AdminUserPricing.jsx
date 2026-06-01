import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'
import { errMsg, naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { ArrowLeft, Tag } from 'lucide-react'

export default function AdminUserPricing() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [overrides, setOverrides] = useState({})

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => adminService.getPlans().then(r => r.data.plans),
  })

  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => adminService.getUserById(id).then(r => r.data.user),
  })

  // Track which planIds already have a saved special price
  const savedPlanIds = new Set((userData?.specialPrices || []).map(s => s.planId))

  useEffect(() => {
    if (userData?.specialPrices?.length) {
      const map = {}
      userData.specialPrices.forEach(({ planId, price }) => { map[planId] = price })
      setOverrides(map)
    }
  }, [userData])

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (d) => adminService.setSpecialPricing(id, d),
    onSuccess: ({ data: d }) => {
      toast.success(d.msg || 'Special pricing saved!')
      qc.invalidateQueries(['admin-user', id])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const handleSave = () => {
    const prices = Object.entries(overrides)
      .filter(([, price]) => price !== '' && !isNaN(Number(price)))
      .map(([planId, price]) => ({ planId: Number(planId), price: Number(price) }))
    save({ prices })
  }

  if (loadingPlans || loadingUser) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/admin/users">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} /></Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Special Pricing</h2>
          <p className="text-sm text-gray-500">{userData?.userName} — {userData?.email}</p>
        </div>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Plan Price Overrides</span>
              {savedPlanIds.size > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <Tag size={11} />
                  {savedPlanIds.size} special {savedPlanIds.size === 1 ? 'price' : 'prices'} set
                </span>
              )}
            </div>
            <Button size="sm" loading={saving} onClick={handleSave}>Save Pricing</Button>
          </div>
        </Card.Header>
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Th>Plan</Table.Th>
              <Table.Th>Cost Price</Table.Th>
              <Table.Th>
                {userData?.userType === 'reseller' ? 'Reseller Price' :
                 userData?.userType === 'api user' ? 'API Price' : 'Selling Price'}
              </Table.Th>
              <Table.Th>Special Price (₦)</Table.Th>
              <Table.Th>Profit</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {plans.map(p => {
              const hasSaved = savedPlanIds.has(p.planId)
              const basePrice =
                userData?.userType === 'reseller' ? (p.resellerPrice || p.sellingPrice) :
                userData?.userType === 'api user'  ? (p.apiPrice     || p.sellingPrice) :
                p.sellingPrice
              const specialVal = overrides[p.planId] !== '' && overrides[p.planId] != null
                ? Number(overrides[p.planId]) : null
              const effectivePrice = specialVal ?? basePrice
              const profit = p.costPrice ? effectivePrice - p.costPrice : null
              return (
              <Table.Row
                key={p._id}
                className={hasSaved ? 'border-l-4 border-l-green-400 bg-green-50/40' : ''}
              >
                <Table.Td>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{p.network}</span>
                        <p className="font-medium text-sm">{p.planName}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[p.planType, p.planCategory].filter(Boolean).join(' · ')}
                        <span className="ml-1 text-gray-300">· ID {p.planId}</span>
                      </p>
                    </div>
                    {hasSaved && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 shrink-0">
                        <Tag size={9} />
                        Special
                      </span>
                    )}
                  </div>
                </Table.Td>
                <Table.Td className="text-gray-500 text-sm">{p.costPrice ? naira(p.costPrice) : <span className="text-gray-300">—</span>}</Table.Td>
                <Table.Td className="text-gray-600 font-medium">{naira(basePrice)}</Table.Td>
                <Table.Td>
                  <Input
                    type="number"
                    min="0"
                    placeholder={String(basePrice)}
                    value={overrides[p.planId] ?? ''}
                    onChange={e => setOverrides(prev => ({ ...prev, [p.planId]: e.target.value }))}
                    className={`w-28 ${hasSaved ? 'border-green-400 focus:border-green-500' : ''}`}
                  />
                </Table.Td>
                <Table.Td>
                  {profit === null ? (
                    <span className="text-gray-300 text-sm">—</span>
                  ) : (
                    <span className={`text-sm font-semibold ${profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {naira(profit)}
                    </span>
                  )}
                </Table.Td>
              </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      </Card>

      <p className="text-xs text-gray-400">
        Leave a field blank to use the default selling price for that plan. Prices set here override all other pricing rules for this user.
      </p>
    </div>
  )
}
