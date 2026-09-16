import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-teal text-white hover:bg-teal/90',
  secondary: 'bg-white border border-gray-200 text-navy hover:bg-gray-50',
  danger: 'bg-danger text-white hover:bg-danger/90',
}
const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm' }

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
