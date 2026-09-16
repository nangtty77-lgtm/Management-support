import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

function serializeExpense(e: {
  id: string
  type: string
  title: string
  amount: bigint
  expenseDate: Date
  paidById: string
  status: string
  receiptUrl: string | null
  notes: string | null
  approvedById: string | null
  approvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return { ...e, amount: e.amount.toString() }
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { id } = await params
  const expense = await db.expense.findUnique({
    where: { id },
    include: {
      paidBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
  })
  if (!expense) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json(serializeExpense(expense))
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { id } = await params
  const body = (await req.json()) as {
    status?: string
    notes?: string
    receiptUrl?: string
  }
  const data: Record<string, unknown> = {}
  if (body.status !== undefined) {
    data.status = body.status
    if (body.status === 'APPROVED') {
      data.approvedById = session.user.id
      data.approvedAt = new Date()
    }
  }
  if (body.notes !== undefined) data.notes = body.notes
  if (body.receiptUrl !== undefined) data.receiptUrl = body.receiptUrl
  const expense = await db.expense.update({ where: { id }, data })
  return NextResponse.json(serializeExpense(expense))
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { id } = await params
  await db.expense.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
