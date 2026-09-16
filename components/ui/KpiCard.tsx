interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  color?: 'indigo' | 'teal' | 'danger' | 'warning' | 'navy' | 'success' | 'blue'
  icon?: React.ReactNode
}

const colors = {
  indigo:  { text: 'text-indigo-600', bg: 'bg-indigo-50' },
  teal:    { text: 'text-indigo-600', bg: 'bg-indigo-50' },
  danger:  { text: 'text-red-600',    bg: 'bg-red-50' },
  warning: { text: 'text-amber-600',  bg: 'bg-amber-50' },
  navy:    { text: 'text-slate-700',  bg: 'bg-slate-100' },
  success: { text: 'text-emerald-600',bg: 'bg-emerald-50' },
  blue:    { text: 'text-blue-600',   bg: 'bg-blue-50' },
}

export function KpiCard({ label, value, sub, color = 'navy', icon }: KpiCardProps) {
  const c = colors[color]
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${c.text}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      {icon && (
        <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.text} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      )}
    </div>
  )
}
