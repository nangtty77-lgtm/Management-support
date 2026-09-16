import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const GRADE_LABEL: Record<string, string> = {
  VIP: 'VIP', PREMIUM: '프리미엄', NORMAL: '일반', INACTIVE: '비활성',
}
const GRADE_BADGE: Record<string, 'danger' | 'warning' | 'teal' | 'gray'> = {
  VIP: 'danger', PREMIUM: 'warning', NORMAL: 'teal', INACTIVE: 'gray',
}
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '활성', INACTIVE: '비활성', PROSPECT: '잠재',
}

export default async function CustomersPage() {
  const session = await auth()
  if (!session) return null

  const customers = await db.customer.findMany({
    include: {
      assignee: { select: { name: true } },
      _count: { select: { opportunities: true, visits: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const total = customers.length
  const active = customers.filter((c) => c.status === 'ACTIVE').length
  const vip = customers.filter((c) => c.grade === 'VIP').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">고객관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">전체 {total}건 · 활성 {active}건 · VIP {vip}건</p>
        </div>
        <Link href="/crm/customers/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          고객 등록
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="text-slate-500 font-medium">등록된 고객이 없습니다</p>
            <Link href="/crm/customers/new" className="inline-block mt-3 text-sm text-indigo-600 hover:underline">+ 첫 고객 등록하기</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {customers.map((c) => (
              <Link
                key={c.id}
                href={`/crm/customers/${c.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                  {c.name[0]}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{c.name}</span>
                    <Badge variant={GRADE_BADGE[c.grade] ?? 'gray'}>{GRADE_LABEL[c.grade] ?? c.grade}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.companyName && <span>{c.companyName}</span>}
                    {c.companyName && c.industry && <span> · </span>}
                    {c.industry && <span>{c.industry}</span>}
                  </p>
                </div>
                {/* Meta */}
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-xs text-slate-500">
                    영업기회 {c._count.opportunities} · 방문 {c._count.visits}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.assignee?.name ?? '—'}</p>
                </div>
                {/* Status */}
                <div className="shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                    c.status === 'PROSPECT' ? 'bg-amber-50 text-amber-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
