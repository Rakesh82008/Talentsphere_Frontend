import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { CheckIcon, CheckCircleIcon, BellIcon } from '@heroicons/react/24/outline'
import { notificationsApi } from '../../api/notifications'
import type { NotificationResponse } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'
import clsx from 'clsx'
import { format } from 'date-fns'

const categoryColors: Record<string, string> = {
  System:      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  Recruitment: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  Interview:   'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  Performance: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  Training:    'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  Compliance:  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  Career:      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  Application: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  Offer:       'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  General:     'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
}

const fallbackColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      setNotifications(await notificationsApi.getByUser(user.userId))
    } catch { toast.error('Failed to load notifications') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user])

  const markRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id)
      setNotifications((prev) => prev.map((n) => n.notificationID === id ? { ...n, status: 'Read' } : n))
    } catch { toast.error('Failed to mark as read') }
  }

  const markAllRead = async () => {
    if (!user) return
    setMarkingAll(true)
    try {
      await notificationsApi.markAllRead(user.userId)
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'Read' as const })))
      toast.success('All notifications marked as read')
    } catch { toast.error('Failed to mark all as read') }
    finally { setMarkingAll(false) }
  }

  const unreadCount = notifications.filter((n) => n.status === 'Unread').length

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
            : 'All caught up!'
        }
        actions={
          unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={markingAll}
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              onClick={markAllRead}
            >
              Mark All Read
            </Button>
          )
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No notifications"
            description="You're all caught up! New notifications will appear here."
            icon={<BellIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const catColor = categoryColors[n.category] ?? fallbackColor
            const isUnread = n.status === 'Unread'
            return (
              <div
                key={n.notificationID}
                className={clsx(
                  'card p-4 flex items-start gap-4 transition-colors',
                  isUnread
                    ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/10'
                    : 'bg-white dark:bg-gray-900'
                )}
              >
                {/* Category icon */}
                <div className={clsx('flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center', catColor)}>
                  <BellIcon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', catColor)}>
                      {n.category}
                    </span>
                    <StatusBadge status={n.status} />
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                      {format(new Date(n.createdAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {/* Mark read button */}
                {isUnread && (
                  <button
                    onClick={() => markRead(n.notificationID)}
                    className="flex-shrink-0 p-1.5 rounded-lg text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                    title="Mark as read"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
