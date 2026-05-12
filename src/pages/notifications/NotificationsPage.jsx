// Notifications Page
//
// Shows in-app notifications for the logged-in user, with a button to
// mark a single notification as read or to mark all of them at once.

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { CheckIcon, CheckCircleIcon, BellIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { notificationsApi } from '../../api/notifications'
import { useAuth } from '../../contexts/AuthContext'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'

// Color classes for each notification category pill.
const CATEGORY_COLOR_CLASSES = {
  System: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  Recruitment: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  Interview: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  Performance: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  Training: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  Compliance: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  Career: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  Application: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  Offer: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  General: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
}

const DEFAULT_CATEGORY_COLOR =
  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'

export default function NotificationsPage() {
  const { user } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  // -----------------------------------------------------------------
  // API call: load the user's notifications.
  // -----------------------------------------------------------------
  const fetchNotifications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const list = await notificationsApi.getByUser(user.userId)
      setNotifications(list)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load when the user becomes available.
  useEffect(() => {
    fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // -----------------------------------------------------------------
  // Handler: mark a single notification as read.
  //
  // We update local state in place so the UI updates instantly
  // without needing a full reload.
  // -----------------------------------------------------------------
  const handleMarkOneAsRead = async (notificationId) => {
    try {
      await notificationsApi.markRead(notificationId)

      setNotifications((previousList) =>
        previousList.map((notification) => {
          if (notification.notificationID === notificationId) {
            return { ...notification, status: 'Read' }
          }
          return notification
        })
      )
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  // -----------------------------------------------------------------
  // Handler: mark ALL notifications as read.
  // -----------------------------------------------------------------
  const handleMarkAllAsRead = async () => {
    if (!user) return

    setIsMarkingAll(true)
    try {
      await notificationsApi.markAllRead(user.userId)

      // Flip every notification to Read locally.
      setNotifications((previousList) =>
        previousList.map((notification) => ({
          ...notification,
          status: 'Read',
        }))
      )

      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    } finally {
      setIsMarkingAll(false)
    }
  }

  // Count of unread notifications used by the page header.
  const unreadCount = notifications.filter(
    (notification) => notification.status === 'Unread'
  ).length

  // Header subtitle text.
  const subtitle =
    unreadCount > 0
      ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
      : 'All caught up!'

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={subtitle}
        actions={
          unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              loading={isMarkingAll}
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              onClick={handleMarkAllAsRead}
            >
              Mark All Read
            </Button>
          )
        }
      />

      {isLoading ? (
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
          {notifications.map((notification) => {
            const categoryColor =
              CATEGORY_COLOR_CLASSES[notification.category] ?? DEFAULT_CATEGORY_COLOR
            const isUnread = notification.status === 'Unread'
            const formattedDate = format(
              new Date(notification.createdAt),
              'MMM d, yyyy HH:mm'
            )

            return (
              <div
                key={notification.notificationID}
                className={clsx(
                  'card p-4 flex items-start gap-4 transition-colors',
                  isUnread
                    ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-900/10'
                    : 'bg-white dark:bg-gray-900'
                )}
              >
                {/* Category icon circle */}
                <div
                  className={clsx(
                    'flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center',
                    categoryColor
                  )}
                >
                  <BellIcon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={clsx(
                        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
                        categoryColor
                      )}
                    >
                      {notification.category}
                    </span>
                    <StatusBadge status={notification.status} />
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                      {formattedDate}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {/* "Mark as read" button — only when unread */}
                {isUnread && (
                  <button
                    onClick={() => handleMarkOneAsRead(notification.notificationID)}
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
