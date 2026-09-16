import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const sales = await db.sale.findMany({
    include: { vendor: { select: { name: true } }, assignee: { select: { name: true } } },
    orderBy: { saleDate: 'desc' },
  })
  return NextResponse.json(
    sales.map((s) => ({
      ...s,
      amount: s.amount.toString(),
      taxAmount: s.taxAmount.toString(),
      totalAmount: s.totalAmount.toString(),
      paidAmount: s.paidAmount.toString(),
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
    saleDate: string
    dueDate?: string
    status?: string
    notes?: string
    assigneeId?: string
  }
  const sale = await db.sale.create({
    data: {
      vendorId: body.vendorId,
      title: body.title,
      amount: BigInt(body.amount),
      taxAmount: BigInt(body.taxAmount ?? 0),
      totalAmount: BigInt(body.totalAmount),
      saleDate: new Date(body.saleDate),
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: (body.status as 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE') ?? 'UNPAID',
      notes: body.notes,
      assigneeId: body.assigneeId || null,
    },
  })
  return NextResponse.json(
    {
      ...sale,
      amount: sale.amount.toString(),
      taxAmount: sale.taxAmount.toString(),
      totalAmount: sale.totalAmount.toString(),
      paidAmount: sale.paidAmount.toString(),
    },
    { status: 201 },
  )
}
