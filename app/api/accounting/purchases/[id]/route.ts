import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

function serializePurchase(p: {
  id: string
  vendorId: string
  title: string
  amount: bigint
  taxAmount: bigint
  totalAmount: bigint
  purchaseDate: Date
  dueDate: Date | null
  paidDate: Date | null
  paidAmount: bigint
  status: string
  notes: string | null
  assigneeId: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...p,
    amount: p.amount.toString(),
    taxAmount: p.taxAmount.toString(),
    totalAmount: p.totalAmount.toString(),
    paidAmount: p.paidAmount.toString(),
  }
}

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { id } = await params
  const purchase = await db.purchase.findUnique({
    where: { id },
    include: { vendor: { select: { name: true } }, assignee: { select: { name: true } } },
  })
  if (!purchase) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json(serializePurchase(purchase))
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
    paidAmount?: string | number
    paidDate?: string
    notes?: string
  }
  const data: Record<string, unknown> = {}
  if (body.status !== undefined) data.status = body.status
  if (body.paidAmount !== undefined) data.paidAmount = BigInt(body.paidAmount)
  if (body.paidDate !== undefined) data.paidDate = body.paidDate ? new Date(body.paidDate) : null
  if (body.notes !== undefined) data.notes = body.notes
  const purchase = await db.purchase.update({ where: { id }, data })
  return NextResponse.json(serializePurchase(purchase))
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { id } = await params
  await db.purchase.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
