import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { UsersClient } from './UsersClient'

export default async function UsersPage() {
  const session = await auth()
  if (!session) return null
  if (session.user.role !== 'ADMIN') redirect('/settings/profile')

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, department: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return <UsersClient users={users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() }))} currentUserId={session.user.id} />
}
