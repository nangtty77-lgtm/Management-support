'use client'

import Link from 'next/link'

interface Task { id: string; title: string; status: string; priority: string; dueDate: string | null }
interface Notice { id: string; title: string; isPinned: boolean; authorName: string; createdAt: string; isRead: boolean }
interface Notification { id: string; title: string; message: string; type: string; createdAt: string; link: string | null }

const PRIORITY_DOT: Record<string, string> = {
  URGENT: 'bg-red-500', HIGH: 'bg-orange-400', NORMAL: 'bg-slate-300', LOW: 'bg-slate-200',
}
const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  ON_HOLD: 'bg-purple-100 text-purple-600',
}
const STATUS_LABEL: Record<string, string> = { PENDING: '대기', IN_PROGRESS: '진행', REVIEW: '검토', COMPLETED: '완료', ON_HOLD: '보류' }
const ROLE_LABEL: Record<string, string> = { ADMIN: '관리자', HR: 'HR', GENERAL: '일반', OPS: '운영', VIEW: '조회' }

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

function isOverdue(dueDate: string | null) {
  return dueDate ? new Date(dueDate) < new Date() : false
}

export function MyPageClient({
  user, tasks, leave, unreadNotifications, recentNotices, dueSoonCount, overdueCount, today,
}: {
  user: { name: string; email: string; role: string; department: string | null; position: string | null }
  tasks: Task[]
  leave: { annual: number; used: number; remaining: number }
  unreadNotifications: Notification[]
  recentNotices: Notice[]
  dueSoonCount: number
  overdueCount: number
  today: string
}) {
  return (
    <div className="space-y-6">
      {/* Header + profile */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user.name[0]}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-indigo-200 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {user.department && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{user.department}</span>}
              {user.position && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{user.position}</span>}
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{ROLE_LABEL[user.role]}</span>
            </div>
          </div>
          <div className="ml-auto flex gap-3">
            <Link href="/settings/profile" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
              프로필 수정
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '내 업무', value: tasks.length, href: '/tasks', color: 'text-indigo-600', desc: '진행 중' },
          { label: '마감 임박', value: dueSoonCount, href: '/tasks', color: 'text-amber-600', desc: '7일 이내' },
          { label: '지연 업무', value: overdueCount, href: '/tasks', color: 'text-red-600', desc: '마감 초과' },
          { label: '잔여 연차', value: `${leave.remaining}일`, href: '/leaves', color: 'text-emerald-600', desc: `사용 ${leave.used}/${leave.annual}일` },
        ].map(s => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:border-indigo-200 transition-colors">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* My tasks */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">내 업무</h2>
            <Link href="/tasks" className="text-xs text-indigo-600 hover:underline">전체 보기</Link>
          </div>
          {tasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
              담당 업무가 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 8).map(t => (
                <Link key={t.id} href={`/tasks/${t.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 shadow-sm p-3 hover:border-indigo-200 hover:shadow-md transition-all">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                  <span className="flex-1 text-sm font-medium text-slate-800 truncate">{t.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  {t.dueDate && (
                    <span className={`text-xs shrink-0 ${isOverdue(t.dueDate) ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                      {new Date(t.dueDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Unread notifications */}
          {unreadNotifications.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-700">미읽은 알림</h2>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{unreadNotifications.length}</span>
              </div>
              <div className="space-y-2">
                {unreadNotifications.map(n => (
                  <div key={n.id} className="text-xs">
                    <p className="font-medium text-slate-700 truncate">{n.title}</p>
                    <p className="text-slate-400 truncate">{n.message}</p>
                    <p className="text-slate-300 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                ))}
              </div>
              <Link href="/notifications" className="mt-2 block text-xs text-center text-indigo-600 hover:underline">
                알림센터 가기
              </Link>
            </div>
          )}

          {/* Recent notices */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-700">최근 공지</h2>
              <Link href="/notices" className="text-xs text-indigo-600 hover:underline">더보기</Link>
            </div>
            {recentNotices.length === 0 ? (
              <p className="text-xs text-slate-400">공지사항이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {recentNotices.map(n => (
                  <Link key={n.id} href="/notices"
                    className="flex items-start gap-2 group">
                    {n.isPinned && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded shrink-0 mt-0.5">고정</span>}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate group-hover:text-indigo-600 transition-colors ${n.isRead ? 'text-slate-500' : 'text-slate-800'}`}>
                        {n.title}
                        {!n.isRead && <span className="inline-block w-1 h-1 rounded-full bg-indigo-500 ml-1 align-middle" />}
                      </p>
                      <p className="text-[10px] text-slate-400">{n.authorName} · {timeAgo(n.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">빠른 이동</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/tasks/new', label: '업무 등록' },
                { href: '/leaves/new', label: '연차 신청' },
                { href: '/crm/customers', label: '고객 관리' },
                { href: '/notices', label: '공지사항' },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="text-xs text-center py-2 px-3 rounded-lg border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
