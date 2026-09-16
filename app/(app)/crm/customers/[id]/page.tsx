import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const GRADE_BADGE: Record<string, 'danger' | 'warning' | 'teal' | 'gray'> = {
  VIP: 'danger', PREMIUM: 'warning', NORMAL: 'teal', INACTIVE: 'gray',
}
const GRADE_LABEL: Record<string, string> = {
  VIP: 'VIP', PREMIUM: '프리미엄', NORMAL: '일반', INACTIVE: '비활성',
}
const STAGE_LABEL: Record<string, string> = {
  LEAD: '리드', QUALIFIED: '검증', PROPOSAL: '제안', NEGOTIATION: '협상', CLOSED_WON: '수주', CLOSED_LOST: '실패',
}
const VISIT_STATUS_LABEL: Record<string, string> = {
  PLANNED: '계획', COMPLETED: '완료', DELAYED: '지연', CANCELLED: '취소',
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return null
  const { id } = await params

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      assignee: { select: { name: true } },
      opportunities: { orderBy: { createdAt: 'desc' }, take: 5 },
      visits: { orderBy: { visitDate: 'desc' }, take: 5 },
    },
  })
  if (!customer) return notFound()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
            {customer.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
              <Badge variant={GRADE_BADGE[customer.grade] ?? 'gray'}>{GRADE_LABEL[customer.grade] ?? customer.grade}</Badge>
            </div>
            {customer.companyName && <p className="text-sm text-slate-500 mt-0.5">{customer.companyName}</p>}
          </div>
        </div>
        <Link href={`/crm/customers/${id}/edit`} className="border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
          수정
        </Link>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">기본 정보</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['연락처', customer.phone],
            ['이메일', customer.email],
            ['업종', customer.industry],
            ['담당자', customer.assignee?.name],
            ['상태', customer.status === 'ACTIVE' ? '활성' : customer.status === 'PROSPECT' ? '잠재' : '비활성'],
            ['주소', customer.address],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-slate-400 text-xs">{label}</dt>
              <dd className="text-slate-700 font-medium mt-0.5">{value || '—'}</dd>
            </div>
          ))}
        </dl>
        {customer.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">메모</p>
            <p className="text-sm text-slate-700">{customer.notes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opportunities */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">영업기회</h2>
            <Link href={`/crm/opportunities/new?customerId=${id}`} className="text-xs text-indigo-600 hover:underline">+ 추가</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {customer.opportunities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">등록된 영업기회가 없습니다</p>
            ) : customer.opportunities.map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{o.title}</p>
                  <p className="text-xs text-slate-400">{STAGE_LABEL[o.stage] ?? o.stage} · {o.probability}%</p>
                </div>
                <p className="text-sm font-semibold text-indigo-600">{Number(o.amount).toLocaleString('ko-KR')}원</p>
              </div>
            ))}
          </div>
        </div>

        {/* Visits */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">방문 기록</h2>
            <Link href={`/crm/visits/new?customerId=${id}`} className="text-xs text-indigo-600 hover:underline">+ 추가</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {customer.visits.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">방문 기록이 없습니다</p>
            ) : customer.visits.map((v) => (
              <Link key={v.id} href={`/crm/visits/${v.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">{v.title}</p>
                  <p className="text-xs text-slate-400">{v.visitDate.toLocaleDateString('ko-KR')}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  v.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                  v.status === 'PLANNED' ? 'bg-indigo-50 text-indigo-700' :
                  v.status === 'DELAYED' ? 'bg-amber-50 text-amber-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {VISIT_STATUS_LABEL[v.status] ?? v.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
