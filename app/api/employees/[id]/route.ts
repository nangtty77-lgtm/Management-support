import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params
  const emp = await db.employee.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, role: true } },
      department: { select: { name: true } },
      leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  if (!emp) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json(emp)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const emp = await db.employee.update({
    where: { id },
    data: {
      position: body.position,
      phone: body.phone,
      status: body.status,
      annualLeave: body.annualLeave,
      departmentId: body.departmentId,
    },
    include: { user: { select: { name: true, email: true } }, department: { select: { name: true } } },
  })
  return NextResponse.json(emp)
}
