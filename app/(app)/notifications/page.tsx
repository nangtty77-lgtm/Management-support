import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const TYPE_LABEL: Record<string, string> = {
  CONTRACT_EXPIRY: '계약만료',
  LEAVE_REQUEST: '연차신청',
  TASK_DUE: '업무마감',
  TASK_ASSIGNED: '업무배정',
  LEAVE_APPROVED: '연차승인',
  SYSTEM: '시스템',
}
const TYPE_BADGE: Record<string, 'danger' | 'warning' | 'teal' | 'gray' | 'navy'> = {
  CONTRACT_EXPIRY: 'danger',
  LEAVE_REQUEST: 'warning',
  TASK_DUE: 'warning',
  TASK_ASSIGNED: 'teal',
  LEAVE_APPROVED: 'teal',
  SYSTEM: 'gray',
}

export default async function NotificationsPage() {
  const session = await auth()
  const notifications = await db.notification.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-navy">알림센터</h1>
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-sub">알림이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 ${n.read ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <Badge variant={TYPE_BADGE[n.type]}>{TYPE_LABEL[n.type]}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-navy">{n.title}</p>
                  <p className="text-sm text-sub mt-0.5">{n.message}</p>
                  <p className="text-xs text-sub mt-1">{n.createdAt.toLocaleString('ko-KR')}</p>
                </div>
                {n.link && (
                  <Link href={n.link} className="text-teal text-sm hover:underline shrink-0">
                    보기
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
