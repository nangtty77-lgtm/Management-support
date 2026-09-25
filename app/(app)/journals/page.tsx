import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { JournalsClient } from './JournalsClient'

export default async function JournalsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [journals, users] = await Promise.all([
    db.workJournal.findMany({
      where: { date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59) } },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    }),
    ['ADMIN', 'HR'].includes(session.user.role)
      ? db.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
      : Promise.resolve([]),
  ])

  return (
    <JournalsClient
      journals={journals.map(j => ({
        id: j.id, authorId: j.authorId, authorName: j.author.name,
        date: j.date.toISOString(), content: j.content,
        tasks: j.tasks ?? '', plan: j.plan ?? '', issues: j.issues ?? '', mood: j.mood,
        createdAt: j.createdAt.toISOString(),
      }))}
      users={users.map(u => ({ id: u.id, name: u.name }))}
      currentUserId={session.user.id}
      isAdmin={['ADMIN', 'HR'].includes(session.user.role)}
      today={now.toISOString()}
    />
  )
}
