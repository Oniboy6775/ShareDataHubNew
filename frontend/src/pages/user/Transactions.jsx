import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authService } from '../../services/auth.service'
import { naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import TransactionDetailModal from '../../components/ui/TransactionDetailModal'
import TxDetails from '../../components/ui/TxDetails'

const statusVariant = { success: 'success', failed: 'danger', processing: 'warning', pending: 'warning', refunded: 'info' }
const limit = 20

export default function Transactions() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', type: '', search: '' })
  const [detail, setDetail] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['user-transactions', page, filters],
    queryFn: () => authService.getTransactions({ page, limit, ...filters }).then(r => r.data),
    keepPreviousData: true,
  })

  const setFilter = (k) => (e) => {
    setFilters(p => ({ ...p, [k]: e.target.value }))
    setPage(1)
  }

  const txs = data?.transactions || []
  const total = data?.total || 0
  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Transactions</h2>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search phone / ref…" value={filters.search} onChange={setFilter('search')} className="w-48" />
        <Select value={filters.status} onChange={setFilter('status')} className="w-40">
          <option value="">All status</option>
          {['success', 'failed', 'processing', 'pending', 'refunded'].map(s => <option key={s}>{s}</option>)}
        </Select>
        <Select value={filters.type} onChange={setFilter('type')} className="w-40">
          <option value="">All types</option>
          {['data', 'airtime', 'electricity', 'cable', 'wallet'].map(t => <option key={t}>{t}</option>)}
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : txs.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            {filters.status || filters.type || filters.search ? 'No transactions match your filters.' : 'No transactions yet.'}
          </div>
        ) : (
          <>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Th>Bal. After</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Details</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Amount</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {txs.map(tx => {
                  const rowBg =
                    tx.trans_Status === 'failed'     ? 'bg-red-50' :
                    tx.trans_Status === 'processing' ? 'bg-yellow-50' :
                    tx.trans_Status === 'pending'    ? 'bg-yellow-50' : ''
                  return (
                  <Table.Row key={tx._id} className={`cursor-pointer ${rowBg}`} onClick={() => setDetail(tx)}>
                    <Table.Td className="font-semibold text-gray-700">{tx.balance_After != null ? naira(tx.balance_After) : '—'}</Table.Td>
                    <Table.Td>
                      <Badge variant={statusVariant[tx.trans_Status] || 'default'}>{tx.trans_Status}</Badge>
                    </Table.Td>
                    <Table.Td><TxDetails tx={tx} /></Table.Td>
                    <Table.Td className="text-xs text-gray-500">{tx.phone_number || '—'}</Table.Td>
                    <Table.Td className="font-medium">{naira(tx.trans_amount)}</Table.Td>
                    <Table.Td className="text-xs text-gray-500 whitespace-nowrap">
                      {tx.trans_Date || new Date(tx.createdAt).toLocaleString()}
                    </Table.Td>
                  </Table.Row>
                  )
                })}
              </Table.Body>
            </Table>

            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Page {page} of {pages} · {total} total</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <TransactionDetailModal tx={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
