import { InboxIcon } from '@heroicons/react/24/outline'

export default function EmptyState({
  title = 'No data found',
  description = 'Get started by creating a new record.',
  action,
  icon,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-gray-800 mb-5">
        {icon ?? <InboxIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
