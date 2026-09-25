import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { status, paidAt } = body

  const updated = await db.payroll.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(paidAt !== undefined && { paidAt: paidAt ? new Date(paidAt) : null }),
    },
  })

  return NextResponse.json({
    ...updated,
    baseSalary: updated.baseSalary.toString(),
    bonus: updated.bonus.toString(),
    deduction: updated.deduction.toString(),
    netPay: updated.netPay.toString(),
  })
}
