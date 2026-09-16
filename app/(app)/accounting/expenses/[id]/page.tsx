import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ApprovalButtons } from './ApprovalButtons'

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

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) return null
  const { id } = await params
  const expense = await db.expense.findUnique({
    where: { id },
    include: {
      paidBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  })
  if (!expense) notFound()

  const canApprove =
    expense.status === 'PENDING' &&
    (session.user.role === 'ADMIN' || session.user.role === 'GENERAL')

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{expense.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={STATUS_BADGE[expense.status] ?? 'gray'}>
              {STATUS_LABEL[expense.status] ?? expense.status}
            </Badge>
            <span className="text-sub text-sm">{TYPE_LABEL[expense.type] ?? expense.type}</span>
          </div>
        </div>
        <Link
          href="/accounting/expenses"
          className="bg-white border border-gray-200 text-navy px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          목록
        </Link>
      </div>

      {/* Detail card */}
      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
        <div>
          <p className="text-sub">비용 유형</p>
          <p className="font-medium mt-0.5">{TYPE_LABEL[expense.type] ?? expense.type}</p>
        </div>
        <div>
          <p className="text-sub">신청자</p>
          <p className="font-medium mt-0.5">{expense.paidBy.name}</p>
        </div>
        <div>
          <p className="text-sub">금액</p>
          <p className="font-bold text-navy mt-0.5">
            {Number(expense.amount).toLocaleString('ko-KR')}원
          </p>
        </div>
        <div>
          <p className="text-sub">비용 발생일</p>
          <p className="font-medium mt-0.5">{expense.expenseDate.toLocaleDateString('ko-KR')}</p>
        </div>
        <div>
          <p className="text-sub">상태</p>
          <div className="mt-0.5">
            <Badge variant={STATUS_BADGE[expense.status] ?? 'gray'}>
              {STATUS_LABEL[expense.status] ?? expense.status}
            </Badge>
          </div>
        </div>
        <div>
          <p className="text-sub">승인자</p>
          <p className="font-medium mt-0.5">{expense.approvedBy?.name ?? '—'}</p>
        </div>
        {expense.approvedAt && (
          <div>
            <p className="text-sub">승인일</p>
            <p className="font-medium mt-0.5">{expense.approvedAt.toLocaleDateString('ko-KR')}</p>
          </div>
        )}
        {expense.receiptUrl && (
          <div>
            <p className="text-sub">영수증</p>
            <a
              href={expense.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:underline mt-0.5 block"
            >
              보기
            </a>
          </div>
        )}
        {expense.notes && (
          <div className="col-span-2">
            <p className="text-sub">메모</p>
            <p className="font-medium mt-0.5 whitespace-pre-wrap">{expense.notes}</p>
          </div>
        )}
      </div>

      {/* Approval section */}
      {canApprove && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
          <h2 className="text-base font-semibold text-navy">비용 승인</h2>
          <ApprovalButtons expenseId={expense.id} />
        </div>
      )}
    </div>
  )
}
