import clsx from 'clsx'

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
  xl: 'h-12 w-12 border-[3px]',
}

export default function LoadingSpinner({ size = 'md', className }: Props) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-slate-200 dark:border-gray-700 border-t-indigo-600 dark:border-t-indigo-400',
        sizeMap[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Loading…</p>
    </div>
  )
}
