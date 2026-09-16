import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') ? Number(searchParams.get('year')) : new Date().getFullYear()

  const budgets = await db.budget.findMany({
    where: { year },
    include: { department: { select: { name: true } } },
    orderBy: [{ category: 'asc' }, { month: 'asc' }],
  })
  return NextResponse.json(
    budgets.map((b) => ({
      ...b,
      amount: b.amount.toString(),
      usedAmount: b.usedAmount.toString(),
    })),
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const budget = await db.budget.create({
    data: {
      year: Number(body.year),
      month: body.month ? Number(body.month) : null,
      category: body.category,
      title: body.title,
      amount: BigInt(body.amount || 0),
      usedAmount: BigInt(0),
      departmentId: body.departmentId || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(
    { ...budget, amount: budget.amount.toString(), usedAmount: budget.usedAmount.toString() },
    { status: 201 },
  )
}
