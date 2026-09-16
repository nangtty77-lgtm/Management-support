import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const purchases = await db.purchase.findMany({
    include: { vendor: { select: { name: true } }, assignee: { select: { name: true } } },
    orderBy: { purchaseDate: 'desc' },
  })
  return NextResponse.json(
    purchases.map((p) => ({
      ...p,
      amount: p.amount.toString(),
      taxAmount: p.taxAmount.toString(),
      totalAmount: p.totalAmount.toString(),
      paidAmount: p.paidAmount.toString(),
    })),
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const body = (await req.json()) as {
    vendorId: string
    title: string
    amount: string | number
    taxAmount?: string | number
    totalAmount: string | number
    purchaseDate: string
    dueDate?: string
    status?: string
    notes?: string
    assigneeId?: string
  }
  const purchase = await db.purchase.create({
    data: {
      vendorId: body.vendorId,
      title: body.title,
      amount: BigInt(body.amount),
      taxAmount: BigInt(body.taxAmount ?? 0),
      totalAmount: BigInt(body.totalAmount),
      purchaseDate: new Date(body.purchaseDate),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: (body.status as 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE') ?? 'UNPAID',
      notes: body.notes,
      assigneeId: body.assigneeId || null,
    },
  })
  return NextResponse.json(
    {
      ...purchase,
      amount: purchase.amount.toString(),
      taxAmount: purchase.taxAmount.toString(),
      totalAmount: purchase.totalAmount.toString(),
      paidAmount: purchase.paidAmount.toString(),
    },
    { status: 201 },
  )
}
