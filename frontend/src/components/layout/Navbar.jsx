import { Menu, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/admin.service'
import { useAuth } from '../../context/AuthContext'
import { naira } from '../../services/api'

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth()
  const isAdmin = user?.userType === 'admin'

  const { data } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => adminService.getUnreadCount().then(r => r.data),
    enabled: isAdmin,
    refetchInterval: 30_000,
  })

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
          <Menu size={20} />
        </button>
        <h1 className="font-semibold text-gray-800 text-base hidden sm:block">
          {isAdmin ? 'Admin Panel' : 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {!isAdmin && (
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500">Balance</p>
            <p className="font-bold text-gray-800 text-sm">{naira(user?.balance ?? 0)}</p>
          </div>
        )}

        {isAdmin && (
          <Link to="/admin/notifications" className="relative p-2 rounded-lg hover:bg-gray-100">
            <Bell size={20} className="text-gray-600" />
            {data?.count > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-medium">
                {data.count > 9 ? '9+' : data.count}
              </span>
            )}
          </Link>
        )}

        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
          {user?.userName?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  )
}
