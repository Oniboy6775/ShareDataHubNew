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
import { ArrowLeft } from 'lucide-react'

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
    queryFn: () => adminService.getUsers({ userId: id }).then(r => r.data.users?.[0]),
  })

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
            <span>Plan Price Overrides</span>
            <Button size="sm" loading={saving} onClick={handleSave}>Save Pricing</Button>
          </div>
        </Card.Header>
        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Th>Plan</Table.Th>
              <Table.Th>Network</Table.Th>
              <Table.Th>Default Price</Table.Th>
              <Table.Th>Special Price (₦)</Table.Th>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {plans.map(p => (
              <Table.Row key={p._id}>
                <Table.Td>
                  <p className="font-medium text-sm">{p.planName}</p>
                  <p className="text-xs text-gray-400">{p.planType}</p>
                </Table.Td>
                <Table.Td>{p.network}</Table.Td>
                <Table.Td className="text-gray-500">{naira(p.sellingPrice)}</Table.Td>
                <Table.Td>
                  <Input
                    type="number"
                    min="0"
                    placeholder={String(p.sellingPrice)}
                    value={overrides[p.planId] ?? ''}
                    onChange={e => setOverrides(prev => ({ ...prev, [p.planId]: e.target.value }))}
                    className="w-28"
                  />
                </Table.Td>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>

      <p className="text-xs text-gray-400">
        Leave a field blank to use the default selling price for that plan. Prices set here override all other pricing rules for this user.
      </p>
    </div>
  )
}
