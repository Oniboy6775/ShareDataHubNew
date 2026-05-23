import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'
import { authService } from '../../services/auth.service'
import { errMsg, naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Spinner from '../../components/ui/Spinner'

export default function AdminCoupons() {
  const qc = useQueryClient()
  const [genModal, setGenModal] = useState(false)
  const [genForm, setGenForm] = useState({ amount: '', count: 1 })
  const [redeemCode, setRedeemCode] = useState('')

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminService.getCoupons().then(r => r.data.coupons),
  })

  const { mutate: redeem, isPending: redeeming } = useMutation({
    mutationFn: (code) => authService.redeemCoupon({ couponCode: code }),
    onSuccess: ({ data: d }) => {
      toast.success(d.msg || 'Wallet funded!')
      setRedeemCode('')
      qc.invalidateQueries(['admin-coupons'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: generate, isPending: generating } = useMutation({
    mutationFn: adminService.generateCoupon,
    onSuccess: ({ data: d }) => {
      toast.success(d.msg || 'Coupon(s) generated!')
      setGenModal(false)
      setGenForm({ amount: '', count: 1 })
      qc.invalidateQueries(['admin-coupons'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Coupons</h2>
        <Button onClick={() => setGenModal(true)}>Generate Coupon</Button>
      </div>

      {/* Redeem coupon */}
      <Card>
        <Card.Header>Redeem Coupon to Wallet</Card.Header>
        <Card.Body>
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={redeemCode}
              onChange={e => setRedeemCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button
              loading={redeeming}
              disabled={!redeemCode.trim()}
              onClick={() => redeem(redeemCode.trim())}
            >
              Redeem
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : (
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Th>Code</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Owner</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {coupons.map(c => (
                <Table.Row key={c._id}>
                  <Table.Td><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{c.couponCode}</code></Table.Td>
                  <Table.Td className="font-medium">{naira(c.amount)}</Table.Td>
                  <Table.Td className="text-gray-500">{c.couponOwner || '—'}</Table.Td>
                  <Table.Td>
                    <Badge variant={c.isUsed ? 'default' : 'success'}>
                      {c.isUsed ? 'Used' : 'Available'}
                    </Badge>
                  </Table.Td>
                  <Table.Td className="text-xs text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </Table.Td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      <Modal open={genModal} onClose={() => setGenModal(false)} title="Generate Coupons">
        <div className="space-y-4">
          <Input
            label="Amount per coupon (₦)"
            type="number"
            min="1"
            placeholder="500"
            value={genForm.amount}
            onChange={e => setGenForm(p => ({ ...p, amount: e.target.value }))}
          />
          <Input
            label="Number of coupons"
            type="number"
            min="1"
            max="50"
            value={genForm.count}
            onChange={e => setGenForm(p => ({ ...p, count: Number(e.target.value) }))}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setGenModal(false)}>Cancel</Button>
            <Button
              loading={generating}
              disabled={!genForm.amount}
              onClick={() => generate({ amount: Number(genForm.amount), count: genForm.count })}
            >
              Generate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
