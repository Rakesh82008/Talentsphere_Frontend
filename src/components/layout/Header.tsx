import { useEffect, useState } from 'react'
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { notificationsApi } from '../../api/notifications'

const POLL_INTERVAL_MS = 30_000

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnread = async () => {
    if (!user) return
    try {
      const notifications = await notificationsApi.getByUser(user.userId)
      setUnreadCount(notifications.filter((n) => n.status === 'Unread').length)
    } catch {
      // silently ignore — don't spam the user with errors on background polls
    }
  }

  useEffect(() => {
    fetchUnread()
    const id = setInterval(fetchUnread, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [user])

  const handleBellClick = () => {
    setUnreadCount(0) // optimistically clear badge when user opens notifications
    navigate('/notifications')
  }

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20">
      <div />
      <div className="flex items-center gap-3">
        <button
          onClick={handleBellClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <UserCircleIcon className="h-6 w-6 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user?.name}
          </span>
        </button>
      </div>
    </header>
  )
}
