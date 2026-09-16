import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const STATUS_LABEL: Record<string, string> = {
  UNPAID: '미지급',
  PARTIAL: '부분지급',
  PAID: '지급완료',
  OVERDUE: '연체',
}
const STATUS_BADGE: Record<string, 'danger' | 'warning' | 'teal'> = {
  UNPAID: 'danger',
  PARTIAL: 'warning',
  PAID: 'teal',
  OVERDUE: 'danger',
}

export default async function PurchasesPage() {
  const session = await auth()
  if (!session) return null

  const purchases = await db.purchase.findMany({
    include: { vendor: { select: { name: true } } },
    orderBy: { purchaseDate: 'desc' },
  })

  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0)
  const totalPaid = purchases
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.totalAmount), 0)
  const totalUnpaid = purchases
    .filter((p) => p.status === 'UNPAID' || p.status === 'PARTIAL' || p.status === 'OVERDUE')
    .reduce((sum, p) => sum + Number(p.totalAmount) - Number(p.paidAmount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">매입 관리</h1>
        <Link
          href="/accounting/purchases/new"
          className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90"
        >
          + 매입 등록
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">총 매입</p>
          <p className="text-2xl font-bold text-navy mt-1">
            {totalPurchases.toLocaleString('ko-KR')}원
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">지급완료</p>
          <p className="text-2xl font-bold text-teal mt-1">
            {totalPaid.toLocaleString('ko-KR')}원
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">미지급금</p>
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
              {['매입명', '거래처', '공급가액', '세액', '합계', '매입일', '지급예정일', '상태'].map(
                (h) => (
                  <th key={h} className="text-left px-4 py-3 text-sub font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {purchases.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/accounting/purchases/${p.id}`}
                    className="text-navy font-medium hover:underline"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sub">{p.vendor.name}</td>
                <td className="px-4 py-3 text-sub">
                  {Number(p.amount).toLocaleString('ko-KR')}원
                </td>
                <td className="px-4 py-3 text-sub">
                  {Number(p.taxAmount).toLocaleString('ko-KR')}원
                </td>
                <td className="px-4 py-3 font-medium">
                  {Number(p.totalAmount).toLocaleString('ko-KR')}원
                </td>
                <td className="px-4 py-3 text-sub">
                  {p.purchaseDate.toLocaleDateString('ko-KR')}
                </td>
                <td className="px-4 py-3 text-sub">
                  {p.dueDate ? p.dueDate.toLocaleDateString('ko-KR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[p.status] ?? 'gray'}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {purchases.length === 0 && (
          <p className="text-center text-sub py-12">등록된 매입이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
