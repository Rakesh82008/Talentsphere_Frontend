import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variants = {
  primary:   'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 focus:ring-indigo-500 shadow-sm hover:shadow-md',
  secondary: 'bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 focus:ring-slate-400 shadow-sm',
  danger:    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-sm hover:shadow-md',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500 shadow-sm hover:shadow-md',
  ghost:     'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800 focus:ring-slate-400',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-2.5 text-base rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" className={variant === 'secondary' || variant === 'ghost' ? 'border-t-slate-600 dark:border-t-slate-300' : 'border-t-white'} />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
