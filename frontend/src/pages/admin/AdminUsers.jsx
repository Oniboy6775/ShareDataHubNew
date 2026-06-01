import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Wallet, Users } from 'lucide-react'
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

function ActionMenu({ user, onCredit, onDebit, onToggleSuspend, onReset, onRemoveSpecial, onChangeType }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
        <MoreHorizontal size={16} className="text-gray-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 w-52">
            <button onClick={() => { close(); onCredit(user) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 font-medium text-gray-700 transition-colors">
              Credit Wallet
            </button>
            <button onClick={() => { close(); onDebit(user) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 font-medium text-red-600 transition-colors">
              Debit Wallet
            </button>
            <Link to={`/admin/users/${user._id}/pricing`} onClick={close}
              className="block px-4 py-2.5 text-sm hover:bg-gray-50 font-medium text-gray-700 transition-colors">
              Manage Pricing
            </Link>
            {user.isSpecial && (
              <button onClick={() => { close(); onRemoveSpecial(user) }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 font-medium text-orange-600 transition-colors">
                Remove Special Pricing
              </button>
            )}
            <button onClick={() => { close(); onChangeType(user) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 font-medium text-gray-700 transition-colors">
              Change User Type
            </button>
            <button onClick={() => { close(); onReset(user) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 font-medium text-gray-700 transition-colors">
              Reset PIN / Password
            </button>
            <div className="border-t border-gray-100 mx-2 my-1" />
            <button onClick={() => { close(); onToggleSuspend(user) }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 font-medium transition-colors ${user.isSuspended ? 'text-gray-700' : 'text-red-600'}`}>
              {user.isSuspended ? 'Unsuspend User' : 'Suspend User'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function AdminUsers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [userType, setUserType] = useState('')
  const [isSpecial, setIsSpecial] = useState('')
  const [page, setPage] = useState(1)
  const [creditModal, setCreditModal] = useState(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [debitModal, setDebitModal] = useState(null)
  const [debitAmount, setDebitAmount] = useState('')
  const [debitReason, setDebitReason] = useState('')
  const [resetModal, setResetModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [typeModal, setTypeModal] = useState(null)
  const [selectedType, setSelectedType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, userType, isSpecial],
    queryFn: () => adminService.getUsers({ page, limit: 20, search, userType: userType || undefined, isSpecial: isSpecial || undefined }).then(r => r.data),
    keepPreviousData: true,
  })

  const { mutate: toggleSuspend } = useMutation({
    mutationFn: ({ id, isSuspended }) => adminService.updateUser(id, { isSuspended }),
    onSuccess: () => { toast.success('Updated!'); qc.invalidateQueries(['admin-users']) },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: credit, isPending: crediting } = useMutation({
    mutationFn: adminService.creditUser,
    onSuccess: ({ data: d }) => {
      toast.success(d.msg || 'Credited!')
      setCreditModal(null)
      setCreditAmount('')
      qc.invalidateQueries(['admin-users'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: debit, isPending: debiting } = useMutation({
    mutationFn: adminService.debitUser,
    onSuccess: ({ data: d }) => {
      toast.success(d.msg || 'Debited!')
      setDebitModal(null)
      setDebitAmount('')
      setDebitReason('')
      qc.invalidateQueries(['admin-users'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: changeType, isPending: changingType } = useMutation({
    mutationFn: ({ id, userType }) => adminService.updateUser(id, { userType }),
    onSuccess: () => { toast.success('User type updated'); setTypeModal(null); qc.invalidateQueries(['admin-users']) },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: removeSpecial } = useMutation({
    mutationFn: (id) => adminService.setSpecialPricing(id, { prices: [] }),
    onSuccess: () => { toast.success('Special pricing removed'); qc.invalidateQueries(['admin-users']) },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: resetPin, isPending: resettingPin } = useMutation({
    mutationFn: (id) => adminService.resetUserPin(id),
    onSuccess: ({ data: d }) => { toast.success(d.msg); qc.invalidateQueries(['admin-users']) },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: resetPassword, isPending: resettingPw } = useMutation({
    mutationFn: ({ id, newPassword }) => adminService.resetUserPassword(id, { newPassword }),
    onSuccess: ({ data: d }) => { toast.success(d.msg); setResetModal(null); setNewPassword('') },
    onError: (err) => toast.error(errMsg(err)),
  })

  const users = data?.users || []
  const total = data?.total || 0
  const pages = Math.ceil(total / 20)
  const adminBalance = data?.adminBalance ?? null
  const totalUserBalance = data?.totalUserBalance ?? null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-900">Users</h2>
        <div className="flex gap-3 flex-wrap">
          <Input
            placeholder="Search by email or username…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-56"
          />
          <Select value={userType} onChange={e => { setUserType(e.target.value); setPage(1) }} className="w-40">
            <option value="">All types</option>
            <option value="user">Smart Earner</option>
            <option value="reseller">Reseller</option>
            <option value="api user">API User</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </Select>
          <Select value={isSpecial} onChange={e => { setIsSpecial(e.target.value); setPage(1) }} className="w-44">
            <option value="">All pricing</option>
            <option value="true">Special pricing only</option>
          </Select>
        </div>
      </div>

      {/* Balance summary */}
      {adminBalance !== null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-indigo-50 flex-shrink-0">
              <Wallet size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Your Balance</p>
              <p className="text-xl font-extrabold text-gray-900">{naira(adminBalance)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Available to credit users</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-emerald-50 flex-shrink-0">
              <Users size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total User Wallets</p>
              <p className="text-xl font-extrabold text-gray-900">{naira(totalUserBalance)}</p>
              <p className="text-xs text-gray-400 mt-0.5">Combined balance held by users</p>
            </div>
          </div>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Th>User</Table.Th>
                  <Table.Th>Phone</Table.Th>
                  <Table.Th>Balance</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {users.map(u => (
                  <Table.Row key={u._id}>
                    <Table.Td>
                      <div>
                        <p className="font-medium text-gray-900">{u.userName}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </Table.Td>
                    <Table.Td className="text-gray-500">{u.phoneNumber}</Table.Td>
                    <Table.Td>
                      <span className="font-semibold text-gray-900">{naira(u.balance)}</span>
                    </Table.Td>
                    <Table.Td>
                      <div className="flex flex-col gap-1">
                        <Badge variant="primary">{u.userType === 'user' ? 'Smart Earner' : u.userType}</Badge>
                        {u.isSpecial && <Badge variant="warning">Special</Badge>}
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant={u.isSuspended ? 'danger' : 'success'}>
                        {u.isSuspended ? 'Suspended' : 'Active'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <ActionMenu
                        user={u}
                        onCredit={setCreditModal}
                        onDebit={setDebitModal}
                        onToggleSuspend={(u) => toggleSuspend({ id: u._id, isSuspended: !u.isSuspended })}
                        onReset={setResetModal}
                        onRemoveSpecial={(u) => removeSpecial(u._id)}
                        onChangeType={(u) => { setTypeModal(u); setSelectedType(u.userType) }}
                      />
                    </Table.Td>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Page {page} of {pages} • {total} users</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Credit modal */}
      <Modal open={!!creditModal} onClose={() => { setCreditModal(null); setCreditAmount('') }} title={`Credit Wallet — ${creditModal?.userName}`}>
        <div className="space-y-4">
          {adminBalance !== null && (
            <div className="px-3 py-2.5 rounded-xl bg-gray-50 text-sm text-gray-600">
              Your available balance: <span className="font-bold text-gray-900">{naira(adminBalance)}</span>
            </div>
          )}
          <Input
            label="Amount (₦)"
            type="number"
            min="1"
            placeholder="1000"
            value={creditAmount}
            onChange={e => setCreditAmount(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setCreditModal(null); setCreditAmount('') }}>Cancel</Button>
            <Button
              loading={crediting}
              disabled={!creditAmount || Number(creditAmount) <= 0}
              onClick={() => credit({ userId: creditModal._id, amount: Number(creditAmount) })}>
              Credit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Debit modal */}
      <Modal open={!!debitModal} onClose={() => { setDebitModal(null); setDebitAmount(''); setDebitReason('') }} title={`Debit Wallet — ${debitModal?.userName}`}>
        <div className="space-y-4">
          <Input
            label="Amount (₦)"
            type="number"
            min="1"
            placeholder="1000"
            value={debitAmount}
            onChange={e => setDebitAmount(e.target.value)}
          />
          <Input
            label="Reason (optional)"
            placeholder="e.g. reversal, correction…"
            value={debitReason}
            onChange={e => setDebitReason(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setDebitModal(null); setDebitAmount(''); setDebitReason('') }}>Cancel</Button>
            <Button
              variant="danger"
              loading={debiting}
              disabled={!debitAmount || Number(debitAmount) <= 0}
              onClick={() => debit({ userId: debitModal._id, amount: Number(debitAmount), reason: debitReason })}>
              Debit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change type modal */}
      <Modal open={!!typeModal} onClose={() => setTypeModal(null)} title={`Change Type — ${typeModal?.userName}`}>
        <div className="space-y-4">
          <Select label="User type" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
            <option value="user">Smart Earner</option>
            <option value="reseller">Reseller</option>
            <option value="api user">API User</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </Select>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setTypeModal(null)}>Cancel</Button>
            <Button
              loading={changingType}
              disabled={selectedType === typeModal?.userType}
              onClick={() => changeType({ id: typeModal._id, userType: selectedType })}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset modal */}
      <Modal open={!!resetModal} onClose={() => { setResetModal(null); setNewPassword('') }} title={`Reset — ${resetModal?.userName}`}>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Transaction PIN</p>
            <p className="text-xs text-gray-500">{resetModal?.pinEnabled ? 'PIN is currently enabled.' : 'PIN is not set.'}</p>
            <Button size="sm" variant="danger" loading={resettingPin} disabled={!resetModal?.pinEnabled}
              onClick={() => resetPin(resetModal._id)}>
              Clear PIN
            </Button>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Set New Password</p>
            <Input label="New password" type="password" placeholder="Min 6 characters" value={newPassword}
              onChange={e => setNewPassword(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setResetModal(null); setNewPassword('') }}>Cancel</Button>
              <Button loading={resettingPw} disabled={newPassword.length < 6}
                onClick={() => resetPassword({ id: resetModal._id, newPassword })}>
                Set Password
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
