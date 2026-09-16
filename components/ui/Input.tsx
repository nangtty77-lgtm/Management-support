import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-navy">{label}</label>}
      <input
        ref={ref}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal ${
          error ? 'border-danger' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
