interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'teal' | 'danger' | 'warning' | 'navy' | 'blue'
  icon?: React.ReactNode
}

const colors = {
  teal:    { text: 'text-teal',    bg: 'bg-teal/10',    border: 'border-teal/30' },
  danger:  { text: 'text-danger',  bg: 'bg-danger/10',  border: 'border-danger/30' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  navy:    { text: 'text-navy',    bg: 'bg-navy/10',    border: 'border-navy/20' },
  blue:    { text: 'text-blue-600',bg: 'bg-blue-50',    border: 'border-blue-200' },
}

export function KpiCard({ label, value, sub, color = 'navy', icon }: KpiCardProps) {
  const c = colors[color]
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-sub font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${c.text}`}>{value}</p>
        {sub && <p className="text-xs text-sub mt-1">{sub}</p>}
      </div>
      {icon && (
        <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      )}
    </div>
  )
}
