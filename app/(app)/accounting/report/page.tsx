import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

interface MonthRow {
  month: number
  revenue: number
  purchases: number
  expenses: number
  profit: number
  margin: number
}

export default async function AccountingReportPage() {
  const session = await auth()
  if (!session) return null

  const year = new Date().getFullYear()

  // Fetch all data in parallel
  const [sales, purchases, expenses] = await Promise.all([
    db.sale.findMany({ where: { date: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } } }),
    db.purchase.findMany({ where: { date: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } } }),
    db.expense.findMany({ where: { date: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } } }),
  ])

  // Aggregate by month
  const months: MonthRow[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    const rev = sales.filter((s) => new Date(s.date).getMonth() + 1 === m).reduce((sum, s) => sum + Number(s.amount), 0)
    const pur = purchases.filter((p) => new Date(p.date).getMonth() + 1 === m).reduce((sum, p) => sum + Number(p.amount), 0)
    const exp = expenses.filter((e) => new Date(e.date).getMonth() + 1 === m).reduce((sum, e) => sum + Number(e.amount), 0)
    const profit = rev - pur - exp
    return { month: m, revenue: rev, purchases: pur, expenses: exp, profit, margin: rev > 0 ? Math.round((profit / rev) * 100) : 0 }
  })

  const totals = {
    revenue: months.reduce((s, m) => s + m.revenue, 0),
    purchases: months.reduce((s, m) => s + m.purchases, 0),
    expenses: months.reduce((s, m) => s + m.expenses, 0),
    profit: months.reduce((s, m) => s + m.profit, 0),
  }
  const totalMargin = totals.revenue > 0 ? Math.round((totals.profit / totals.revenue) * 100) : 0

  const maxRevenue = Math.max(...months.map((m) => m.revenue), 1)

  // Monthly trend for chart
  const hasAnyData = totals.revenue > 0 || totals.purchases > 0 || totals.expenses > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">결산 리포트</h1>
        <p className="text-sm text-slate-500 mt-0.5">{year}년 손익계산서</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '매출', value: totals.revenue, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: '매입원가', value: totals.purchases, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: '판관비', value: totals.expenses, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '순이익', value: totals.profit, color: totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600', bg: totals.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value.toLocaleString('ko-KR')}원</p>
            {card.label === '순이익' && (
              <p className="text-xs text-slate-400 mt-1">이익률 {totalMargin}%</p>
            )}
          </div>
        ))}
      </div>

      {/* Bar chart */}
      {hasAnyData && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">월별 매출 추이</h2>
          <div className="flex items-end gap-2 h-32">
            {months.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                  <div
                    className="w-full bg-indigo-500 rounded-t opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${Math.max((m.revenue / maxRevenue) * 100, m.revenue > 0 ? 4 : 0)}px` }}
                    title={`${m.month}월: ${m.revenue.toLocaleString('ko-KR')}원`}
                  />
                </div>
                <span className="text-xs text-slate-400">{m.month}월</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly P&L table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">월별 손익 현황</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['월', '매출', '매입원가', '판관비', '영업이익', '이익률'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {months.map((m) => (
              <tr key={m.month} className={`hover:bg-slate-50 ${m.revenue === 0 && m.purchases === 0 && m.expenses === 0 ? 'opacity-40' : ''}`}>
                <td className="px-5 py-3 font-medium text-slate-700">{m.month}월</td>
                <td className="px-5 py-3 text-indigo-600 font-medium">{m.revenue.toLocaleString('ko-KR')}</td>
                <td className="px-5 py-3 text-slate-600">{m.purchases.toLocaleString('ko-KR')}</td>
                <td className="px-5 py-3 text-amber-600">{m.expenses.toLocaleString('ko-KR')}</td>
                <td className={`px-5 py-3 font-medium ${m.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {m.profit >= 0 ? '+' : ''}{m.profit.toLocaleString('ko-KR')}
                </td>
                <td className="px-5 py-3">
                  {m.revenue > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${m.margin < 0 ? 'bg-red-500' : m.margin < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(Math.abs(m.margin), 100)}%` }} />
                      </div>
                      <span className={`text-xs ${m.margin < 0 ? 'text-red-600' : 'text-slate-600'}`}>{m.margin}%</span>
                    </div>
                  ) : <span className="text-slate-300">—</span>}
                </td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
              <td className="px-5 py-3 text-slate-700">합계</td>
              <td className="px-5 py-3 text-indigo-700">{totals.revenue.toLocaleString('ko-KR')}</td>
              <td className="px-5 py-3 text-slate-700">{totals.purchases.toLocaleString('ko-KR')}</td>
              <td className="px-5 py-3 text-amber-700">{totals.expenses.toLocaleString('ko-KR')}</td>
              <td className={`px-5 py-3 ${totals.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {totals.profit >= 0 ? '+' : ''}{totals.profit.toLocaleString('ko-KR')}
              </td>
              <td className="px-5 py-3 text-slate-600">{totalMargin}%</td>
            </tr>
          </tbody>
        </table>
        {!hasAnyData && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">집계할 데이터가 없습니다</p>
            <p className="text-slate-300 text-xs mt-1">매출, 매입, 비용을 먼저 입력해 주세요</p>
          </div>
        )}
      </div>
    </div>
  )
}
