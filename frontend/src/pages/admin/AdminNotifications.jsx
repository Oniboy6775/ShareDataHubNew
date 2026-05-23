import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { adminService } from '../../services/admin.service'
import { errMsg } from '../../services/api'
import Card from '../../components/ui/Card'
import Table from '../../components/ui/Table'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const typeVariant = { transaction: 'primary', registration: 'success', funding: 'info', failed: 'danger', refund: 'warning' }

export default function AdminNotifications() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications', page],
    queryFn: () => adminService.getNotifications({ page, limit: 30 }).then(r => r.data),
    keepPreviousData: true,
  })

  const { mutate: markRead, isPending: marking } = useMutation({
    mutationFn: (d) => adminService.markRead(d),
    onSuccess: () => {
      qc.invalidateQueries(['admin-notifications'])
      qc.invalidateQueries(['unread-count'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const notifications = data?.notifications || []
  const total = data?.total || 0
  const pages = Math.ceil(total / 30)
  const hasUnread = notifications.some(n => !n.isRead)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
        {hasUnread && (
          <Button variant="outline" size="sm" loading={marking} onClick={() => markRead({})}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No notifications.</div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {notifications.map(n => (
                <div key={n._id} className={`px-5 py-4 flex items-start gap-3 ${!n.isRead ? 'bg-primary/5' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-medium text-sm text-gray-900">{n.title}</p>
                      <Badge variant={typeVariant[n.type] || 'default'}>{n.type}</Badge>
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary inline-block" />}
                    </div>
                    <p className="text-sm text-gray-500">{n.body}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markRead({ ids: [n._id] })}
                      className="text-xs text-primary hover:underline shrink-0"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Page {page} of {pages}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
