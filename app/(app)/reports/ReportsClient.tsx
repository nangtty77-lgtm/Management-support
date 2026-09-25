'use client'

interface MonthData { month: string; total: number; count: number }
interface StatGroup { total: number; count: number }
interface StatusCount { status: string; count: number }

function formatKRW(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`
  return n.toLocaleString()
}

function growthRate(current: number, prev: number) {
  if (prev === 0) return current > 0 ? '+100%' : '0%'
  const rate = ((current - prev) / prev) * 100
  return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`
}

function growthColor(current: number, prev: number) {
  if (current > prev) return 'text-emerald-600'
  if (current < prev) return 'text-red-500'
  return 'text-slate-400'
}

const TASK_LABEL: Record<string, string> = { PENDING: '대기', IN_PROGRESS: '진행', REVIEW: '검토', COMPLETED: '완료', ON_HOLD: '보류' }
const TASK_COLOR: Record<string, string> = { PENDING: 'bg-slate-200', IN_PROGRESS: 'bg-blue-400', REVIEW: 'bg-amber-400', COMPLETED: 'bg-emerald-400', ON_HOLD: 'bg-purple-400' }
const LEAVE_LABEL: Record<string, string> = { PENDING: '대기', APPROVED: '승인', REJECTED: '반려' }
const CONTRACT_LABEL: Record<string, string> = { ACTIVE: '활성', EXPIRED: '만료', TERMINATED: '해지', DRAFT: '임시' }

function SimpleBarChart({ data, maxVal }: { data: MonthData[], maxVal: number }) {
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map(d => {
        const height = maxVal > 0 ? (d.total / maxVal) * 100 : 0
        return (
          <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[10px] text-slate-400">{d.total > 0 ? formatKRW(d.total) : ''}</div>
            <div className="w-full bg-slate-100 rounded-t relative" style={{ height: '96px' }}>
              <div className="absolute bottom-0 left-0 right-0 bg-indigo-400 rounded-t transition-all" style={{ height: `${Math.max(height, d.total > 0 ? 2 : 0)}%` }} />
            </div>
            <div className="text-[10px] text-slate-400">{d.month.slice(5)}</div>
          </div>
        )
      })}
    </div>
  )
}

function DonutSlice({ items, colors }: { items: { label: string; count: number; color: string }[], colors: string[] }) {
  const total = items.reduce((s, i) => s + i.count, 0)
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
          <span className="text-xs text-slate-600 flex-1">{item.label}</span>
          <span className="text-xs font-medium text-slate-700">{item.count}</span>
          <span className="text-xs text-slate-400 w-10 text-right">{total > 0 ? Math.round((item.count / total) * 100) : 0}%</span>
        </div>
      ))}
    </div>
  )
}

export function ReportsClient({
  year, month, salesThisMonth, salesLastMonth, purchasesThisMonth, purchasesLastMonth,
  expensesThisMonth, taskStats, leaveStats, contractStats, activeEmployees, meetingsThisMonth, monthlySales,
}: {
  year: number; month: number
  salesThisMonth: StatGroup; salesLastMonth: StatGroup
  purchasesThisMonth: StatGroup; purchasesLastMonth: StatGroup
  expensesThisMonth: StatGroup
  taskStats: StatusCount[]
  leaveStats: StatusCount[]
  contractStats: StatusCount[]
  activeEmployees: number
  meetingsThisMonth: number
  monthlySales: MonthData[]
}) {
  const maxSales = Math.max(...monthlySales.map(d => d.total), 1)
  const profit = salesThisMonth.total - purchasesThisMonth.total - expensesThisMonth.total

  const taskItems = taskStats.map(t => ({ label: TASK_LABEL[t.status] ?? t.status, count: t.count, color: TASK_COLOR[t.status] ?? 'bg-slate-200' }))
  const leaveItems = leaveStats.map(l => ({ label: LEAVE_LABEL[l.status] ?? l.status, count: l.count, color: l.status === 'APPROVED' ? 'bg-emerald-400' : l.status === 'REJECTED' ? 'bg-red-400' : 'bg-amber-400' }))
  const contractItems = contractStats.map(c => ({ label: CONTRACT_LABEL[c.status] ?? c.status, count: c.count, color: c.status === 'ACTIVE' ? 'bg-emerald-400' : c.status === 'EXPIRED' ? 'bg-red-400' : 'bg-slate-300' }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">통합 보고서</h1>
        <p className="text-sm text-slate-400 mt-0.5">{year}년 {month}월 현황</p>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 mb-1">이번 달 매출</p>
          <p className="text-2xl font-bold text-slate-900">{formatKRW(salesThisMonth.total)}원</p>
          <p className={`text-xs mt-1 ${growthColor(salesThisMonth.total, salesLastMonth.total)}`}>
            {growthRate(salesThisMonth.total, salesLastMonth.total)} 전월 대비
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 mb-1">이번 달 매입</p>
          <p className="text-2xl font-bold text-slate-900">{formatKRW(purchasesThisMonth.total)}원</p>
          <p className={`text-xs mt-1 ${growthColor(purchasesThisMonth.total, purchasesLastMonth.total)}`}>
            {growthRate(purchasesThisMonth.total, purchasesLastMonth.total)} 전월 대비
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-400 mb-1">이번 달 비용</p>
          <p className="text-2xl font-bold text-slate-900">{formatKRW(expensesThisMonth.total)}원</p>
          <p className="text-xs text-slate-400 mt-1">{expensesThisMonth.count}건</p>
        </div>
        <div className={`rounded-xl border shadow-sm p-4 ${profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <p className="text-xs text-slate-400 mb-1">예상 영업이익</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatKRW(Math.abs(profit))}원</p>
          <p className={`text-xs mt-1 ${profit >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>{profit >= 0 ? '흑자' : '적자'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Sales trend */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">월별 매출 추이 (최근 6개월)</h2>
          <SimpleBarChart data={monthlySales} maxVal={maxSales} />
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">재직 직원</p>
            <p className="text-3xl font-bold text-indigo-600">{activeEmployees}<span className="text-base text-slate-400 font-normal ml-1">명</span></p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">이번 달 회의</p>
            <p className="text-3xl font-bold text-indigo-600">{meetingsThisMonth}<span className="text-base text-slate-400 font-normal ml-1">건</span></p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">이번 달 매출 건수</p>
            <p className="text-3xl font-bold text-indigo-600">{salesThisMonth.count}<span className="text-base text-slate-400 font-normal ml-1">건</span></p>
          </div>
        </div>
      </div>

      {/* Module stats */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">업무 현황</h2>
          <p className="text-3xl font-bold text-slate-900 mb-3">{taskStats.reduce((s, t) => s + t.count, 0)}<span className="text-base text-slate-400 font-normal ml-1">건</span></p>
          <DonutSlice items={taskItems} colors={[]} />
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">연차 현황</h2>
          <p className="text-3xl font-bold text-slate-900 mb-3">{leaveStats.reduce((s, l) => s + l.count, 0)}<span className="text-base text-slate-400 font-normal ml-1">건</span></p>
          <DonutSlice items={leaveItems} colors={[]} />
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">계약 현황</h2>
          <p className="text-3xl font-bold text-slate-900 mb-3">{contractStats.reduce((s, c) => s + c.count, 0)}<span className="text-base text-slate-400 font-normal ml-1">건</span></p>
          <DonutSlice items={contractItems} colors={[]} />
        </div>
      </div>
    </div>
  )
}
