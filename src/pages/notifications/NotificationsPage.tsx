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
  System: 'bg-orange-100 text-orange-700',
  Recruitment: 'bg-blue-100 text-blue-700',
  Interview: 'bg-purple-100 text-purple-700',
  Performance: 'bg-yellow-100 text-yellow-700',
  Training: 'bg-teal-100 text-teal-700',
  Compliance: 'bg-red-100 text-red-700',
  Career: 'bg-indigo-100 text-indigo-700',
  Application: 'bg-blue-100 text-blue-700',
  Offer: 'bg-emerald-100 text-emerald-700',
  General: 'bg-gray-100 text-gray-700',
}

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
        subtitle={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        actions={unreadCount > 0 && (
          <Button variant="secondary" size="sm" loading={markingAll} leftIcon={<CheckCircleIcon className="h-4 w-4" />} onClick={markAllRead}>
            Mark All Read
          </Button>
        )}
      />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState title="No notifications" description="You're all caught up! New notifications will appear here." icon={<BellIcon className="h-8 w-8 text-gray-400" />} />
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.notificationID}
              className={clsx(
                'card p-4 flex items-start gap-4 transition-colors',
                n.status === 'Unread' ? 'border-blue-200 bg-blue-50' : ''
              )}
            >
              <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${categoryColors[n.category] ?? 'bg-gray-100 text-gray-700'}`}>
                <BellIcon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryColors[n.category] ?? 'bg-gray-100 text-gray-700'}`}>{n.category}</span>
                  <StatusBadge status={n.status} />
                  <span className="text-xs text-gray-400 ml-auto">{format(new Date(n.createdAt), 'MMM d, yyyy HH:mm')}</span>
                </div>
                <p className="text-sm text-gray-700">{n.message}</p>
              </div>

              {n.status === 'Unread' && (
                <button
                  onClick={() => markRead(n.notificationID)}
                  className="flex-shrink-0 p-1.5 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                  title="Mark as read"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
