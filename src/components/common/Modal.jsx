import { useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        className={clsx(
          'relative w-full rounded-2xl shadow-modal flex flex-col max-h-[90vh] animate-scale-in',
          'bg-white dark:bg-gray-900',
          'border border-slate-100 dark:border-gray-800',
          sizeMap[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-800 flex-shrink-0">
          <h2 id="modal-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0 bg-slate-50/50 dark:bg-gray-800/30 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
