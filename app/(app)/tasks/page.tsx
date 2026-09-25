import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { isViewOnly } from '@/lib/permissions'
import { TasksListClient } from './_components/TasksListClient'

export default async function TasksPage() {
  const session = await auth()
  const canWrite = !isViewOnly(session)

  const tasks = await db.task.findMany({
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })

  return (
    <TasksListClient
      tasks={tasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        assigneeName: t.assignee?.name ?? null,
        creatorName: t.creator.name,
      }))}
      canWrite={canWrite}
    />
  )
}
