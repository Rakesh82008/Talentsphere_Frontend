import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

export default function Pagination({ page, totalPages, onPageChange, totalCount, pageSize }) {
  if (totalPages <= 1) return null

  const from = pageSize ? (page - 1) * pageSize + 1 : undefined
  const to   = pageSize && totalCount ? Math.min(page * pageSize, totalCount) : undefined

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = [1]
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-100 dark:border-gray-800">
      {totalCount !== undefined ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{from}</span>–
          <span className="font-semibold text-slate-700 dark:text-slate-300">{to}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{totalCount}</span> results
        </p>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Page <span className="font-semibold text-slate-700 dark:text-slate-300">{page}</span> of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">{totalPages}</span>
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {getPages().map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="min-w-[32px] h-8 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={clsx(
                'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
