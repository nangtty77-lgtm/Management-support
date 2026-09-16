import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const assets = await db.asset.findMany({
    include: { assignee: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(
    assets.map((a) => ({
      ...a,
      purchasePrice: a.purchasePrice?.toString() ?? null,
      currentValue: a.currentValue?.toString() ?? null,
    })),
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const asset = await db.asset.create({
    data: {
      name: body.name,
      code: body.code || null,
      category: body.category,
      status: body.status || 'IN_USE',
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchasePrice: body.purchasePrice ? BigInt(body.purchasePrice) : null,
      currentValue: body.currentValue ? BigInt(body.currentValue) : null,
      location: body.location || null,
      assigneeId: body.assigneeId || null,
      vendor: body.vendor || null,
      serialNo: body.serialNo || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(
    { ...asset, purchasePrice: asset.purchasePrice?.toString() ?? null, currentValue: asset.currentValue?.toString() ?? null },
    { status: 201 },
  )
}
