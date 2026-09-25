import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PayrollClient } from './PayrollClient'

export default async function PayrollPage() {
  const session = await auth()
  if (!session) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [employees, payrolls] = await Promise.all([
    db.employee.findMany({
      where: { status: { not: 'RESIGNED' } },
      include: {
        user: { select: { name: true } },
        department: { select: { name: true } },
      },
      orderBy: { user: { name: 'asc' } },
    }),
    db.payroll.findMany({
      where: { year, month },
      include: {
        employee: {
          include: {
            user: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
    }),
  ])

  const canManage = ['ADMIN', 'HR'].includes(session.user.role)

  return (
    <PayrollClient
      employees={employees.map(e => ({
        id: e.id,
        name: e.user.name,
        position: e.position,
        department: e.department.name,
      }))}
      payrolls={payrolls.map(p => ({
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
        notes: p.notes ?? '',
      }))}
      initialYear={year}
      initialMonth={month}
      canManage={canManage}
    />
  )
}
