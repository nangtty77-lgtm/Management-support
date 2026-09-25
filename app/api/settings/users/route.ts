import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, department: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, role, password } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })

  const bcrypt = await import('bcryptjs')
  const hashed = await bcrypt.default.hash(password, 12)

  try {
    const user = await db.user.create({
      data: { name, email, role: role ?? 'VIEW', password: hashed },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch {
    return NextResponse.json({ error: '이미 사용 중인 이메일입니다' }, { status: 400 })
  }
}
