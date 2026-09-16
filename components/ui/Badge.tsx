type BadgeVariant = 'teal' | 'navy' | 'warning' | 'danger' | 'gray'

const variants: Record<BadgeVariant, string> = {
  teal: 'bg-teal/10 text-teal',
  navy: 'bg-navy/10 text-navy',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  gray: 'bg-gray-100 text-sub',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
}

export function Badge({ variant = 'gray', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
