import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { KanbanClient } from './KanbanClient'

export default async function TaskKanbanPage() {
  const session = await auth()
  if (!session) return null

  const tasks = await db.task.findMany({
    select: {
      id: true, title: true, status: true, priority: true, dueDate: true,
      assignee: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })

  return (
    <KanbanClient
      tasks={tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        assigneeName: t.assignee?.name ?? null,
        assigneeId: t.assignee?.id ?? null,
        createdByName: t.createdBy?.name ?? null,
      }))}
      today={new Date().toISOString()}
    />
  )
}
