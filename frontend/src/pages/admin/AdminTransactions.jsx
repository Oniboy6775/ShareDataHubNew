import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'
import { errMsg, naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'
import TransactionDetailModal from '../../components/ui/TransactionDetailModal'

const statusVariant = { success: 'success', failed: 'danger', processing: 'warning', pending: 'warning', refunded: 'info' }

export default function AdminTransactions() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', type: '', search: '', userName: '' })
  const [detail, setDetail] = useState(null)
  const [refundModal, setRefundModal] = useState(null)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-transactions', page, filters],
    queryFn: () => adminService.getTransactions({ page, limit: 20, ...filters }).then(r => r.data),
    keepPreviousData: true,
    refetchInterval: 30_000,
  })

  const { mutate: refund, isPending: refunding } = useMutation({
    mutationFn: adminService.refundTransaction,
    onSuccess: ({ data: d }) => {
      toast.success(d.msg || 'Refunded!')
      setRefundModal(null)
      setDetail(null)
      qc.invalidateQueries(['admin-transactions'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const txs = data?.transactions || []
  const total = data?.total || 0
  const pages = Math.ceil(total / 20)

  const setFilter = (k) => (e) => setFilters(p => ({ ...p, [k]: e.target.value }))

  const openRefund = (e, tx) => {
    e.stopPropagation()
    setRefundModal(tx)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Transactions</h2>
        <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          <span className="ml-1.5">Refresh</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search phone…" value={filters.search} onChange={setFilter('search')} className="w-44" />
        <Input placeholder="Username…" value={filters.userName} onChange={setFilter('userName')} className="w-44" />
        <Select value={filters.status} onChange={setFilter('status')} className="w-40">
          <option value="">All status</option>
          {['success','failed','processing','pending','refunded'].map(s => <option key={s}>{s}</option>)}
        </Select>
        <Select value={filters.type} onChange={setFilter('type')} className="w-40">
          <option value="">All types</option>
          {['data','airtime','electricity','cable'].map(t => <option key={t}>{t}</option>)}
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Th>Bal. After</Table.Th>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Details</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Profit</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {txs.map(tx => {
                  const rowBg =
                    tx.trans_Status === 'failed'     ? 'bg-red-50' :
                    tx.trans_Status === 'processing' ? 'bg-yellow-50' :
                    tx.trans_Status === 'pending'    ? 'bg-yellow-50' : ''
                  return (
                  <Table.Row
                    key={tx._id}
                    className={`cursor-pointer ${rowBg}`}
                    onClick={() => setDetail(tx)}
                  >
                    <Table.Td className="font-semibold text-gray-700">{tx.balance_After != null ? naira(tx.balance_After) : '—'}</Table.Td>
                    <Table.Td className="text-sm">{tx.trans_UserName}</Table.Td>
                    <Table.Td>
                      <Badge variant={statusVariant[tx.trans_Status] || 'default'}>
                        {tx.trans_Status}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="text-xs text-gray-500">
                      {tx.trans_plan
                        ? <span>{tx.trans_plan}</span>
                        : <>{tx.trans_Network && <span className="mr-1">{tx.trans_Network}</span>}{tx.phone_number}</>
                      }
                    </Table.Td>
                    <Table.Td className="font-medium">{naira(tx.trans_amount)}</Table.Td>
                    <Table.Td className={tx.trans_profit > 0 ? 'text-green-600 font-medium text-sm' : 'text-gray-400 text-sm'}>
                      {tx.trans_profit > 0 ? `+${naira(tx.trans_profit)}` : tx.trans_Status === 'success' ? naira(0) : '—'}
                    </Table.Td>
                    <Table.Td className="text-xs text-gray-500 whitespace-nowrap">
                      {tx.trans_Date || new Date(tx.createdAt).toLocaleString()}
                    </Table.Td>
                    <Table.Td>
                      {tx.trans_Status === 'success' && (
                        <Button size="sm" variant="danger" onClick={(e) => openRefund(e, tx)}>Refund</Button>
                      )}
                    </Table.Td>
                  </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Page {page} of {pages} • {total} transactions</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Detail modal — also offers Refund button inline for admin */}
      <TransactionDetailModal
        tx={detail}
        onClose={() => setDetail(null)}
        isAdmin
        footer={
          detail?.trans_Status === 'success' ? (
            <Button variant="danger" onClick={() => { setRefundModal(detail); setDetail(null) }}>
              Refund this transaction
            </Button>
          ) : null
        }
      />

      <Modal open={!!refundModal} onClose={() => setRefundModal(null)} title="Confirm Refund">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Refund <strong>{naira(refundModal?.trans_amount)}</strong> to <strong>{refundModal?.trans_UserName}</strong>?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setRefundModal(null)}>Cancel</Button>
            <Button variant="danger" loading={refunding} onClick={() => refund({ transactionId: refundModal?.trans_Id })}>
              Confirm Refund
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
