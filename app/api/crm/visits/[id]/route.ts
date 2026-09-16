import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const visit = await db.visit.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      assignee: { select: { id: true, name: true } },
    },
  })
  if (!visit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(visit)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const visit = await db.visit.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      visitDate: body.visitDate ? new Date(body.visitDate) : undefined,
      status: body.status ?? undefined,
      result: body.result ?? undefined,
      nextAction: body.nextAction ?? undefined,
      assigneeId: body.assigneeId ?? undefined,
      notes: body.notes ?? undefined,
    },
  })
  return NextResponse.json(visit)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.visit.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
