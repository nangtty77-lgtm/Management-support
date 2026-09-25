'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Task {
  id: string; title: string; status: string; priority: string
  dueDate: string | null; assigneeName: string | null; creatorName: string
}

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  NORMAL: 'bg-slate-100 text-slate-600',
  LOW: 'bg-slate-50 text-slate-400',
}
const PRIORITY_LABEL: Record<string, string> = { URGENT: '긴급', HIGH: '높음', NORMAL: '보통', LOW: '낮음' }
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  ON_HOLD: 'bg-purple-100 text-purple-600',
}
const STATUS_LABEL: Record<string, string> = { PENDING: '대기', IN_PROGRESS: '진행중', REVIEW: '검토', COMPLETED: '완료', ON_HOLD: '보류' }

const STATUS_TABS = [
  { key: 'all', label: '전체' },
  { key: 'PENDING', label: '대기' },
  { key: 'IN_PROGRESS', label: '진행' },
  { key: 'REVIEW', label: '검토' },
  { key: 'COMPLETED', label: '완료' },
  { key: 'ON_HOLD', label: '보류' },
]

function isOverdue(dueDate: string | null, status: string) {
  if (!dueDate || status === 'COMPLETED') return false
  return new Date(dueDate) < new Date()
}

export function TasksListClient({ tasks: initial, canWrite }: { tasks: Task[]; canWrite: boolean }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return initial.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !(t.assigneeName?.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [initial, statusFilter, priorityFilter, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: initial.length }
    for (const t of initial) { c[t.status] = (c[t.status] ?? 0) + 1 }
    return c
  }, [initial])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">업무관리</h1>
          <p className="text-sm text-slate-400 mt-0.5">총 {initial.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tasks/kanban" className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">칸반</Link>
          <Link href="/tasks/calendar" className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">캘린더</Link>
          {canWrite && (
            <Link href="/tasks/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              + 업무 등록
            </Link>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 border-b border-slate-100">
        {STATUS_TABS.map(tab => (
          <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px'
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            {tab.label}
            {counts[tab.key] !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${statusFilter === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                {counts[tab.key] ?? 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="업무명 또는 담당자 검색..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">모든 우선순위</option>
          <option value="URGENT">긴급</option>
          <option value="HIGH">높음</option>
          <option value="NORMAL">보통</option>
          <option value="LOW">낮음</option>
        </select>
        {(statusFilter !== 'all' || priorityFilter !== 'all' || search) && (
          <button onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearch('') }}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 border border-slate-200 rounded-lg transition-colors">
            초기화
          </button>
        )}
        <span className="text-xs text-slate-400 ml-auto">{filtered.length}건 표시 중</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">검색 결과가 없습니다</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100">
              <tr className="text-xs text-slate-400 font-semibold">
                <th className="text-left px-4 py-3">제목</th>
                <th className="text-left px-4 py-3">담당자</th>
                <th className="text-left px-4 py-3">우선순위</th>
                <th className="text-left px-4 py-3">상태</th>
                <th className="text-left px-4 py-3">마감일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/tasks/${t.id}`} className="font-medium text-slate-800 hover:text-indigo-600 transition-colors">
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.assigneeName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORITY_BADGE[t.priority]}`}>
                      {PRIORITY_LABEL[t.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isOverdue(t.dueDate, t.status) ? 'text-red-500 font-medium' : 'text-slate-500'}`}>
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString('ko-KR') : '—'}
                      {isOverdue(t.dueDate, t.status) && ' ⚠'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
