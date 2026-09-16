import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-navy">회계 대시보드</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">이번달 총 매출</p>
          <p className="text-2xl font-bold text-teal mt-1">{totalSales.toLocaleString('ko-KR')}원</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">이번달 총 매입</p>
          <p className="text-2xl font-bold text-navy mt-1">{totalPurchases.toLocaleString('ko-KR')}원</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">이번달 총 비용</p>
          <p className="text-2xl font-bold text-navy mt-1">{totalExpenses.toLocaleString('ko-KR')}원</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">미수금</p>
          <p className="text-2xl font-bold text-danger mt-1">{unpaidSalesTotal.toLocaleString('ko-KR')}원</p>
        </div>
      </div>

      {/* 미수금 현황 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">미수금 현황</h2>
          <Link href="/accounting/sales" className="text-sm text-teal hover:underline">
            전체 보기
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['거래처', '매출명', '합계', '입금예정일', 'D-Day'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {unpaidSales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sub">{s.vendor.name}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/accounting/sales/${s.id}`}
                    className="text-navy font-medium hover:underline"
                  >
                    {s.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium">{fmt(s.totalAmount)}</td>
                <td className="px-4 py-3 text-sub">
                  {s.dueDate ? s.dueDate.toLocaleDateString('ko-KR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      s.dueDate && s.dueDate < now ? 'text-danger font-medium' : 'text-sub'
                    }
                  >
                    {dDays(s.dueDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {unpaidSales.length === 0 && (
          <p className="text-center text-sub py-8">미수금 없음</p>
        )}
      </div>

      {/* 미지급금 현황 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">미지급금 현황</h2>
          <Link href="/accounting/purchases" className="text-sm text-teal hover:underline">
            전체 보기
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['거래처', '매입명', '합계', '지급예정일', 'D-Day'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {unpaidPurchases.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sub">{p.vendor.name}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/accounting/purchases/${p.id}`}
                    className="text-navy font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium">{fmt(p.totalAmount)}</td>
                <td className="px-4 py-3 text-sub">
                  {p.dueDate ? p.dueDate.toLocaleDateString('ko-KR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.dueDate && p.dueDate < now ? 'text-danger font-medium' : 'text-sub'
                    }
                  >
                    {dDays(p.dueDate)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {unpaidPurchases.length === 0 && (
          <p className="text-center text-sub py-8">미지급금 없음</p>
        )}
      </div>

      {/* 비용 승인 대기 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">비용 승인 대기</h2>
          <Link href="/accounting/expenses" className="text-sm text-teal hover:underline">
            전체 보기
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['비용명', '유형', '금액', '신청자', '비용일', '상태'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {pendingExpenses.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/accounting/expenses/${e.id}`}
                    className="text-navy font-medium hover:underline"
                  >
                    {e.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sub">
                  {
                    {
                      CORPORATE_CARD: '법인카드',
                      PERSONAL: '개인경비',
                      TRAVEL: '출장비',
                      ENTERTAINMENT: '접대비',
                      VEHICLE: '차량비',
                      SUPPLIES: '소모품비',
                      OTHER: '기타',
                    }[e.type] ?? e.type
                  }
                </td>
                <td className="px-4 py-3 font-medium">{fmt(e.amount)}</td>
                <td className="px-4 py-3 text-sub">{e.paidBy.name}</td>
                <td className="px-4 py-3 text-sub">{e.expenseDate.toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <Badge variant="warning">대기</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pendingExpenses.length === 0 && (
          <p className="text-center text-sub py-8">승인 대기 비용 없음</p>
        )}
      </div>
    </div>
  )
}
