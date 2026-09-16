import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const expenses = await db.expense.findMany({
    include: {
      paidBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: { expenseDate: 'desc' },
  })
  return NextResponse.json(expenses.map((e) => ({ ...e, amount: e.amount.toString() })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const body = (await req.json()) as {
    type: string
    title: string
    amount: string | number
    expenseDate: string
    notes?: string
    receiptUrl?: string
  }
  const expense = await db.expense.create({
    data: {
      type: body.type as
        | 'CORPORATE_CARD'
        | 'PERSONAL'
        | 'TRAVEL'
        | 'ENTERTAINMENT'
        | 'VEHICLE'
        | 'SUPPLIES'
        | 'OTHER',
      title: body.title,
      amount: BigInt(body.amount),
      expenseDate: new Date(body.expenseDate),
      paidById: session.user.id,
      notes: body.notes,
      receiptUrl: body.receiptUrl,
    },
  })
  return NextResponse.json({ ...expense, amount: expense.amount.toString() }, { status: 201 })
}
