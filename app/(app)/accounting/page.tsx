import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

function fmt(n: bigint | number) {
  return Number(n).toLocaleString('ko-KR') + '원'
}
function diff(cur: number, prev: number) {
  if (prev === 0) return null
  const pct = Math.round(((cur - prev) / prev) * 100)
  return pct
}

export default async function AccountingDashboardPage() {
  const session = await auth()
  if (!session) return null

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  const [sales, purchases, expenses, lastSales, lastPurchases, lastExpenses, allSales6] = await Promise.all([
    db.sale.findMany({
      where: { saleDate: { gte: thisMonthStart } },
      include: { vendor: { select: { name: true } } },
      orderBy: { saleDate: 'desc' },
    }),
    db.purchase.findMany({
      where: { purchaseDate: { gte: thisMonthStart } },
      include: { vendor: { select: { name: true } } },
      orderBy: { purchaseDate: 'desc' },
    }),
    db.expense.findMany({
      where: { expenseDate: { gte: thisMonthStart } },
      include: { paidBy: { select: { name: true } } },
      orderBy: { expenseDate: 'desc' },
    }),
    // 전월
    db.sale.findMany({ where: { saleDate: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    db.purchase.findMany({ where: { purchaseDate: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    db.expense.findMany({ where: { expenseDate: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    // 6개월 추세
    db.sale.findMany({
      where: { saleDate: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
      select: { saleDate: true, totalAmount: true },
    }),
  ])

  const totalSales = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const grossProfit = totalSales - totalPurchases
  const netProfit = grossProfit - totalExpenses
  const margin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0

  const lastTotalSales = lastSales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const lastTotalPurchases = lastPurchases.reduce((sum, p) => sum + Number(p.totalAmount), 0)
  const lastTotalExpenses = lastExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const salesDiff = diff(totalSales, lastTotalSales)
  const purchasesDiff = diff(totalPurchases, lastTotalPurchases)
  const expensesDiff = diff(totalExpenses, lastTotalExpenses)

  const unpaidSalesTotal = sales
    .filter((s) => s.status === 'UNPAID' || s.status === 'PARTIAL' || s.status === 'OVERDUE')
    .reduce((sum, s) => sum + Number(s.totalAmount) - Number(s.paidAmount), 0)

  const unpaidSales = sales.filter(
    (s) => s.status === 'UNPAID' || s.status === 'PARTIAL' || s.status === 'OVERDUE',
  )
  const unpaidPurchases = purchases.filter(
    (p) => p.status === 'UNPAID' || p.status === 'PARTIAL' || p.status === 'OVERDUE',
  )
  const pendingExpenses = expenses.filter((e) => e.status === 'PENDING')

  const dDays = (date: Date | null) => {
    if (!date) return '—'
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'D-Day'
    if (diff > 0) return `D-${diff}`
    return `D+${Math.abs(diff)}`
  }

  // 6개월 추세 데이터
  const trend = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const month = m.getMonth() + 1
    const year = m.getFullYear()
    const rev = allSales6
      .filter((s) => {
        const d = new Date(s.saleDate)
        return d.getMonth() + 1 === month && d.getFullYear() === year
      })
      .reduce((sum, s) => sum + Number(s.totalAmount), 0)
    return { label: `${month}월`, rev }
  })
  const maxTrend = Math.max(...trend.map((t) => t.rev), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">회계 대시보드</h1>
          <p className="text-sm text-slate-500 mt-0.5">{now.getFullYear()}년 {now.getMonth() + 1}월 현황</p>
        </div>
        <Link href="/accounting/report" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
          결산 리포트 보기 →
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="이번달 매출"
          value={totalSales.toLocaleString('ko-KR') + '원'}
          sub={salesDiff !== null ? `전월 대비 ${salesDiff > 0 ? '+' : ''}${salesDiff}%` : undefined}
          color="indigo"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
        />
        <KpiCard
          label="이번달 매입"
          value={totalPurchases.toLocaleString('ko-KR') + '원'}
          sub={purchasesDiff !== null ? `전월 대비 ${purchasesDiff > 0 ? '+' : ''}${purchasesDiff}%` : undefined}
          color="navy"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
          }
        />
        <KpiCard
          label="이번달 비용"
          value={totalExpenses.toLocaleString('ko-KR') + '원'}
          sub={expensesDiff !== null ? `전월 대비 ${expensesDiff > 0 ? '+' : ''}${expensesDiff}%` : undefined}
          color="warning"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          }
        />
        <KpiCard
          label="순이익"
          value={netProfit.toLocaleString('ko-KR') + '원'}
          sub={`이익률 ${margin}%`}
          color={netProfit >= 0 ? 'success' : 'danger'}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          }
        />
      </div>

      {/* 손익 요약 + 추세 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 손익 요약 */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">이번달 손익 요약</h3>
          <div className="space-y-3">
            {[
              { label: '매출', value: totalSales, color: 'text-indigo-600' },
              { label: '매입원가', value: -totalPurchases, color: 'text-slate-600' },
              { label: '판관비', value: -totalExpenses, color: 'text-amber-600' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{row.label}</span>
                <span className={`font-medium ${row.color}`}>
                  {row.value < 0 ? '-' : ''}{Math.abs(row.value).toLocaleString('ko-KR')}원
                </span>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">순이익</span>
              <span className={`font-bold text-base ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {netProfit >= 0 ? '+' : ''}{netProfit.toLocaleString('ko-KR')}원
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>이익률</span>
              <span className={margin >= 0 ? 'text-emerald-500' : 'text-red-500'}>{margin}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${margin < 0 ? 'bg-red-500' : margin < 10 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(Math.abs(margin), 100)}%` }} />
            </div>
          </div>
        </div>

        {/* 전월 비교 */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">전월 비교</h3>
          <div className="space-y-4">
            {[
              { label: '매출', cur: totalSales, prev: lastTotalSales },
              { label: '매입', cur: totalPurchases, prev: lastTotalPurchases },
              { label: '비용', cur: totalExpenses, prev: lastTotalExpenses },
            ].map((row) => {
              const pct = diff(row.cur, row.prev)
              const up = row.cur >= row.prev
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{row.label}</span>
                    {pct !== null && (
                      <span className={`font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
                        {up ? '▲' : '▼'} {Math.abs(pct)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-end gap-2 text-xs text-slate-400">
                    <span className="text-slate-700 font-medium text-sm">{row.cur.toLocaleString('ko-KR')}원</span>
                    <span>← {row.prev.toLocaleString('ko-KR')}원</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 6개월 매출 추세 */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">6개월 매출 추세</h3>
          <div className="flex items-end gap-1.5 h-24">
            {trend.map((t) => (
              <div key={t.label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                  <div
                    className="w-full bg-indigo-500 rounded-t-sm opacity-75 hover:opacity-100 transition-opacity"
                    style={{ height: `${Math.max((t.rev / maxTrend) * 80, t.rev > 0 ? 3 : 0)}px` }}
                    title={`${t.label}: ${t.rev.toLocaleString('ko-KR')}원`}
                  />
                </div>
                <span className="text-xs text-slate-400">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 미수금 현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-800">미수금 현황</h2>
            {unpaidSalesTotal > 0 && (
              <span className="text-xs bg-red-50 text-red-600 font-medium px-2 py-0.5 rounded-full">
                {unpaidSalesTotal.toLocaleString('ko-KR')}원
              </span>
            )}
          </div>
          <Link href="/accounting/sales" className="text-sm text-indigo-600 hover:underline">전체 보기</Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['거래처', '매출명', '미수금액', '입금예정일', 'D-Day'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {unpaidSales.slice(0, 5).map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 text-slate-500 text-sm">{s.vendor.name}</td>
                <td className="px-5 py-3">
                  <Link href={`/accounting/sales/${s.id}`} className="text-slate-800 font-medium hover:text-indigo-600 hover:underline text-sm">{s.title}</Link>
                </td>
                <td className="px-5 py-3 font-semibold text-sm text-red-600">
                  {(Number(s.totalAmount) - Number(s.paidAmount)).toLocaleString('ko-KR')}원
                </td>
                <td className="px-5 py-3 text-slate-500 text-sm">{s.dueDate ? s.dueDate.toLocaleDateString('ko-KR') : '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-sm font-medium ${s.dueDate && s.dueDate < now ? 'text-red-600' : 'text-slate-500'}`}>
                    {dDays(s.dueDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {unpaidSales.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400">미수금 없음</p>
          </div>
        )}
      </div>

      {/* 미지급금 + 비용 승인 대기 - 2열 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 미지급금 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">미지급금</h2>
            <Link href="/accounting/purchases" className="text-sm text-indigo-600 hover:underline">전체 보기</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {unpaidPurchases.slice(0, 4).map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <Link href={`/accounting/purchases/${p.id}`} className="text-sm font-medium text-slate-800 hover:text-indigo-600 hover:underline">{p.title}</Link>
                  <p className="text-xs text-slate-400 mt-0.5">{p.vendor.name} · {dDays(p.dueDate)}</p>
                </div>
                <span className="text-sm font-semibold text-amber-600">{fmt(p.totalAmount)}</span>
              </div>
            ))}
            {unpaidPurchases.length === 0 && <p className="text-center py-8 text-sm text-slate-400">미지급금 없음</p>}
          </div>
        </div>

        {/* 비용 승인 대기 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-800">비용 승인 대기</h2>
              {pendingExpenses.length > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {pendingExpenses.length}
                </span>
              )}
            </div>
            <Link href="/accounting/expenses" className="text-sm text-indigo-600 hover:underline">전체 보기</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingExpenses.slice(0, 4).map((e) => (
              <div key={e.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <Link href={`/accounting/expenses/${e.id}`} className="text-sm font-medium text-slate-800 hover:text-indigo-600 hover:underline">{e.title}</Link>
                  <p className="text-xs text-slate-400 mt-0.5">{e.paidBy.name} · {e.expenseDate.toLocaleDateString('ko-KR')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-700">{fmt(e.amount)}</p>
                  <Badge variant="warning">대기</Badge>
                </div>
              </div>
            ))}
            {pendingExpenses.length === 0 && <p className="text-center py-8 text-sm text-slate-400">승인 대기 없음</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
