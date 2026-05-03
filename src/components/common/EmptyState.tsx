import type { ReactNode } from 'react'
import { InboxIcon } from '@heroicons/react/24/outline'

interface Props {
  title?: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export default function EmptyState({
  title = 'No data found',
  description = 'Get started by creating a new record.',
  action,
  icon,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
        {icon ?? <InboxIcon className="h-8 w-8 text-gray-400" />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
