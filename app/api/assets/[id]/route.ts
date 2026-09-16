import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

function ser(a: { purchasePrice: bigint | null; currentValue: bigint | null; [k: string]: unknown }) {
  return { ...a, purchasePrice: a.purchasePrice?.toString() ?? null, currentValue: a.currentValue?.toString() ?? null }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const asset = await db.asset.findUnique({
    where: { id },
    include: { assignee: { select: { id: true, name: true } } },
  })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ser(asset))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const asset = await db.asset.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      code: body.code ?? undefined,
      category: body.category ?? undefined,
      status: body.status ?? undefined,
      purchaseDate: body.purchaseDate !== undefined ? (body.purchaseDate ? new Date(body.purchaseDate) : null) : undefined,
      purchasePrice: body.purchasePrice !== undefined ? (body.purchasePrice ? BigInt(body.purchasePrice) : null) : undefined,
      currentValue: body.currentValue !== undefined ? (body.currentValue ? BigInt(body.currentValue) : null) : undefined,
      location: body.location ?? undefined,
      assigneeId: body.assigneeId ?? undefined,
      vendor: body.vendor ?? undefined,
      serialNo: body.serialNo ?? undefined,
      notes: body.notes ?? undefined,
      disposedAt: body.status === 'DISPOSED' ? new Date() : undefined,
    },
  })
  return NextResponse.json(ser(asset))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await db.asset.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
