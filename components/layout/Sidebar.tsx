'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    employee: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
    calendar: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
    money: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    cart: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    card: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    building: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M6 21V7l6-4 6 4v14M9 21v-6h6v6"/>
      </svg>
    ),
    document: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    check: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    bell: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    crm: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    target: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    location: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    chart: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    chart2: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    box: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  }
  return <span className="shrink-0">{icons[name] ?? icons.check}</span>
}

const navSections = [
  {
    label: '실행',
    items: [
      { href: '/dashboard', label: '대시보드', icon: 'dashboard' },
      { href: '/kpi', label: 'KPI 대시보드', icon: 'chart' },
    ],
  },
  {
    label: 'HR',
    items: [
      { href: '/employees', label: '직원관리', icon: 'employee' },
      { href: '/leaves', label: '연차관리', icon: 'calendar' },
    ],
  },
  {
    label: '회계',
    items: [
      { href: '/accounting/sales', label: '매출관리', icon: 'money' },
      { href: '/accounting/purchases', label: '매입관리', icon: 'cart' },
      { href: '/accounting/expenses', label: '비용관리', icon: 'card' },
      { href: '/accounting/vendors', label: '거래처관리', icon: 'building' },
      { href: '/accounting/tax-invoices', label: '세금계산서', icon: 'document' },
    ],
  },
  {
    label: '영업',
    items: [
      { href: '/crm/customers', label: '고객관리', icon: 'crm' },
      { href: '/crm/opportunities', label: '영업기회', icon: 'target' },
      { href: '/crm/visits', label: '방문관리', icon: 'location' },
    ],
  },
  {
    label: '총무',
    items: [
      { href: '/contracts', label: '계약관리', icon: 'document' },
      { href: '/assets', label: '자산관리', icon: 'box' },
    ],
  },
  {
    label: '예산',
    items: [
      { href: '/budget', label: '예산관리', icon: 'chart' },
      { href: '/accounting/budget-report', label: '예산 vs 실적', icon: 'chart' },
      { href: '/accounting/report', label: '결산 리포트', icon: 'chart2' },
    ],
  },
  {
    label: '업무',
    items: [{ href: '/tasks', label: '업무관리', icon: 'check' }],
  },
  {
    label: '커뮤니티',
    items: [
      { href: '/notices', label: '공지사항', icon: 'bell' },
    ],
  },
  {
    label: '알림',
    items: [{ href: '/notifications', label: '알림센터', icon: 'bell' }],
  },
  {
    label: '설정',
    items: [
      { href: '/settings/profile', label: '내 프로필', icon: 'employee' },
      { href: '/settings/users', label: '사용자 관리', icon: 'crm' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-[200px] min-h-screen bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <div>
          <span className="text-slate-900 font-bold text-sm">BizHub</span>
          <p className="text-slate-400 text-[10px] leading-none">경영지원 플랫폼</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={() => (window as any).__openSearch?.()}
          className="w-full flex items-center gap-2 bg-slate-50 hover:bg-slate-100 rounded-lg px-3 py-2 text-slate-400 text-xs transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          빠른 검색
          <span className="ml-auto text-slate-300 text-[10px]">⌘K</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 pb-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-1">
            <p className="px-3 pt-3 pb-1 text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all mb-0.5 ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className={active ? 'text-indigo-600' : ''}><Icon name={item.icon} /></span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-300 text-center">© 2026 BizHub</p>
      </div>
    </aside>
  )
}
