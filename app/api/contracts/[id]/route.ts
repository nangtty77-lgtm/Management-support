import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageContracts } from '@/lib/permissions'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!canManageContracts(session)) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      alerts: true,
      tasks: { include: { assignee: { select: { name: true } } } },
    },
  })
  if (!contract) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json({ ...contract, amount: contract.amount.toString() })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!canManageContracts(session)) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const contract = await db.contract.update({
    where: { id },
    data: {
      name: body.name,
      vendorName: body.vendorName,
      amount: body.amount ? BigInt(body.amount) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: body.status,
      notes: body.notes,
      fileUrl: body.fileUrl,
    },
  })
  return NextResponse.json({ ...contract, amount: contract.amount.toString() })
}
