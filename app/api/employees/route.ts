import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageHR } from '@/lib/permissions'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const employees = await db.employee.findMany({
    include: {
      user: { select: { name: true, email: true, role: true } },
      department: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!canManageHR(session)) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await req.json()
  const { name, email, password, departmentId, position, phone, hireDate, status, annualLeave } = body

  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.hash(password || 'bizhub1234!', 12)

  const user = await db.user.create({
    data: { name, email, password: hash, role: 'VIEW', departmentId },
  })
  const employee = await db.employee.create({
    data: { userId: user.id, departmentId, position, phone, hireDate: new Date(hireDate), status, annualLeave: annualLeave ?? 15 },
    include: { user: { select: { name: true, email: true } }, department: { select: { name: true } } },
  })
  return NextResponse.json(employee, { status: 201 })
}
