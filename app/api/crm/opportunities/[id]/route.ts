import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const opp = await db.opportunity.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      assignee: { select: { id: true, name: true } },
    },
  })
  if (!opp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ...opp, amount: opp.amount.toString() })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const opp = await db.opportunity.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      amount: body.amount !== undefined ? BigInt(body.amount) : undefined,
      stage: body.stage ?? undefined,
      probability: body.probability !== undefined ? Number(body.probability) : undefined,
      expectedClose: body.expectedClose !== undefined ? (body.expectedClose ? new Date(body.expectedClose) : null) : undefined,
      assigneeId: body.assigneeId ?? undefined,
      notes: body.notes ?? undefined,
    },
  })
  return NextResponse.json({ ...opp, amount: opp.amount.toString() })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.opportunity.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
