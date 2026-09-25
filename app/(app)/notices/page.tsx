import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NoticesClient } from './NoticesClient'

export default async function NoticesPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const notices = await db.notice.findMany({
    include: {
      author: { select: { id: true, name: true } },
      reads: { where: { userId: session.user.id }, select: { id: true } },
      _count: { select: { reads: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <NoticesClient
      notices={notices.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        isPinned: n.isPinned,
        author: n.author,
        createdAt: n.createdAt.toISOString(),
        isRead: n.reads.length > 0,
        readCount: n._count.reads,
      }))}
      canWrite={['ADMIN', 'HR', 'GENERAL'].includes(session.user.role)}
      currentUserId={session.user.id}
      isAdmin={session.user.role === 'ADMIN'}
    />
  )
}
