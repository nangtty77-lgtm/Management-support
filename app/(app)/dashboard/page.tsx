import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

const PRIORITY_LABEL: Record<string, string> = {
  URGENT: '긴급', HIGH: '높음', NORMAL: '보통', LOW: '낮음',
}
const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'gray' | 'teal'> = {
  URGENT: 'danger', HIGH: 'warning', NORMAL: 'gray', LOW: 'teal',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  const in90Days = new Date(now)
  in90Days.setDate(in90Days.getDate() + 90)

  const [urgentTasks, todayDueTasks, expiringContracts, pendingLeaves, todayTasks, nearExpiry] =
    await Promise.all([
      db.task.count({ where: { priority: 'URGENT', status: { not: 'COMPLETED' } } }),
      db.task.count({ where: { dueDate: { lte: todayEnd }, status: { not: 'COMPLETED' } } }),
      db.contract.count({ where: { endDate: { lte: in90Days, gte: now }, status: 'ACTIVE' } }),
      db.leaveRequest.count({ where: { status: 'PENDING' } }),
      db.task.findMany({
        where: { dueDate: { lte: todayEnd }, status: { not: 'COMPLETED' } },
        include: { assignee: { select: { name: true } } },
        orderBy: { priority: 'asc' },
        take: 10,
      }),
      db.contract.findMany({
        where: { endDate: { lte: in90Days, gte: now }, status: 'ACTIVE' },
        orderBy: { endDate: 'asc' },
        take: 5,
      }),
    ])

  const kpiCards = [
    { label: '긴급 업무', value: urgentTasks, color: 'text-danger' },
    { label: '오늘 마감', value: todayDueTasks, color: 'text-warning' },
    { label: '계약 만료 예정', value: expiringContracts, color: 'text-teal' },
    { label: '연차 승인 대기', value: pendingLeaves, color: 'text-navy' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <div key={k.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-sub">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today Tasks */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-navy mb-3">오늘 업무</h2>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-sub">오늘 마감 업무가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <Link href={`/tasks/${t.id}`} className="text-sm text-navy hover:underline truncate">
                    {t.title}
                  </Link>
                  <Badge variant={PRIORITY_BADGE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Expiring Contracts */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-navy mb-3">계약 만료 예정 (90일 이내)</h2>
          {nearExpiry.length === 0 ? (
            <p className="text-sm text-sub">만료 예정 계약이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {nearExpiry.map((c) => {
                const daysLeft = Math.ceil((c.endDate.getTime() - now.getTime()) / 86400000)
                return (
                  <li key={c.id} className="flex items-center justify-between">
                    <Link href={`/contracts/${c.id}`} className="text-sm text-navy hover:underline truncate">
                      {c.name}
                    </Link>
                    <Badge variant={daysLeft <= 30 ? 'danger' : daysLeft <= 60 ? 'warning' : 'gray'}>
                      D-{daysLeft}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
