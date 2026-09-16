import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '재직', PROBATION: '수습', LEAVE: '휴직', RESIGNED: '퇴직',
}
const LEAVE_LABEL: Record<string, string> = {
  ANNUAL: '연차', SICK: '병가', SPECIAL: '특별', UNPAID: '무급',
}
const APPROVAL_BADGE: Record<string, 'gray' | 'teal' | 'danger'> = {
  PENDING: 'gray', APPROVED: 'teal', REJECTED: 'danger',
}
const APPROVAL_LABEL: Record<string, string> = {
  PENDING: '대기', APPROVED: '승인', REJECTED: '반려',
}

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await auth()
  const { id } = await params
  const emp = await db.employee.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, role: true } },
      department: true,
      leaveRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  if (!emp) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-navy">{emp.user.name}</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-sub">이메일</span><p className="font-medium">{emp.user.email}</p></div>
        <div><span className="text-sub">부서</span><p className="font-medium">{emp.department.name}</p></div>
        <div><span className="text-sub">직급</span><p className="font-medium">{emp.position}</p></div>
        <div><span className="text-sub">연락처</span><p className="font-medium">{emp.phone ?? '—'}</p></div>
        <div><span className="text-sub">입사일</span><p className="font-medium">{emp.hireDate.toLocaleDateString('ko-KR')}</p></div>
        <div><span className="text-sub">재직상태</span><p className="font-medium">{STATUS_LABEL[emp.status]}</p></div>
        <div><span className="text-sub">연차</span><p className="font-medium">{emp.usedLeave}/{emp.annualLeave}일 사용</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-navy mb-3">연차 신청 내역</h2>
        {emp.leaveRequests.length === 0 ? (
          <p className="text-sm text-sub">신청 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y text-sm">
            {emp.leaveRequests.map((lr) => (
              <li key={lr.id} className="py-2 flex items-center justify-between">
                <span>{LEAVE_LABEL[lr.type]} · {lr.startDate.toLocaleDateString('ko-KR')} ~ {lr.endDate.toLocaleDateString('ko-KR')} ({lr.days}일)</span>
                <Badge variant={APPROVAL_BADGE[lr.status]}>{APPROVAL_LABEL[lr.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
