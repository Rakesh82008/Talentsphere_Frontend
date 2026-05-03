import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

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
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={clsx(
            'input',
            error && 'input-error border-red-400 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="form-error">{error}</p>}
        {!error && hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
export default Input
