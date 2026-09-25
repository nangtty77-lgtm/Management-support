import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { MeetingsClient } from './MeetingsClient'

export default async function MeetingsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [meetings, users] = await Promise.all([
    db.meeting.findMany({
      where: { startAt: { gte: monthStart, lte: monthEnd } },
      include: {
        organizer: { select: { id: true, name: true } },
        attendees: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: { startAt: 'asc' },
    }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <MeetingsClient
      meetings={meetings.map(m => ({
        id: m.id, title: m.title, description: m.description ?? '',
        startAt: m.startAt.toISOString(), endAt: m.endAt.toISOString(),
        location: m.location ?? '', status: m.status,
        organizerId: m.organizer.id, organizerName: m.organizer.name,
        attendees: m.attendees.map(a => ({ id: a.user.id, name: a.user.name, confirmed: a.confirmed })),
      }))}
      users={users.map(u => ({ id: u.id, name: u.name }))}
      currentUserId={session.user.id}
      today={now.toISOString()}
    />
  )
}
