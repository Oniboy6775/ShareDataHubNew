import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'
import { errMsg, naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

export default function AdminTransfer() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [amount, setAmount] = useState('')

  const { data: usersData, isLoading: searching } = useQuery({
    queryKey: ['transfer-user-search', search],
    queryFn: () => adminService.getUsers({ search, limit: 10 }).then(r => r.data),
    enabled: search.trim().length > 1,
  })

  const { data: adminData } = useQuery({
    queryKey: ['transfer-admin-balance'],
    queryFn: () => adminService.getUsers({ limit: 1 }).then(r => r.data),
  })

  const { mutate: credit, isPending: crediting } = useMutation({
    mutationFn: adminService.creditUser,
    onSuccess: ({ data: d }) => {
      toast.success(d.msg || 'Credited!')
      setSelectedUser(null)
      setAmount('')
      setSearch('')
      qc.invalidateQueries(['transfer-admin-balance'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const users = usersData?.users || []
  const adminBalance = adminData?.adminBalance ?? null

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold text-gray-900">Transfer to User</h2>

      {adminBalance !== null && (
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-indigo-50 shrink-0">
            <Wallet size={20} className="text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Your Available Balance</p>
            <p className="text-xl font-extrabold text-gray-900">{naira(adminBalance)}</p>
          </div>
        </div>
      )}

      <Card>
        <Card.Body className="space-y-4">
          <div className="relative">
            <Input
              label="Search user (username or email)"
              placeholder="Type to search…"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedUser(null) }}
            />
            {search.trim().length > 1 && (
              <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                {searching && <div className="flex justify-center py-3"><Spinner size="sm" /></div>}
                {!searching && users.length === 0 && (
                  <p className="text-sm text-gray-400 px-4 py-3">No users found</p>
                )}
                {users.map(u => (
                  <button
                    key={u._id}
                    onClick={() => { setSelectedUser(u); setSearch(u.userName) }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{u.userName}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{naira(u.balance)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm">
              <p className="text-gray-500">Sending to: <span className="font-semibold text-gray-900">{selectedUser.userName}</span></p>
              <p className="text-gray-500">Current balance: <span className="font-semibold text-gray-900">{naira(selectedUser.balance)}</span></p>
            </div>
          )}

          <Input
            label="Amount (₦)"
            type="number"
            min="1"
            placeholder="1000"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />

          <Button
            className="w-full"
            loading={crediting}
            disabled={!selectedUser || !amount || Number(amount) <= 0}
            onClick={() => credit({ userId: selectedUser._id, amount: Number(amount) })}
          >
            Transfer
          </Button>
        </Card.Body>
      </Card>
    </div>
  )
}
