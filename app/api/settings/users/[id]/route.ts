import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const { role, active } = body

  const updates: Record<string, unknown> = {}
  if (role !== undefined) updates.role = role
  if (active !== undefined) updates.active = active

  const updated = await db.user.update({
    where: { id },
    data: updates,
    select: { id: true, name: true, email: true, role: true, active: true },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (id === session.user.id) return NextResponse.json({ error: '자신의 계정은 삭제할 수 없습니다' }, { status: 400 })

  await db.user.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
