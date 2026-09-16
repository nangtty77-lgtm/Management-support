import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const budget = await db.budget.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      amount: body.amount !== undefined ? BigInt(body.amount) : undefined,
      usedAmount: body.usedAmount !== undefined ? BigInt(body.usedAmount) : undefined,
      notes: body.notes ?? undefined,
    },
  })
  return NextResponse.json({ ...budget, amount: budget.amount.toString(), usedAmount: budget.usedAmount.toString() })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.budget.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
