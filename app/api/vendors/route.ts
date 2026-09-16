import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const vendors = await db.vendor.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(vendors)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const body = await req.json()
  const vendor = await db.vendor.create({
    data: {
      name: body.name,
      bizNo: body.bizNo,
      ceoName: body.ceoName,
      address: body.address,
      phone: body.phone,
      email: body.email,
      type: body.type ?? 'BOTH',
    },
  })
  return NextResponse.json(vendor, { status: 201 })
}
