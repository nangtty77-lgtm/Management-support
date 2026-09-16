import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const STAGE_LABEL: Record<string, string> = {
  LEAD: '리드', QUALIFIED: '검증', PROPOSAL: '제안',
  NEGOTIATION: '협상', CLOSED_WON: '수주', CLOSED_LOST: '실패',
}
const STAGE_COLOR: Record<string, string> = {
  LEAD: 'bg-slate-100 text-slate-600',
  QUALIFIED: 'bg-blue-50 text-blue-700',
  PROPOSAL: 'bg-indigo-50 text-indigo-700',
  NEGOTIATION: 'bg-amber-50 text-amber-700',
  CLOSED_WON: 'bg-emerald-50 text-emerald-700',
  CLOSED_LOST: 'bg-red-50 text-red-600',
}
const STAGES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return null
  const { id } = await params

  const opp = await db.opportunity.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      assignee: { select: { name: true } },
    },
  })
  if (!opp) return notFound()

  const currentStageIndex = STAGES.indexOf(opp.stage)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
            <Link href="/crm/opportunities" className="hover:text-indigo-600">영업기회</Link>
            <span>/</span>
            <span>{opp.title}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{opp.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {opp.customer.companyName || opp.customer.name}
          </p>
        </div>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${STAGE_COLOR[opp.stage]}`}>
          {STAGE_LABEL[opp.stage]}
        </span>
      </div>

      {/* Stage Progress */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">영업 단계</h2>
        <div className="flex items-center gap-2">
          {STAGES.filter((s) => !['CLOSED_WON', 'CLOSED_LOST'].includes(s)).map((stage, i) => (
            <div key={stage} className="flex items-center flex-1">
              <div className={`flex-1 h-2 rounded-full transition-colors ${
                STAGES.indexOf(stage) <= currentStageIndex && opp.stage !== 'CLOSED_LOST'
                  ? 'bg-indigo-500' : 'bg-slate-100'
              }`} />
              {i < 3 && <div className="w-2 shrink-0" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {STAGES.filter((s) => !['CLOSED_WON', 'CLOSED_LOST'].includes(s)).map((stage) => (
            <span key={stage} className={`text-xs ${
              STAGES.indexOf(stage) <= currentStageIndex && opp.stage !== 'CLOSED_LOST'
                ? 'text-indigo-600 font-medium' : 'text-slate-400'
            }`}>
              {STAGE_LABEL[stage]}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">예상 금액</p>
          <p className="text-2xl font-bold text-indigo-600">{Number(opp.amount).toLocaleString('ko-KR')}원</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">성사 확률</p>
          <p className="text-2xl font-bold text-slate-900">{opp.probability}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 text-center">
          <p className="text-xs text-slate-400 mb-1">예상 마감일</p>
          <p className="text-lg font-bold text-slate-900">
            {opp.expectedClose ? opp.expectedClose.toLocaleDateString('ko-KR') : '—'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">상세 정보</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-400 text-xs">고객</dt>
            <dd className="mt-0.5">
              <Link href={`/crm/customers/${opp.customer.id}`} className="text-indigo-600 hover:underline font-medium">
                {opp.customer.name}
                {opp.customer.companyName && ` (${opp.customer.companyName})`}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 text-xs">담당자</dt>
            <dd className="text-slate-700 font-medium mt-0.5">{opp.assignee?.name ?? '—'}</dd>
          </div>
        </dl>
        {opp.notes && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-1">메모</p>
            <p className="text-sm text-slate-700">{opp.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
