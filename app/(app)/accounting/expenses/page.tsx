import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '반려',
  PAID: '지급완료',
}
const STATUS_BADGE: Record<string, 'warning' | 'teal' | 'danger' | 'gray'> = {
  PENDING: 'warning',
  APPROVED: 'teal',
  REJECTED: 'danger',
  PAID: 'gray',
}
const TYPE_LABEL: Record<string, string> = {
  CORPORATE_CARD: '법인카드',
  PERSONAL: '개인경비',
  TRAVEL: '출장비',
  ENTERTAINMENT: '접대비',
  VEHICLE: '차량비',
  SUPPLIES: '소모품비',
  OTHER: '기타',
}

export default async function ExpensesPage() {
  const session = await auth()
  if (!session) return null

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const expenses = await db.expense.findMany({
    include: {
      paidBy: { select: { name: true } },
    },
    orderBy: { expenseDate: 'desc' },
  })

  const thisMonthExpenses = expenses.filter((e) => e.expenseDate >= thisMonthStart)
  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const pendingCount = expenses.filter((e) => e.status === 'PENDING').length
  const unpaidTotal = expenses
    .filter((e) => e.status === 'APPROVED')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">비용 관리</h1>
        <Link
          href="/accounting/expenses/new"
          className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90"
        >
          + 비용 신청
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">이번달 총 비용</p>
          <p className="text-2xl font-bold text-navy mt-1">
            {totalThisMonth.toLocaleString('ko-KR')}원
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">승인 대기</p>
          <p className="text-2xl font-bold text-warning mt-1">{pendingCount}건</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sub text-sm">미지급</p>
          <p className="text-2xl font-bold text-danger mt-1">
            {unpaidTotal.toLocaleString('ko-KR')}원
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['비용명', '유형', '금액', '비용일', '신청자', '상태'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/accounting/expenses/${e.id}`}
                    className="text-navy font-medium hover:underline"
                  >
                    {e.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sub">{TYPE_LABEL[e.type] ?? e.type}</td>
                <td className="px-4 py-3 font-medium">{Number(e.amount).toLocaleString('ko-KR')}원</td>
                <td className="px-4 py-3 text-sub">{e.expenseDate.toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3 text-sub">{e.paidBy.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[e.status] ?? 'gray'}>
                    {STATUS_LABEL[e.status] ?? e.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <p className="text-center text-sub py-12">등록된 비용이 없습니다.</p>
        )}
      </div>
    </div>
  )
}
