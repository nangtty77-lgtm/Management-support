import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { VisitResultForm } from './VisitResultForm'

const STATUS_LABEL: Record<string, string> = {
  PLANNED: '계획', COMPLETED: '완료', DELAYED: '지연', CANCELLED: '취소',
}
const STATUS_COLOR: Record<string, string> = {
  PLANNED: 'bg-indigo-50 text-indigo-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  DELAYED: 'bg-amber-50 text-amber-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default async function VisitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return null
  const { id } = await params

  const visit = await db.visit.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      assignee: { select: { name: true } },
    },
  })
  if (!visit) return notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Link href="/crm/visits" className="hover:text-indigo-600">방문관리</Link>
            <span>/</span>
            <span>{visit.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{visit.title}</h1>
          <Link href={`/crm/customers/${visit.customer.id}`} className="text-sm text-indigo-600 hover:underline mt-0.5 block">
            {visit.customer.companyName || visit.customer.name}
          </Link>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[visit.status]}`}>
          {STATUS_LABEL[visit.status]}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">방문 정보</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400 text-xs">방문일시</dt>
            <dd className="text-slate-700 font-medium mt-0.5">{visit.visitDate.toLocaleString('ko-KR')}</dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs">담당자</dt>
            <dd className="text-slate-700 font-medium mt-0.5">{visit.assignee?.name ?? '—'}</dd>
          </div>
        </dl>
        {visit.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">메모</p>
            <p className="text-sm text-slate-700">{visit.notes}</p>
          </div>
        )}
      </div>

      {/* Result */}
      {visit.status === 'COMPLETED' && visit.result ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-3">방문 결과</h2>
          <p className="text-sm text-slate-700">{visit.result}</p>
          {visit.nextAction && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-1">다음 액션</p>
              <p className="text-sm text-slate-700">{visit.nextAction}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">방문 결과 입력</h2>
          <VisitResultForm visitId={id} currentStatus={visit.status} />
        </div>
      )}
    </div>
  )
}
