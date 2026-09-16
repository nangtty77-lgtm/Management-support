import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const opportunities = await db.opportunity.findMany({
    include: {
      customer: { select: { name: true, companyName: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(
    opportunities.map((o) => ({ ...o, amount: o.amount.toString() })),
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const opp = await db.opportunity.create({
    data: {
      customerId: body.customerId,
      title: body.title,
      amount: BigInt(body.amount || 0),
      stage: body.stage || 'LEAD',
      probability: Number(body.probability || 0),
      expectedClose: body.expectedClose ? new Date(body.expectedClose) : null,
      assigneeId: body.assigneeId || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json({ ...opp, amount: opp.amount.toString() }, { status: 201 })
}
