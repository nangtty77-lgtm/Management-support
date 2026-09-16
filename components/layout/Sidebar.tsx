'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navSections = [
  {
    label: 'Core',
    items: [{ href: '/dashboard', label: '대시보드', icon: '⊞' }],
  },
  {
    label: 'HR',
    items: [
      { href: '/employees', label: '직원관리', icon: '👤' },
      { href: '/leaves', label: '연차관리', icon: '📅' },
    ],
  },
  {
    label: '총무',
    items: [{ href: '/contracts', label: '계약관리', icon: '📄' }],
  },
  {
    label: '업무',
    items: [{ href: '/tasks', label: '업무관리', icon: '✓' }],
  },
  {
    label: '알림',
    items: [{ href: '/notifications', label: '알림센터', icon: '🔔' }],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-[190px] min-h-screen bg-navy flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
        <div className="w-7 h-7 rounded bg-teal flex items-center justify-center">
          <span className="text-navy font-bold text-xs">B</span>
        </div>
        <span className="text-white font-bold text-base">BizHub</span>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-5 text-xs text-white/40 font-medium uppercase tracking-wider mb-1">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-teal/20 text-teal font-medium border-l-2 border-teal'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
