'use client'

import Link from 'next/link'

interface Opportunity {
  id: string; title: string; amount: string; stage: string; probability: number
  expectedClose: string | null; customerName: string; assigneeName: string | null; notes: string
}
interface Customer {
  id: string; name: string; companyName: string; grade: string; status: string
}

const STAGES = [
  { key: 'LEAD', label: '리드', color: 'from-slate-400 to-slate-500' },
  { key: 'QUALIFIED', label: '검증', color: 'from-blue-400 to-blue-500' },
  { key: 'PROPOSAL', label: '제안', color: 'from-indigo-400 to-indigo-500' },
  { key: 'NEGOTIATION', label: '협상', color: 'from-amber-400 to-amber-500' },
  { key: 'CLOSED_WON', label: '수주', color: 'from-emerald-400 to-emerald-500' },
  { key: 'CLOSED_LOST', label: '실패', color: 'from-red-400 to-red-500' },
]

const GRADE_COLOR: Record<string, string> = {
  VIP: 'bg-amber-100 text-amber-700',
  PREMIUM: 'bg-indigo-100 text-indigo-700',
  NORMAL: 'bg-slate-100 text-slate-600',
  INACTIVE: 'bg-slate-50 text-slate-400',
}

function fmt(n: string | number) {
  const v = Number(n)
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(1)}억`
  if (v >= 10_000) return `${(v / 10_000).toFixed(0)}만`
  return v.toLocaleString('ko-KR')
}

export function PipelineClient({ opportunities, customers }: { opportunities: Opportunity[]; customers: Customer[] }) {
  const activeOpps = opportunities.filter(o => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage))
  const wonOpps = opportunities.filter(o => o.stage === 'CLOSED_WON')
  const totalPipeline = activeOpps.reduce((s, o) => s + Number(o.amount), 0)
  const totalWon = wonOpps.reduce((s, o) => s + Number(o.amount), 0)
  const weightedPipeline = activeOpps.reduce((s, o) => s + Number(o.amount) * o.probability / 100, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">영업 파이프라인</h1>
          <p className="text-sm text-slate-400 mt-0.5">진행 중 {activeOpps.length}건</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/opportunities/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + 영업기회 등록
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '파이프라인 총액', value: `${fmt(totalPipeline)}원`, color: 'text-indigo-600' },
          { label: '가중 예상액', value: `${fmt(weightedPipeline)}원`, color: 'text-blue-600' },
          { label: '수주 총액', value: `${fmt(totalWon)}원`, color: 'text-emerald-600' },
          { label: '수주율', value: `${opportunities.length > 0 ? Math.round(wonOpps.length / opportunities.length * 100) : 0}%`, color: 'text-amber-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">단계별 현황</h2>
        <div className="space-y-3">
          {STAGES.map(stage => {
            const stagOpps = opportunities.filter(o => o.stage === stage.key)
            const stageTotal = stagOpps.reduce((s, o) => s + Number(o.amount), 0)
            const maxVal = Math.max(...STAGES.map(s => opportunities.filter(o => o.stage === s.key).reduce((t, o) => t + Number(o.amount), 0)), 1)
            const barWidth = stageTotal > 0 ? Math.max((stageTotal / maxVal) * 100, 4) : 0

            return (
              <div key={stage.key} className="flex items-center gap-3">
                <div className="w-14 shrink-0 text-right">
                  <span className="text-xs font-medium text-slate-500">{stage.label}</span>
                </div>
                <div className="flex-1 bg-slate-50 rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${stage.color} rounded-full flex items-center px-3 transition-all duration-500`}
                    style={{ width: `${barWidth}%` }}
                  >
                    {stagOpps.length > 0 && (
                      <span className="text-white text-xs font-medium whitespace-nowrap">{stagOpps.length}건</span>
                    )}
                  </div>
                </div>
                <div className="w-20 shrink-0 text-right">
                  <span className="text-xs font-semibold text-slate-700">{stageTotal > 0 ? `${fmt(stageTotal)}원` : '-'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Active opportunities */}
        <div className="col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">진행 중 영업기회</h2>
          {activeOpps.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
              진행 중인 영업기회가 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {activeOpps.map(o => {
                const stageInfo = STAGES.find(s => s.key === o.stage)
                return (
                  <Link key={o.id} href={`/crm/opportunities/${o.id}`}
                    className="flex items-center gap-4 bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${stageInfo?.color}`}>
                          {stageInfo?.label}
                        </span>
                        <span className="text-sm font-medium text-slate-800 truncate">{o.title}</span>
                      </div>
                      <p className="text-xs text-slate-400">{o.customerName}{o.assigneeName && ` · ${o.assigneeName}`}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-800">{fmt(o.amount)}원</p>
                      <p className="text-xs text-slate-400">확률 {o.probability}%</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent customers */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">주요 고객</h2>
          <div className="space-y-2">
            {customers.slice(0, 8).map(c => (
              <Link key={c.id} href={`/crm/customers/${c.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 shadow-sm p-3 hover:border-indigo-200 transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(c.companyName || c.name)[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{c.companyName || c.name}</p>
                  {c.companyName && <p className="text-xs text-slate-400 truncate">{c.name}</p>}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${GRADE_COLOR[c.grade]}`}>
                  {c.grade}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
