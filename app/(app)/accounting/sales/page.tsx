import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

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
        <h1 className="text-2xl font-bold text-navy">매출 관리</h1>
        <Link
          href="/accounting/sales/new"
          className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90"
        >
          + 매출 등록
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">총 매출</p>
          <p className="text-2xl font-bold text-navy mt-1">
            {totalSales.toLocaleString('ko-KR')}원
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">입금완료</p>
          <p className="text-2xl font-bold text-teal mt-1">
            {totalPaid.toLocaleString('ko-KR')}원
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">미수금</p>
          <p className="text-2xl font-bold text-danger mt-1">
            {totalUnpaid.toLocaleString('ko-KR')}원
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['매출명', '거래처', '공급가액', '세액', '합계', '매출일', '입금예정일', '상태'].map(
                (h) => (
                  <th key={h} className="text-left px-4 py-3 text-sub font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sales.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/accounting/sales/${s.id}`}
                    className="text-navy font-medium hover:underline"
                  >
                    {s.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sub">{s.vendor.name}</td>
                <td className="px-4 py-3 text-sub">
                  {Number(s.amount).toLocaleString('ko-KR')}원
                </td>
                <td className="px-4 py-3 text-sub">
                  {Number(s.taxAmount).toLocaleString('ko-KR')}원
                </td>
                <td className="px-4 py-3 font-medium">
                  {Number(s.totalAmount).toLocaleString('ko-KR')}원
                </td>
                <td className="px-4 py-3 text-sub">
                  {s.saleDate.toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3 text-sub">
                  {s.dueDate ? s.dueDate.toLocaleDateString('ko-KR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[s.status] ?? 'gray'}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && (
          <p className="text-center text-sub py-12">등록된 매출이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
