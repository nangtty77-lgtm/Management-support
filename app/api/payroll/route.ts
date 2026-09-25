import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl
  const year = parseInt(url.searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(url.searchParams.get('month') ?? String(new Date().getMonth() + 1))

  const payrolls = await db.payroll.findMany({
    where: { year, month },
    include: {
      employee: {
        include: {
          user: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { employee: { user: { name: 'asc' } } },
  })

  return NextResponse.json(payrolls.map(p => ({
    id: p.id,
    employeeId: p.employeeId,
    employeeName: p.employee.user.name,
    position: p.employee.position,
    department: p.employee.department.name,
    year: p.year,
    month: p.month,
    baseSalary: p.baseSalary.toString(),
    bonus: p.bonus.toString(),
    deduction: p.deduction.toString(),
    netPay: p.netPay.toString(),
    status: p.status,
    paidAt: p.paidAt?.toISOString() ?? null,
    notes: p.notes,
  })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { employeeId, year, month, baseSalary, bonus = 0, deduction = 0, notes } = body

  const base = BigInt(baseSalary)
  const bon = BigInt(bonus)
  const ded = BigInt(deduction)
  const net = base + bon - ded

  const payroll = await db.payroll.upsert({
    where: { employeeId_year_month: { employeeId, year, month } },
    create: { employeeId, year, month, baseSalary: base, bonus: bon, deduction: ded, netPay: net, notes },
    update: { baseSalary: base, bonus: bon, deduction: ded, netPay: net, notes },
  })

  return NextResponse.json({ ...payroll, baseSalary: payroll.baseSalary.toString(), bonus: payroll.bonus.toString(), deduction: payroll.deduction.toString(), netPay: payroll.netPay.toString() })
}
