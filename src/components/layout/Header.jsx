import { useEffect, useState } from 'react'
import {
  BellIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { notificationsApi } from '../../api/notifications'
import { useTheme } from '../../contexts/ThemeContext'

const POLL_INTERVAL_MS = 30_000

function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export default function Header({ onMenuClick }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
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
    setUnreadCount(0)
    navigate('/notifications')
  }

  return (
    <header className="fixed top-0 left-0 lg:left-[260px] right-0 h-16 z-20
                        bg-white/90 dark:bg-gray-900/90 backdrop-blur-md
                        border-b border-slate-200/80 dark:border-gray-800/80
                        flex items-center justify-between px-4 sm:px-6
                        transition-colors duration-300">
      {/* Left — hamburger on mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-slate-400 transition-colors"
          aria-label="Open sidebar"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        {/* Subtle brand on mobile */}
        <span className="lg:hidden text-sm font-semibold text-slate-700 dark:text-slate-200">TalentSphere</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button
          onClick={handleBellClick}
          className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-150"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-[18px] min-w-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none animate-fade-in">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all duration-150 ml-1"
          aria-label="Profile"
        >
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block max-w-[120px] truncate">
            {user?.name}
          </span>
        </button>
      </div>
    </header>
  )
}
