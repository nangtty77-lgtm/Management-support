import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageHR } from '@/lib/permissions'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const isHRorAdmin = canManageHR(session)
  const where = isHRorAdmin
    ? {}
    : { employee: { userId: session.user.id } }

  const leaves = await db.leaveRequest.findMany({
    where,
    include: {
      employee: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(leaves)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json()
  const employee = await db.employee.findUnique({ where: { userId: session.user.id } })
  if (!employee) return NextResponse.json({ error: '직원 정보 없음' }, { status: 400 })

  const leave = await db.leaveRequest.create({
    data: {
      employeeId: employee.id,
      type: body.type,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      days: body.days,
      reason: body.reason,
    },
  })

  // Notify HR/ADMIN users
  const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'HR'] }, active: true } })
  await db.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: 'LEAVE_REQUEST',
      title: '연차 승인 요청',
      message: `${session.user.name ?? '알 수 없음'}님이 연차를 신청했습니다. (${body.days}일)`,
      link: '/leaves',
    })),
  })

  return NextResponse.json(leave, { status: 201 })
}
