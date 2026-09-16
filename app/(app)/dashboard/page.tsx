import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/Badge'
import { KpiCard } from '@/components/ui/KpiCard'
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

  const today = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">대시보드</h1>
        <p className="text-sm text-sub mt-0.5">{today} · 안녕하세요, {session.user?.name}님</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="긴급 업무"
          value={urgentTasks}
          color="danger"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
        />
        <KpiCard
          label="오늘 마감"
          value={todayDueTasks}
          color="warning"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          }
        />
        <KpiCard
          label="계약 만료 예정"
          value={expiringContracts}
          color="teal"
          sub="90일 이내"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          }
        />
        <KpiCard
          label="연차 승인 대기"
          value={pendingLeaves}
          color="navy"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy">오늘 업무</h2>
            <Link href="/tasks" className="text-xs text-teal hover:underline">전체 보기</Link>
          </div>
          <div className="p-5">
            {todayTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <p className="text-sm text-sub">오늘 마감 업무가 없습니다</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-1">
                    <Link href={`/tasks/${t.id}`} className="text-sm text-navy hover:underline truncate flex-1">
                      {t.title}
                    </Link>
                    <Badge variant={PRIORITY_BADGE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Expiring Contracts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy">계약 만료 예정 <span className="text-xs text-sub font-normal">(90일 이내)</span></h2>
            <Link href="/contracts" className="text-xs text-teal hover:underline">전체 보기</Link>
          </div>
          <div className="p-5">
            {nearExpiry.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <p className="text-sm text-sub">만료 예정 계약이 없습니다</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {nearExpiry.map((c) => {
                  const daysLeft = Math.ceil((c.endDate.getTime() - now.getTime()) / 86400000)
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-1">
                      <Link href={`/contracts/${c.id}`} className="text-sm text-navy hover:underline truncate flex-1">
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
    </div>
  )
}
