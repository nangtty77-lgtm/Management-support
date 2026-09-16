import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true } },
      opportunities: { orderBy: { createdAt: 'desc' }, take: 10 },
      visits: { orderBy: { visitDate: 'desc' }, take: 10 },
    },
  })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const customer = await db.customer.update({
    where: { id },
    data: {
      name: body.name,
      companyName: body.companyName ?? undefined,
      phone: body.phone ?? undefined,
      email: body.email ?? undefined,
      address: body.address ?? undefined,
      industry: body.industry ?? undefined,
      grade: body.grade ?? undefined,
      status: body.status ?? undefined,
      assigneeId: body.assigneeId ?? undefined,
      notes: body.notes ?? undefined,
    },
  })
  return NextResponse.json(customer)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.customer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
