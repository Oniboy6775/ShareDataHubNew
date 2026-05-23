import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Megaphone } from 'lucide-react'
import api from '../../services/api'

const TYPE_STYLES = {
  info:    { bar: 'bg-blue-600',   bg: 'bg-blue-50   border-blue-200',  text: 'text-blue-800'   },
  warning: { bar: 'bg-yellow-500', bg: 'bg-yellow-50 border-yellow-200',text: 'text-yellow-800' },
  success: { bar: 'bg-green-600',  bg: 'bg-green-50  border-green-200', text: 'text-green-800'  },
  danger:  { bar: 'bg-red-600',    bg: 'bg-red-50    border-red-200',   text: 'text-red-800'    },
}

const STORAGE_KEY = 'aff_dismissed_broadcasts'

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function dismiss(id) {
  const d = getDismissed()
  if (!d.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...d, id]))
  }
}

export default function BroadcastBanner() {
  const [dismissed, setDismissed] = useState(getDismissed)

  const { data } = useQuery({
    queryKey: ['active-broadcasts'],
    queryFn: () => api.get('/broadcasts').then(r => r.data.broadcasts),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  const visible = (data || []).filter(b => !dismissed.includes(b._id))

  const handleDismiss = (id) => {
    dismiss(id)
    setDismissed(prev => [...prev, id])
  }

  if (!visible.length) return null

  return (
    <div className="space-y-1 px-4 pt-3 lg:px-6">
      {visible.map(b => {
        const s = TYPE_STYLES[b.type] || TYPE_STYLES.info
        return (
          <div
            key={b._id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${s.bg} ${s.text}`}
          >
            <Megaphone size={16} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              {b.title && <span className="font-semibold mr-1">{b.title}:</span>}
              {b.message}
            </div>
            <button
              onClick={() => handleDismiss(b._id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
