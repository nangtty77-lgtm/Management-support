import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { id } = await params
  const vendor = await db.vendor.findUnique({
    where: { id },
    include: {
      sales: { orderBy: { saleDate: 'desc' }, take: 10 },
      purchases: { orderBy: { purchaseDate: 'desc' }, take: 10 },
    },
  })
  if (!vendor) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json({
    ...vendor,
    sales: vendor.sales.map(s => ({
      ...s,
      amount: s.amount.toString(),
      taxAmount: s.taxAmount.toString(),
      totalAmount: s.totalAmount.toString(),
      paidAmount: s.paidAmount.toString(),
    })),
    purchases: vendor.purchases.map(p => ({
      ...p,
      amount: p.amount.toString(),
      taxAmount: p.taxAmount.toString(),
      totalAmount: p.totalAmount.toString(),
      paidAmount: p.paidAmount.toString(),
    })),
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const vendor = await db.vendor.update({
    where: { id },
    data: {
      name: body.name,
      bizNo: body.bizNo,
      ceoName: body.ceoName,
      address: body.address,
      phone: body.phone,
      email: body.email,
      type: body.type,
    },
  })
  return NextResponse.json(vendor)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { id } = await params
  await db.vendor.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
