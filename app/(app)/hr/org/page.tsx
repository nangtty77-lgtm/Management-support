import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { OrgClient } from './OrgClient'

export default async function OrgPage() {
  const session = await auth()
  if (!session) return null

  const departments = await db.department.findMany({
    include: {
      employees: {
        include: {
          user: { select: { name: true, email: true } },
        },
        where: { status: { not: 'RESIGNED' } },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <OrgClient
      departments={departments.map(d => ({
        id: d.id,
        name: d.name,
        employees: d.employees.map(e => ({
          id: e.id,
          name: e.user.name,
          email: e.user.email,
          position: e.position,
          status: e.status,
          hireDate: e.hireDate.toISOString(),
        })),
      }))}
    />
  )
}
