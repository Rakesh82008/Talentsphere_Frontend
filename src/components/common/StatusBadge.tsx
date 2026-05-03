import clsx from 'clsx'

interface Props {
  status: string
  className?: string
}

const colorMap: Record<string, string> = {
  // Application
  Pending: 'bg-yellow-100 text-yellow-800',
  Submitted: 'bg-blue-100 text-blue-800',
  Reviewed: 'bg-purple-100 text-purple-800',
  Accepted: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',

  // Job
  Open: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-700',

  // Interview
  Scheduled: 'bg-blue-100 text-blue-800',
  Completed: 'bg-green-100 text-green-800',
  Passed: 'bg-emerald-100 text-emerald-800',
  Failed: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-100 text-gray-700',

  // Screening
  Pass: 'bg-green-100 text-green-800',
  Fail: 'bg-red-100 text-red-800',

  // Selection
  Selected: 'bg-emerald-100 text-emerald-800',

  // Employee
  Active: 'bg-green-100 text-green-800',
  OnLeave: 'bg-yellow-100 text-yellow-800',
  Inactive: 'bg-gray-100 text-gray-700',
  Terminated: 'bg-red-100 text-red-800',

  // Training / Enrollment
  InProgress: 'bg-blue-100 text-blue-800',

  // Career Plan
  Planned: 'bg-indigo-100 text-indigo-800',
  OnHold: 'bg-orange-100 text-orange-800',

  // Audit
  Archived: 'bg-gray-100 text-gray-700',

  // Resume / Doc
  Approved: 'bg-green-100 text-green-800',
  Verified: 'bg-green-100 text-green-800',

  // Notifications
  Unread: 'bg-blue-100 text-blue-800',
  Read: 'bg-gray-100 text-gray-700',

  // User
  Suspended: 'bg-orange-100 text-orange-800',
  Deleted: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status, className }: Props) {
  const colors = colorMap[status] ?? 'bg-gray-100 text-gray-700'
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        colors,
        className
      )}
    >
      {status}
    </span>
  )
}
