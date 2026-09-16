import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { PaymentForm } from './PaymentForm'

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

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) return null
  const { id } = await params
  const purchase = await db.purchase.findUnique({
    where: { id },
    include: {
      vendor: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  })
  if (!purchase) notFound()

  const isPaid = purchase.status === 'PAID'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{purchase.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={STATUS_BADGE[purchase.status] ?? 'gray'}>
              {STATUS_LABEL[purchase.status] ?? purchase.status}
            </Badge>
            <span className="text-sub text-sm">{purchase.vendor.name}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/accounting/purchases"
            className="bg-white border border-gray-200 text-navy px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            목록
          </Link>
        </div>
      </div>

      {/* Detail card */}
      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
        <div>
          <p className="text-sub">거래처</p>
          <p className="font-medium mt-0.5">{purchase.vendor.name}</p>
        </div>
        <div>
          <p className="text-sub">담당자</p>
          <p className="font-medium mt-0.5">{purchase.assignee?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-sub">공급가액</p>
          <p className="font-medium mt-0.5">
            {Number(purchase.amount).toLocaleString('ko-KR')}원
          </p>
        </div>
        <div>
          <p className="text-sub">세액</p>
          <p className="font-medium mt-0.5">
            {Number(purchase.taxAmount).toLocaleString('ko-KR')}원
          </p>
        </div>
        <div>
          <p className="text-sub">합계금액</p>
          <p className="font-bold text-navy mt-0.5">
            {Number(purchase.totalAmount).toLocaleString('ko-KR')}원
          </p>
        </div>
        <div>
          <p className="text-sub">지급금액</p>
          <p className="font-medium mt-0.5">
            {Number(purchase.paidAmount).toLocaleString('ko-KR')}원
          </p>
        </div>
        <div>
          <p className="text-sub">매입일</p>
          <p className="font-medium mt-0.5">
            {purchase.purchaseDate.toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div>
          <p className="text-sub">지급예정일</p>
          <p className="font-medium mt-0.5">
            {purchase.dueDate ? purchase.dueDate.toLocaleDateString('ko-KR') : '—'}
          </p>
        </div>
        <div>
          <p className="text-sub">지급일</p>
          <p className="font-medium mt-0.5">
            {purchase.paidDate ? purchase.paidDate.toLocaleDateString('ko-KR') : '—'}
          </p>
        </div>
        <div>
          <p className="text-sub">상태</p>
          <div className="mt-0.5">
            <Badge variant={STATUS_BADGE[purchase.status] ?? 'gray'}>
              {STATUS_LABEL[purchase.status] ?? purchase.status}
            </Badge>
          </div>
        </div>
        {purchase.notes && (
          <div className="col-span-2">
            <p className="text-sub">메모</p>
            <p className="font-medium mt-0.5 whitespace-pre-wrap">{purchase.notes}</p>
          </div>
        )}
      </div>

      {/* Payment section */}
      {!isPaid && (
        <PaymentForm
          purchaseId={purchase.id}
          totalAmount={purchase.totalAmount.toString()}
          paidAmount={purchase.paidAmount.toString()}
        />
      )}
    </div>
  )
}
