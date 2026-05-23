import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Megaphone, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { adminService } from '../../services/admin.service'
import { errMsg } from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'

const TYPE_STYLES = {
  info:    'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  danger:  'bg-red-50 border-red-200 text-red-800',
}

export default function AdminBroadcast() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ title: '', message: '', type: 'info' })

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ['admin-broadcasts'],
    queryFn: () => adminService.getBroadcasts().then(r => r.data.broadcasts),
  })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: adminService.createBroadcast,
    onSuccess: () => {
      toast.success('Broadcast sent!')
      setForm({ title: '', message: '', type: 'info' })
      qc.invalidateQueries(['admin-broadcasts'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: toggle } = useMutation({
    mutationFn: adminService.toggleBroadcast,
    onSuccess: () => qc.invalidateQueries(['admin-broadcasts']),
    onError: (err) => toast.error(errMsg(err)),
  })

  const { mutate: remove } = useMutation({
    mutationFn: adminService.deleteBroadcast,
    onSuccess: () => {
      toast.success('Deleted')
      qc.invalidateQueries(['admin-broadcasts'])
    },
    onError: (err) => toast.error(errMsg(err)),
  })

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-gray-900">Broadcast Announcements</h2>

      {/* Create */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Megaphone size={18} className="text-primary" />
            New Announcement
          </div>
        </Card.Header>
        <Card.Body className="space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Scheduled maintenance"
            value={form.title}
            onChange={set('title')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={3}
              placeholder="Write the announcement body…"
              value={form.message}
              onChange={set('message')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={set('type')}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="info">Info (blue)</option>
              <option value="warning">Warning (yellow)</option>
              <option value="success">Success (green)</option>
              <option value="danger">Danger (red)</option>
            </select>
          </div>

          {/* Preview */}
          {(form.title || form.message) && (
            <div className={`border rounded-xl p-4 text-sm ${TYPE_STYLES[form.type]}`}>
              {form.title && <p className="font-semibold mb-0.5">{form.title}</p>}
              {form.message && <p>{form.message}</p>}
            </div>
          )}

          <Button
            loading={creating}
            onClick={() => {
              if (!form.title || !form.message) return toast.error('Title and message are required')
              create(form)
            }}
          >
            Publish Announcement
          </Button>
        </Card.Body>
      </Card>

      {/* List */}
      <Card>
        <Card.Header>Published Announcements</Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : broadcasts.length === 0 ? (
            <p className="text-center text-gray-400 py-6 text-sm">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {broadcasts.map(b => (
                <div
                  key={b._id}
                  className={`border rounded-xl p-4 flex gap-3 items-start ${b.isActive ? TYPE_STYLES[b.type] : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm truncate">{b.title}</p>
                      <Badge variant={b.isActive ? 'success' : 'default'} className="shrink-0">
                        {b.isActive ? 'Live' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm">{b.message}</p>
                    <p className="text-xs mt-1 opacity-60">{new Date(b.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => toggle(b._id)}
                      title={b.isActive ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                    >
                      {b.isActive
                        ? <ToggleRight size={20} className="text-green-600" />
                        : <ToggleLeft size={20} className="text-gray-400" />
                      }
                    </button>
                    <button
                      onClick={() => remove(b._id)}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
