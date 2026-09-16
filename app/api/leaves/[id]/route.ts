import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageHR } from '@/lib/permissions'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!canManageHR(session)) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const { status } = await req.json()
  const leave = await db.leaveRequest.update({
    where: { id },
    data: { status, approverId: session.user.id, approvedAt: new Date() },
    include: { employee: { include: { user: { select: { id: true, name: true } } } } },
  })

  // Update usedLeave if approved
  if (status === 'APPROVED' && leave.type === 'ANNUAL') {
    await db.employee.update({
      where: { id: leave.employeeId },
      data: { usedLeave: { increment: leave.days } },
    })
  }

  // Notify employee
  await db.notification.create({
    data: {
      userId: leave.employee.user.id,
      type: 'LEAVE_APPROVED',
      title: status === 'APPROVED' ? '연차 승인' : '연차 반려',
      message: `연차 신청이 ${status === 'APPROVED' ? '승인' : '반려'}되었습니다.`,
      link: '/leaves',
    },
  })

  return NextResponse.json(leave)
}
