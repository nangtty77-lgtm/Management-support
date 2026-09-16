import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const customers = await db.customer.findMany({
    include: {
      assignee: { select: { name: true } },
      _count: { select: { opportunities: true, visits: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const customer = await db.customer.create({
    data: {
      name: body.name,
      companyName: body.companyName || null,
      phone: body.phone || null,
      email: body.email || null,
      address: body.address || null,
      industry: body.industry || null,
      grade: body.grade || 'NORMAL',
      status: body.status || 'ACTIVE',
      assigneeId: body.assigneeId || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(customer, { status: 201 })
}
