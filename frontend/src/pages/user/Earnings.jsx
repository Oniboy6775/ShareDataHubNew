import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/auth.service'
import { naira } from '../../services/api'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Spinner from '../../components/ui/Spinner'
import { Users, TrendingUp } from 'lucide-react'

export default function Earnings() {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['profile-full'],
    queryFn: () => authService.getProfile().then(r => r.data.user),
  })

  const referrals = data?.referrals || []

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Earnings</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Earning Balance</p>
              <p className="text-xl font-bold text-gray-900">{naira(user?.earningBalance ?? 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Referrals</p>
              <p className="text-xl font-bold text-gray-900">{referrals.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <Card.Header>Referral History</Card.Header>
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : referrals.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">No referrals yet. Share your link to start earning.</div>
        ) : (
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.Th>User</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Earned</Table.Th>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {referrals.map((r, i) => (
                <Table.Row key={i}>
                  <Table.Td className="font-medium">{r.userName}</Table.Td>
                  <Table.Td className="text-gray-500">{r.email}</Table.Td>
                  <Table.Td className="font-medium text-green-600">{naira(r.amountEarn)}</Table.Td>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>
    </div>
  )
}
