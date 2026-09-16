import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { KpiCard } from '@/components/ui/KpiCard'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

function fmt(n: bigint | number) {
  return Number(n).toLocaleString('ko-KR') + '원'
}

export default async function AccountingDashboardPage() {
  const session = await auth()
  if (!session) return null

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [sales, purchases, expenses] = await Promise.all([
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
  ])

  const totalSales = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">회계 대시보드</h1>
        <p className="text-sm text-sub mt-0.5">{now.getFullYear()}년 {now.getMonth() + 1}월 현황</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="이번달 총 매출"
          value={totalSales.toLocaleString('ko-KR') + '원'}
          color="teal"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
        />
        <KpiCard
          label="이번달 총 매입"
          value={totalPurchases.toLocaleString('ko-KR') + '원'}
          color="navy"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            </svg>
          }
        />
        <KpiCard
          label="이번달 총 비용"
          value={totalExpenses.toLocaleString('ko-KR') + '원'}
          color="warning"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          }
        />
        <KpiCard
          label="미수금"
          value={unpaidSalesTotal.toLocaleString('ko-KR') + '원'}
          color="danger"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
        />
      </div>

      {/* 미수금 현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">미수금 현황</h2>
          <Link href="/accounting/sales" className="text-sm text-teal hover:underline">
            전체 보기
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['거래처', '매출명', '합계', '입금예정일', 'D-Day'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-sub font-medium text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {unpaidSales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-sub text-sm">{s.vendor.name}</td>
                <td className="px-5 py-3">
                  <Link href={`/accounting/sales/${s.id}`} className="text-navy font-medium hover:underline text-sm">
                    {s.title}
                  </Link>
                </td>
                <td className="px-5 py-3 font-semibold text-sm">{fmt(s.totalAmount)}</td>
                <td className="px-5 py-3 text-sub text-sm">
                  {s.dueDate ? s.dueDate.toLocaleDateString('ko-KR') : '—'}
                </td>
                <td className="px-5 py-3">
                  <span className={s.dueDate && s.dueDate < now ? 'text-danger font-semibold text-sm' : 'text-sub text-sm'}>
                    {dDays(s.dueDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {unpaidSales.length === 0 && (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <p className="text-sm text-sub">미수금 없음</p>
          </div>
        )}
      </div>

      {/* 미지급금 현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">미지급금 현황</h2>
          <Link href="/accounting/purchases" className="text-sm text-teal hover:underline">
            전체 보기
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['거래처', '매입명', '합계', '지급예정일', 'D-Day'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-sub font-medium text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {unpaidPurchases.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-sub text-sm">{p.vendor.name}</td>
                <td className="px-5 py-3">
                  <Link href={`/accounting/purchases/${p.id}`} className="text-navy font-medium hover:underline text-sm">
                    {p.title}
                  </Link>
                </td>
                <td className="px-5 py-3 font-semibold text-sm">{fmt(p.totalAmount)}</td>
                <td className="px-5 py-3 text-sub text-sm">
                  {p.dueDate ? p.dueDate.toLocaleDateString('ko-KR') : '—'}
                </td>
                <td className="px-5 py-3">
                  <span className={p.dueDate && p.dueDate < now ? 'text-danger font-semibold text-sm' : 'text-sub text-sm'}>
                    {dDays(p.dueDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {unpaidPurchases.length === 0 && (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <p className="text-sm text-sub">미지급금 없음</p>
          </div>
        )}
      </div>

      {/* 비용 승인 대기 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">비용 승인 대기</h2>
          <Link href="/accounting/expenses" className="text-sm text-teal hover:underline">
            전체 보기
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['비용명', '유형', '금액', '신청자', '비용일', '상태'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-sub font-medium text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pendingExpenses.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/accounting/expenses/${e.id}`} className="text-navy font-medium hover:underline text-sm">
                    {e.title}
                  </Link>
                </td>
                <td className="px-5 py-3 text-sub text-sm">
                  {({ CORPORATE_CARD: '법인카드', PERSONAL: '개인경비', TRAVEL: '출장비', ENTERTAINMENT: '접대비', VEHICLE: '차량비', SUPPLIES: '소모품비', OTHER: '기타' } as Record<string, string>)[e.type] ?? e.type}
                </td>
                <td className="px-5 py-3 font-semibold text-sm">{fmt(e.amount)}</td>
                <td className="px-5 py-3 text-sub text-sm">{e.paidBy.name}</td>
                <td className="px-5 py-3 text-sub text-sm">{e.expenseDate.toLocaleDateString('ko-KR')}</td>
                <td className="px-5 py-3">
                  <Badge variant="warning">대기</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pendingExpenses.length === 0 && (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <p className="text-sm text-sub">승인 대기 비용 없음</p>
          </div>
        )}
      </div>
    </div>
  )
}
