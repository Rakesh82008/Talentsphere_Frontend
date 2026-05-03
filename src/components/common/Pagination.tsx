import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'

interface Props {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  totalCount?: number
  pageSize?: number
}

export default function Pagination({ page, totalPages, onPageChange, totalCount, pageSize }: Props) {
  if (totalPages <= 1) return null

  const from = pageSize ? (page - 1) * pageSize + 1 : undefined
  const to   = pageSize && totalCount ? Math.min(page * pageSize, totalCount) : undefined

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      {totalCount !== undefined ? (
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">{from}</span>–
          <span className="font-medium">{to}</span> of{' '}
          <span className="font-medium">{totalCount}</span> results
        </p>
      ) : (
        <p className="text-sm text-gray-600">
          Page <span className="font-medium">{page}</span> of{' '}
          <span className="font-medium">{totalPages}</span>
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
        </button>

        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const p = i + 1
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRightIcon className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
