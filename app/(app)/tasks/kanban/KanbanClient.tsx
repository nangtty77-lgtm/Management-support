'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  assigneeName: string | null
  assigneeId: string | null
  createdByName: string | null
}

const COLUMNS: { key: string; label: string; color: string; bg: string; border: string }[] = [
  { key: 'PENDING', label: '대기', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  { key: 'IN_PROGRESS', label: '진행중', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'REVIEW', label: '검토', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { key: 'COMPLETED', label: '완료', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
]

const PRIORITY_BADGE: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  NORMAL: 'bg-slate-100 text-slate-600',
  LOW: 'bg-slate-50 text-slate-400',
}
const PRIORITY_LABEL: Record<string, string> = {
  URGENT: '긴급', HIGH: '높음', NORMAL: '보통', LOW: '낮음',
}
const PRIORITY_DOT: Record<string, string> = {
  URGENT: 'bg-red-500', HIGH: 'bg-orange-400', NORMAL: 'bg-slate-300', LOW: 'bg-slate-200',
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function formatDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function KanbanClient({ tasks: initial, today }: { tasks: Task[]; today: string }) {
  const [tasks, setTasks] = useState<Task[]>(initial)
  const [moving, setMoving] = useState<string | null>(null)

  async function moveTask(taskId: string, newStatus: string) {
    setMoving(taskId)
    const prev = tasks
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) setTasks(prev)
    } catch {
      setTasks(prev)
    } finally {
      setMoving(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">업무 칸반</h1>
          <p className="text-sm text-slate-400 mt-0.5">총 {tasks.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tasks/calendar" className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">
            캘린더
          </Link>
          <Link href="/tasks" className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">
            목록
          </Link>
          <Link href="/tasks/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + 업무 등록
          </Link>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-4 gap-4 items-start">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key)
          const prevCol = COLUMNS[COLUMNS.findIndex(c => c.key === col.key) - 1]
          const nextCol = COLUMNS[COLUMNS.findIndex(c => c.key === col.key) + 1]

          return (
            <div key={col.key} className="space-y-3">
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${col.bg} border ${col.border}`}>
                <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.color} border ${col.border}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[120px]">
                {colTasks.map(task => (
                  <div key={task.id}
                    className={`bg-white rounded-xl border border-slate-100 shadow-sm p-3 transition-all ${moving === task.id ? 'opacity-50' : 'hover:shadow-md hover:border-slate-200'}`}>

                    {/* Priority + Date */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_BADGE[task.priority]}`}>
                        {PRIORITY_LABEL[task.priority]}
                      </span>
                      {task.dueDate && (
                        <span className={`text-[10px] font-medium ${isOverdue(task.dueDate) && task.status !== 'COMPLETED' ? 'text-red-500' : 'text-slate-400'}`}>
                          {isOverdue(task.dueDate) && task.status !== 'COMPLETED' ? '⚠ ' : ''}{formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <Link href={`/tasks/${task.id}`} className="block text-sm font-medium text-slate-800 hover:text-indigo-600 leading-snug mb-2">
                      {task.title}
                    </Link>

                    {/* Assignee */}
                    {task.assigneeName && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-indigo-600">{task.assigneeName[0]}</span>
                        </div>
                        <span className="text-xs text-slate-500 truncate">{task.assigneeName}</span>
                      </div>
                    )}

                    {/* Move buttons */}
                    <div className="flex gap-1 mt-2 pt-2 border-t border-slate-50">
                      {prevCol && (
                        <button
                          onClick={() => moveTask(task.id, prevCol.key)}
                          disabled={moving === task.id}
                          className="flex-1 text-[10px] py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30"
                        >
                          ← {prevCol.label}
                        </button>
                      )}
                      {nextCol && (
                        <button
                          onClick={() => moveTask(task.id, nextCol.key)}
                          disabled={moving === task.id}
                          className="flex-1 text-[10px] py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium transition-colors disabled:opacity-30"
                        >
                          {nextCol.label} →
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="border-2 border-dashed border-slate-100 rounded-xl p-6 text-center">
                    <p className="text-xs text-slate-300">없음</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
