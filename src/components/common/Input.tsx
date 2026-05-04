import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              'input',
              error && 'input-error border-rose-400 dark:border-rose-500 focus:ring-rose-500 pr-10',
              className
            )}
            {...props}
          />
          {error && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ExclamationCircleIcon className="h-4 w-4 text-rose-500" />
            </div>
          )}
        </div>
        {error && (
          <p className="form-error">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{hint}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
