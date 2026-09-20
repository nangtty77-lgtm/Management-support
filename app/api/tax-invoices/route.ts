import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const type = searchParams.get('type')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (type) where.type = type
  if (status) where.status = status
  if (year) {
    where.issueDate = {
      gte: new Date(`${year}-01-01`),
      lte: new Date(`${year}-12-31`),
    }
  }

  const invoices = await db.taxInvoice.findMany({
    where,
    include: { vendor: { select: { id: true, name: true } } },
    orderBy: { issueDate: 'desc' },
  })

  return NextResponse.json(
    invoices.map((inv) => ({
      ...inv,
      amount: inv.amount.toString(),
      taxAmount: inv.taxAmount.toString(),
      totalAmount: inv.totalAmount.toString(),
      issueDate: inv.issueDate.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    })),
  )
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, invoiceNo, issueDate, amount, taxAmount, totalAmount, description, notes, status, vendorId, saleId, purchaseId } = body

  const invoice = await db.taxInvoice.create({
    data: {
      type,
      invoiceNo: invoiceNo || null,
      issueDate: new Date(issueDate),
      amount: BigInt(amount),
      taxAmount: BigInt(taxAmount),
      totalAmount: BigInt(totalAmount),
      description: description || null,
      notes: notes || null,
      status: status || 'DRAFT',
      vendorId: vendorId || null,
      saleId: saleId || null,
      purchaseId: purchaseId || null,
      createdById: session.user.id,
    },
    include: { vendor: { select: { id: true, name: true } } },
  })

  return NextResponse.json({
    ...invoice,
    amount: invoice.amount.toString(),
    taxAmount: invoice.taxAmount.toString(),
    totalAmount: invoice.totalAmount.toString(),
    issueDate: invoice.issueDate.toISOString(),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  })
}
