import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

function serialize(inv: Record<string, unknown>) {
  return {
    ...inv,
    amount: inv.amount?.toString(),
    taxAmount: inv.taxAmount?.toString(),
    totalAmount: inv.totalAmount?.toString(),
    issueDate: inv.issueDate instanceof Date ? inv.issueDate.toISOString() : inv.issueDate,
    createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt,
    updatedAt: inv.updatedAt instanceof Date ? inv.updatedAt.toISOString() : inv.updatedAt,
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const inv = await db.taxInvoice.findUnique({
    where: { id },
    include: {
      vendor: { select: { id: true, name: true, bizNo: true } },
      sale: { select: { id: true, title: true } },
      purchase: { select: { id: true, title: true } },
    },
  })
  if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(serialize(inv as unknown as Record<string, unknown>))
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.type !== undefined) data.type = body.type
  if (body.invoiceNo !== undefined) data.invoiceNo = body.invoiceNo || null
  if (body.issueDate !== undefined) data.issueDate = new Date(body.issueDate)
  if (body.amount !== undefined) data.amount = BigInt(body.amount)
  if (body.taxAmount !== undefined) data.taxAmount = BigInt(body.taxAmount)
  if (body.totalAmount !== undefined) data.totalAmount = BigInt(body.totalAmount)
  if (body.description !== undefined) data.description = body.description || null
  if (body.notes !== undefined) data.notes = body.notes || null
  if (body.status !== undefined) data.status = body.status
  if (body.vendorId !== undefined) data.vendorId = body.vendorId || null
  if (body.saleId !== undefined) data.saleId = body.saleId || null
  if (body.purchaseId !== undefined) data.purchaseId = body.purchaseId || null

  const inv = await db.taxInvoice.update({ where: { id }, data })
  return NextResponse.json(serialize(inv as unknown as Record<string, unknown>))
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await db.taxInvoice.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
