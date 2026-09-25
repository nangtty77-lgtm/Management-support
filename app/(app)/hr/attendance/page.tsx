import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { AttendanceClient } from './AttendanceClient'

export default async function AttendancePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0, 23, 59, 59)

  const [employees, attendances] = await Promise.all([
    db.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { user: { name: 'asc' } },
    }),
    db.attendance.findMany({
      where: { date: { gte: from, lte: to } },
      include: { employee: { include: { user: { select: { name: true } } } } },
      orderBy: { date: 'asc' },
    }),
  ])

  const myEmployee = employees.find(e => e.userId === session.user.id)

  return (
    <AttendanceClient
      employees={employees.map(e => ({ id: e.id, name: e.user.name, userId: e.userId }))}
      attendances={attendances.map(a => ({
        id: a.id,
        employeeId: a.employeeId,
        employeeName: a.employee.user.name,
        date: a.date.toISOString(),
        checkIn: a.checkIn?.toISOString() ?? null,
        checkOut: a.checkOut?.toISOString() ?? null,
        status: a.status,
        notes: a.notes ?? '',
      }))}
      myEmployeeId={myEmployee?.id ?? null}
      currentUserId={session.user.id}
      isAdmin={['ADMIN', 'HR'].includes(session.user.role)}
      today={now.toISOString()}
      initialYear={year}
      initialMonth={month}
    />
  )
}
