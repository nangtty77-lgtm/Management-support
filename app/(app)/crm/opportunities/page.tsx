import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
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

export default async function OpportunitiesPage() {
  const session = await auth()
  if (!session) return null

  const opportunities = await db.opportunity.findMany({
    include: {
      customer: { select: { name: true, companyName: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalAmount = opportunities
    .filter((o) => o.stage !== 'CLOSED_LOST')
    .reduce((sum, o) => sum + Number(o.amount), 0)
  const wonAmount = opportunities
    .filter((o) => o.stage === 'CLOSED_WON')
    .reduce((sum, o) => sum + Number(o.amount), 0)

  const byStage = STAGES.map((stage) => ({
    stage,
    items: opportunities.filter((o) => o.stage === stage),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">영업기회</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            파이프라인 {totalAmount.toLocaleString('ko-KR')}원 · 수주 {wonAmount.toLocaleString('ko-KR')}원
          </p>
        </div>
        <Link href="/crm/opportunities/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          영업기회 등록
        </Link>
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {byStage.map(({ stage, items }) => (
          <div key={stage} className="min-w-[220px] flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STAGE_COLOR[stage]}`}>
                {STAGE_LABEL[stage]}
              </span>
              <span className="text-xs text-slate-400">{items.length}건</span>
            </div>
            <div className="space-y-2">
              {items.map((o) => (
                <Link key={o.id} href={`/crm/opportunities/${o.id}`} className="block bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium text-slate-900 mb-1">{o.title}</p>
                  <p className="text-xs text-slate-500 mb-2">
                    {o.customer.companyName || o.customer.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600">
                      {Number(o.amount).toLocaleString('ko-KR')}원
                    </span>
                    <span className="text-xs text-slate-400">{o.probability}%</span>
                  </div>
                  {/* Probability bar */}
                  <div className="mt-2 h-1 bg-slate-100 rounded-full">
                    <div
                      className="h-1 bg-indigo-500 rounded-full"
                      style={{ width: `${o.probability}%` }}
                    />
                  </div>
                </Link>
              ))}
              {items.length === 0 && (
                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-4 text-center">
                  <p className="text-xs text-slate-400">없음</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* List view */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">전체 목록</h2>
        </div>
        {opportunities.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">등록된 영업기회가 없습니다</p>
            <Link href="/crm/opportunities/new" className="inline-block mt-3 text-sm text-indigo-600 hover:underline">+ 첫 영업기회 등록하기</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['영업기회', '고객', '단계', '금액', '확률', '예상마감', '담당자'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/crm/opportunities/${o.id}`} className="text-slate-900 font-medium hover:underline">
                      {o.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{o.customer.companyName || o.customer.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STAGE_COLOR[o.stage]}`}>
                      {STAGE_LABEL[o.stage]}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-900">{Number(o.amount).toLocaleString('ko-KR')}원</td>
                  <td className="px-5 py-3 text-slate-500">{o.probability}%</td>
                  <td className="px-5 py-3 text-slate-500">{o.expectedClose ? o.expectedClose.toLocaleDateString('ko-KR') : '—'}</td>
                  <td className="px-5 py-3 text-slate-500">{o.assignee?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
