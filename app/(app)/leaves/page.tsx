import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { canManageHR } from '@/lib/permissions'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import LeaveApprovalButton from './_components/LeaveApprovalButton'

const TYPE_LABEL: Record<string, string> = { ANNUAL: '연차', SICK: '병가', SPECIAL: '특별', UNPAID: '무급' }
const STATUS_BADGE: Record<string, 'gray' | 'teal' | 'danger'> = { PENDING: 'gray', APPROVED: 'teal', REJECTED: 'danger' }
const STATUS_LABEL: Record<string, string> = { PENDING: '대기', APPROVED: '승인', REJECTED: '반려' }

export default async function LeavesPage() {
  const session = await auth()
  if (!session?.user?.id) return null
  const isHRorAdmin = canManageHR(session)
  const where = isHRorAdmin ? {} : { employee: { userId: session?.user?.id } }

  const leaves = await db.leaveRequest.findMany({
    where,
    include: { employee: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">연차관리</h1>
        <Link href="/leaves/new" className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90">
          + 연차 신청
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['신청자', '구분', '기간', '일수', '사유', '상태', isHRorAdmin ? '처리' : ''].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-sub font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {leaves.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-navy">{l.employee.user.name}</td>
                <td className="px-4 py-3">{TYPE_LABEL[l.type]}</td>
                <td className="px-4 py-3 text-sub">{l.startDate.toLocaleDateString('ko-KR')} ~ {l.endDate.toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3 text-sub">{l.days}일</td>
                <td className="px-4 py-3 text-sub">{l.reason ?? '—'}</td>
                <td className="px-4 py-3"><Badge variant={STATUS_BADGE[l.status]}>{STATUS_LABEL[l.status]}</Badge></td>
                {isHRorAdmin && (
                  <td className="px-4 py-3">
                    {l.status === 'PENDING' && <LeaveApprovalButton leaveId={l.id} />}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
