import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CalendarClient } from './CalendarClient'

export default async function TaskCalendarPage() {
  const session = await auth()
  if (!session) return null

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59)

  const tasks = await db.task.findMany({
    where: { dueDate: { gte: start, lte: end } },
    select: {
      id: true, title: true, status: true, priority: true, dueDate: true,
      assignee: { select: { name: true } },
    },
    orderBy: { dueDate: 'asc' },
  })

  return (
    <CalendarClient
      tasks={tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate!.toISOString(),
        assigneeName: t.assignee?.name ?? null,
      }))}
      today={now.toISOString()}
    />
  )
}
