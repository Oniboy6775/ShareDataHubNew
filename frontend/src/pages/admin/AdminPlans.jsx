import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Flame, ToggleLeft, ToggleRight, MessageCircle } from 'lucide-react'
import { adminService } from '../../services/admin.service'
import { errMsg, naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

const NETWORKS = ['ALL', 'MTN', 'GLO', 'AIRTEL', '9MOBILE']

export default function AdminPlans() {
  const qc = useQueryClient()
  const [editPlan, setEditPlan] = useState(null)
  const [prices, setPrices] = useState({})

  // filters
  const [networkFilter, setNetworkFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: allPlans = [], isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => adminService.getPlans().then(r => r.data.plans),
  })

  const planTypes = useMemo(() => {
    const types = [...new Set(allPlans.map(p => p.planType).filter(Boolean))]
    return types.sort()
  }, [allPlans])

  const filtered = useMemo(() => {
    return allPlans.filter(p => {
      if (networkFilter !== 'ALL' && p.network?.toUpperCase() !== networkFilter) return false
      if (typeFilter && p.planType !== typeFilter) return false
      if (statusFilter === 'active' && !p.isAvailable) return false
      if (statusFilter === 'disabled' && p.isAvailable) return false
      if (statusFilter === 'hot' && !p.isHot) return false
      if (search && !p.planName?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [allPlans, networkFilter, typeFilter, statusFilter, search])

  const { mutate: syncPlans, isPending: syncing } = useMutation({
    mutationFn: adminService.syncPlans,
    onSuccess: ({ data: d }) => {
      toast.success(d.msg || 'Plans synced!')
      qc.invalidateQueries(['admin-plans'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: updatePlan, isPending: updating } = useMutation({
    mutationFn: ({ id, d }) => adminService.updatePlan(id, d),
    onSuccess: () => {
      toast.success('Plan updated!')
      setEditPlan(null)
      qc.invalidateQueries(['admin-plans'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const toggleHot = (plan) => {
    updatePlan({ id: plan._id, d: { isHot: !plan.isHot } })
  }

  const toggleAvailable = (plan) => {
    updatePlan({ id: plan._id, d: { isAvailable: !plan.isAvailable } })
  }

  const toggleBotEnabled = (plan) => {
    updatePlan({ id: plan._id, d: { botEnabled: !plan.botEnabled } })
  }

  const openEdit = (plan) => {
    setEditPlan(plan)
    setPrices({
      sellingPrice: plan.sellingPrice,
      resellerPrice: plan.resellerPrice ?? '',
      apiPrice: plan.apiPrice ?? '',
      isHot: !!plan.isHot,
      isAvailable: plan.isAvailable !== false,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Plans</h2>
        <Button loading={syncing} onClick={() => syncPlans()}>Sync from Main Platform</Button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Body className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            {NETWORKS.map(n => (
              <button
                key={n}
                onClick={() => setNetworkFilter(n)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  networkFilter === n
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                }`}
              >
                {n}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All Types</option>
                {planTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="hot">Hot 🔥</option>
              </select>
              <input
                type="text"
                placeholder="Search plan name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 w-44"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Showing {filtered.length} of {allPlans.length} plans
          </p>
        </Card.Body>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Th>Plan</Table.Th>
                <Table.Th>Cost</Table.Th>
                <Table.Th>Selling</Table.Th>
                <Table.Th>Profit</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Hot</Table.Th>
                <Table.Th>Bot</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {filtered.map(p => {
                const profit = (p.sellingPrice || 0) - (p.costPrice || 0)
                return (
                  <Table.Row key={p._id}>
                    <Table.Td>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">{p.network}</span>
                        <div>
                          <p className="font-medium text-sm leading-tight">{p.planName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[p.planType, p.planCategory].filter(Boolean).join(' · ')}
                            <span className="ml-1 text-gray-300">· ID {p.planId}</span>
                          </p>
                        </div>
                      </div>
                    </Table.Td>
                    <Table.Td className="text-gray-500">{naira(p.costPrice ?? 0)}</Table.Td>
                    <Table.Td className="font-medium">{naira(p.sellingPrice)}</Table.Td>
                    <Table.Td className={profit > 0 ? 'text-green-600 font-medium' : profit < 0 ? 'text-red-500 font-medium' : 'text-gray-400'}>
                      {naira(profit)}
                    </Table.Td>
                    <Table.Td>
                      <button
                        onClick={() => toggleAvailable(p)}
                        title={p.isAvailable ? 'Click to disable' : 'Click to enable'}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:opacity-80 active:scale-95 ${
                          p.isAvailable
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        {p.isAvailable
                          ? <><ToggleRight size={13} /> Active</>
                          : <><ToggleLeft size={13} /> Disabled</>}
                      </button>
                    </Table.Td>
                    <Table.Td>
                      <button
                        onClick={() => toggleHot(p)}
                        title={p.isHot ? 'Remove from Hot' : 'Mark as Hot'}
                        className={`p-1.5 rounded-lg transition-colors ${p.isHot ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : 'text-gray-300 hover:text-orange-400 hover:bg-orange-50'}`}
                      >
                        <Flame size={16} />
                      </button>
                    </Table.Td>
                    <Table.Td>
                      <button
                        onClick={() => toggleBotEnabled(p)}
                        title={p.botEnabled ? 'Remove from WhatsApp bot' : 'Enable for WhatsApp bot'}
                        className={`p-1.5 rounded-lg transition-colors ${p.botEnabled ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-300 hover:text-green-500 hover:bg-green-50'}`}
                      >
                        <MessageCircle size={16} />
                      </button>
                    </Table.Td>
                    <Table.Td>
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                    </Table.Td>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </Card>

      <Modal open={!!editPlan} onClose={() => setEditPlan(null)} title={`Edit — ${editPlan?.planName}`}>
        <div className="space-y-4">
          {editPlan?.costPrice > 0 && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-500">Cost price (from main platform)</span>
              <span className="font-bold text-gray-800">{naira(editPlan.costPrice)}</span>
            </div>
          )}
          <Input
            label="Selling price (₦)"
            type="number"
            value={prices.sellingPrice}
            onChange={e => setPrices(p => ({ ...p, sellingPrice: e.target.value }))}
          />
          <Input
            label="Reseller price (₦)"
            type="number"
            value={prices.resellerPrice}
            onChange={e => setPrices(p => ({ ...p, resellerPrice: e.target.value }))}
          />
          <Input
            label="API price (₦)"
            type="number"
            value={prices.apiPrice}
            onChange={e => setPrices(p => ({ ...p, apiPrice: e.target.value }))}
          />
          {/* Available toggle inside modal */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              {prices.isAvailable
                ? <ToggleRight size={16} className="text-green-500" />
                : <ToggleLeft size={16} className="text-red-400" />}
              <div>
                <span className="text-sm font-medium text-gray-700">Plan Available</span>
                <p className="text-xs text-gray-400">Disabled plans are hidden from all users. Survives syncs.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPrices(p => ({ ...p, isAvailable: !p.isAvailable }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prices.isAvailable ? 'bg-green-500' : 'bg-red-400'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prices.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Hot plan toggle inside modal */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Flame size={16} className={prices.isHot ? 'text-orange-500' : 'text-gray-300'} />
              <span className="text-sm font-medium text-gray-700">Mark as Hot Plan</span>
            </div>
            <button
              type="button"
              onClick={() => setPrices(p => ({ ...p, isHot: !p.isHot }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${prices.isHot ? 'bg-orange-500' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${prices.isHot ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setEditPlan(null)}>Cancel</Button>
            <Button
              loading={updating}
              onClick={() => updatePlan({
                id: editPlan._id,
                d: {
                  sellingPrice: Number(prices.sellingPrice),
                  resellerPrice: Number(prices.resellerPrice),
                  apiPrice: Number(prices.apiPrice),
                  isHot: prices.isHot,
                  isAvailable: prices.isAvailable,
                },
              })}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
