import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  PLANNED: '계획', COMPLETED: '완료', DELAYED: '지연', CANCELLED: '취소',
}
const STATUS_COLOR: Record<string, string> = {
  PLANNED: 'bg-indigo-50 text-indigo-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  DELAYED: 'bg-amber-50 text-amber-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

export default async function VisitsPage() {
  const session = await auth()
  if (!session) return null

  const visits = await db.visit.findMany({
    include: {
      customer: { select: { name: true, companyName: true } },
      assignee: { select: { name: true } },
    },
    orderBy: { visitDate: 'desc' },
  })

  const planned = visits.filter((v) => v.status === 'PLANNED').length
  const completed = visits.filter((v) => v.status === 'COMPLETED').length
  const delayed = visits.filter((v) => v.status === 'DELAYED').length

  const now = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">방문관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            예정 방문 {planned}건 · 완료 {completed}건 · 지연 {delayed}건
          </p>
        </div>
        <Link href="/crm/visits/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          방문계획 추가
        </Link>
      </div>

      {/* Upcoming visits */}
      {planned > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">예정된 방문 {planned}건</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {visits
              .filter((v) => v.status === 'PLANNED')
              .map((v) => {
                const dDiff = Math.ceil((v.visitDate.getTime() - now.getTime()) / 86400000)
                return (
                  <div key={v.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="shrink-0 text-center w-12">
                      <p className="text-xs text-slate-400">{v.visitDate.getMonth() + 1}월</p>
                      <p className="text-xl font-bold text-slate-900">{v.visitDate.getDate()}</p>
                      <p className="text-xs text-slate-400">{['일','월','화','수','목','금','토'][v.visitDate.getDay()]}요일</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-slate-900">{v.customer.companyName || v.customer.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[v.status]}`}>
                          {STATUS_LABEL[v.status]}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{v.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{v.assignee?.name ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                        dDiff < 0 ? 'bg-red-50 text-red-600' :
                        dDiff === 0 ? 'bg-indigo-600 text-white' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {dDiff < 0 ? `D+${Math.abs(dDiff)}` : dDiff === 0 ? 'D-Day' : `D-${dDiff}`}
                      </span>
                      <Link
                        href={`/crm/visits/${v.id}`}
                        className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                      >
                        결과 입력
                      </Link>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* All visits table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">전체 방문 목록</h2>
        </div>
        {visits.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <p className="text-slate-500 font-medium">방문 기록이 없습니다</p>
            <Link href="/crm/visits/new" className="inline-block mt-3 text-sm text-indigo-600 hover:underline">+ 방문계획 추가하기</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['방문명', '고객', '방문일', '담당자', '상태', '결과'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/crm/visits/${v.id}`} className="text-slate-900 font-medium hover:underline">
                      {v.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{v.customer.companyName || v.customer.name}</td>
                  <td className="px-5 py-3 text-slate-500">{v.visitDate.toLocaleDateString('ko-KR')}</td>
                  <td className="px-5 py-3 text-slate-500">{v.assignee?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[v.status]}`}>
                      {STATUS_LABEL[v.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">{v.result || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
