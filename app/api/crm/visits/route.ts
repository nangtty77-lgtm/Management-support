import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const visits = await db.visit.findMany({
    include: {
      customer: { select: { name: true, companyName: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { visitDate: 'desc' },
  })
  return NextResponse.json(visits)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const visit = await db.visit.create({
    data: {
      customerId: body.customerId,
      title: body.title,
      visitDate: new Date(body.visitDate),
      status: body.status || 'PLANNED',
      result: body.result || null,
      nextAction: body.nextAction || null,
      assigneeId: body.assigneeId || session.user?.id || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(visit, { status: 201 })
}
