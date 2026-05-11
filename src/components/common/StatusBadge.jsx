import clsx from 'clsx'

const colorMap = {
  // Application
  Pending:    'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800',
  Submitted:  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800',
  Reviewed:   'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 ring-1 ring-violet-200 dark:ring-violet-800',
  Accepted:   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
  Rejected:   'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800',

  // Job
  Open:       'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
  Closed:     'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-gray-700',

  // Interview
  Scheduled:  'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800',
  Completed:  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
  Passed:     'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
  Failed:     'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800',
  Cancelled:  'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-gray-700',

  // Screening
  Pass:       'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
  Fail:       'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800',

  // Selection
  Selected:   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',

  // Employee
  Active:     'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
  OnLeave:    'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800',
  Inactive:   'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-gray-700',
  Terminated: 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800',

  // Training / Enrollment
  InProgress: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800',

  // Career Plan
  Planned:    'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800',
  OnHold:     'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-800',

  // Audit
  Archived:   'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-gray-700',

  // Resume / Doc
  Approved:   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',
  Verified:   'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800',

  // Notifications
  Unread:     'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800',
  Read:       'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-gray-700',

  // User
  Suspended:  'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 ring-1 ring-orange-200 dark:ring-orange-800',
  Deleted:    'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800',
}

const dotMap = {
  Active: 'bg-emerald-500',
  Open: 'bg-emerald-500',
  InProgress: 'bg-blue-500',
  Scheduled: 'bg-blue-500',
  Submitted: 'bg-blue-500',
  Pending: 'bg-amber-500',
  OnLeave: 'bg-amber-500',
  Rejected: 'bg-rose-500',
  Failed: 'bg-rose-500',
  Fail: 'bg-rose-500',
  Terminated: 'bg-rose-500',
}

export default function StatusBadge({ status, className }) {
  const colors = colorMap[status] ?? 'bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-gray-700'
  const dot = dotMap[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        colors,
        className
      )}
    >
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full flex-shrink-0', dot)} />}
      {status}
    </span>
  )
}
