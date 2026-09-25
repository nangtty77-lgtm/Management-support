import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { MyPageClient } from './MyPageClient'

export default async function MyPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const now = new Date()
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [myTasks, employee, notifications, recentNotices] = await Promise.all([
    db.task.findMany({
      where: { assigneeId: userId, status: { not: 'COMPLETED' } },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
      take: 10,
    }),
    db.employee.findUnique({
      where: { userId },
      include: {
        department: { select: { name: true } },
        leaveRequests: {
          where: { status: 'APPROVED' },
          select: { days: true },
        },
      },
    }),
    db.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    db.notice.findMany({
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: {
        author: { select: { name: true } },
        reads: { where: { userId }, select: { id: true } },
      },
    }),
  ])

  const usedLeave = employee?.leaveRequests.reduce((s, r) => s + r.days, 0) ?? 0
  const annualLeave = employee?.annualLeave ?? 0
  const remainingLeave = annualLeave - usedLeave

  const dueSoon = myTasks.filter(t => t.dueDate && t.dueDate <= weekLater && t.dueDate >= now)
  const overdue = myTasks.filter(t => t.dueDate && t.dueDate < now)

  return (
    <MyPageClient
      user={{
        name: session.user.name ?? '사용자',
        email: session.user.email ?? '',
        role: session.user.role,
        department: employee?.department.name ?? null,
        position: employee?.position ?? null,
      }}
      tasks={myTasks.map(t => ({
        id: t.id, title: t.title, status: t.status, priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
      }))}
      leave={{ annual: annualLeave, used: usedLeave, remaining: remainingLeave }}
      unreadNotifications={notifications.map(n => ({
        id: n.id, title: n.title, message: n.message, type: n.type, createdAt: n.createdAt.toISOString(), link: n.link,
      }))}
      recentNotices={recentNotices.map(n => ({
        id: n.id, title: n.title, isPinned: n.isPinned, authorName: n.author.name,
        createdAt: n.createdAt.toISOString(), isRead: n.reads.length > 0,
      }))}
      dueSoonCount={dueSoon.length}
      overdueCount={overdue.length}
      today={now.toISOString()}
    />
  )
}
