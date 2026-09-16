import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { KpiCard } from '@/components/ui/KpiCard'

const STATUS_LABEL: Record<string, string> = {
  UNPAID: '미수금',
  PARTIAL: '부분입금',
  PAID: '입금완료',
  OVERDUE: '연체',
}
const STATUS_BADGE: Record<string, 'danger' | 'warning' | 'teal'> = {
  UNPAID: 'danger',
  PARTIAL: 'warning',
  PAID: 'teal',
  OVERDUE: 'danger',
}

export default async function SalesPage() {
  const session = await auth()
  if (!session) return null

  const sales = await db.sale.findMany({
    include: { vendor: { select: { name: true } } },
    orderBy: { saleDate: 'desc' },
  })

  const totalSales = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const totalPaid = sales
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const totalUnpaid = sales
    .filter((s) => s.status === 'UNPAID' || s.status === 'PARTIAL' || s.status === 'OVERDUE')
    .reduce((sum, s) => sum + Number(s.totalAmount) - Number(s.paidAmount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">매출 관리</h1>
          <p className="text-sm text-sub mt-0.5">전체 {sales.length}건</p>
        </div>
        <Link href="/accounting/sales/new" className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          매출 등록
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="총 매출" value={totalSales.toLocaleString('ko-KR') + '원'} color="navy" />
        <KpiCard label="입금완료" value={totalPaid.toLocaleString('ko-KR') + '원'} color="teal" />
        <KpiCard label="미수금" value={totalUnpaid.toLocaleString('ko-KR') + '원'} color="danger" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['매출명', '거래처', '공급가액', '세액', '합계', '매출일', '입금예정일', '상태'].map(
                (h) => (
                  <th key={h} className="text-left px-5 py-3 text-sub font-medium text-xs">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/accounting/sales/${s.id}`} className="text-navy font-medium hover:underline">
                    {s.title}
                  </Link>
                </td>
                <td className="px-5 py-3 text-sub">{s.vendor.name}</td>
                <td className="px-5 py-3 text-sub">{Number(s.amount).toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-3 text-sub">{Number(s.taxAmount).toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-3 font-semibold">{Number(s.totalAmount).toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-3 text-sub">{s.saleDate.toLocaleDateString('ko-KR')}</td>
                <td className="px-5 py-3 text-sub">{s.dueDate ? s.dueDate.toLocaleDateString('ko-KR') : '—'}</td>
                <td className="px-5 py-3">
                  <Badge variant={STATUS_BADGE[s.status] ?? 'gray'}>{STATUS_LABEL[s.status] ?? s.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <p className="text-sm text-sub">등록된 매출이 없습니다</p>
            <Link href="/accounting/sales/new" className="inline-block mt-3 text-sm text-teal hover:underline">+ 첫 매출 등록하기</Link>
          </div>
        )}
      </div>
    </div>
  )
}
