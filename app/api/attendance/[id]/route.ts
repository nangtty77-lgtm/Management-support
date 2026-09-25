import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { checkIn, checkOut, status, notes } = body

  const updated = await db.attendance.update({
    where: { id },
    data: {
      ...(checkIn !== undefined ? { checkIn: checkIn ? new Date(checkIn) : null } : {}),
      ...(checkOut !== undefined ? { checkOut: checkOut ? new Date(checkOut) : null } : {}),
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  return NextResponse.json({ ...updated, date: updated.date.toISOString(), checkIn: updated.checkIn?.toISOString() ?? null, checkOut: updated.checkOut?.toISOString() ?? null })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'HR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await db.attendance.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
