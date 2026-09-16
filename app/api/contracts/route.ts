import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageContracts } from '@/lib/permissions'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const contracts = await db.contract.findMany({
    include: { owner: { select: { name: true } } },
    orderBy: { endDate: 'asc' },
  })
  return NextResponse.json(
    contracts.map((c) => ({ ...c, amount: c.amount.toString() }))
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!canManageContracts(session)) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await req.json()
  const contract = await db.contract.create({
    data: {
      name: body.name,
      vendorName: body.vendorName,
      amount: BigInt(body.amount),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      autoRenewal: body.autoRenewal ?? false,
      ownerId: session.user.id,
      notes: body.notes,
      status: body.status ?? 'ACTIVE',
    },
  })

  // Create 90/60/30 day alerts
  await db.contractAlert.createMany({
    data: [90, 60, 30].map((days) => ({
      contractId: contract.id,
      alertDays: days,
    })),
  })

  return NextResponse.json({ ...contract, amount: contract.amount.toString() }, { status: 201 })
}
