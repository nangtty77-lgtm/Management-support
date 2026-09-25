'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string
  assigneeName: string | null
}

const STATUS_COLOR: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-600 border-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}
const PRIORITY_DOT: Record<string, string> = {
  URGENT: 'bg-red-500', HIGH: 'bg-orange-400', NORMAL: 'bg-slate-300', LOW: 'bg-slate-200',
}
const STATUS_LABEL: Record<string, string> = {
  TODO: '예정', IN_PROGRESS: '진행', REVIEW: '검토', COMPLETED: '완료',
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function CalendarClient({ tasks, today: todayISO }: { tasks: Task[]; today: string }) {
  const todayDate = new Date(todayISO)
  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth())
  const [selected, setSelected] = useState<Date | null>(null)

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(year, month, i - startOffset + 1)
    return d
  })

  function getTasksForDate(d: Date) {
    return tasks.filter(t => sameDay(new Date(t.dueDate), d))
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelected(null)
  }

  const selectedTasks = selected ? getTasksForDate(selected) : []
  const monthTasks = tasks.filter(t => {
    const d = new Date(t.dueDate)
    return d.getFullYear() === year && d.getMonth() === month
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">업무 캘린더</h1>
          <p className="text-sm text-slate-400 mt-0.5">이 달 업무 {monthTasks.length}건</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/tasks" className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">
            목록 보기
          </Link>
          <Link href="/tasks/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + 업무 등록
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <h2 className="text-base font-semibold text-slate-800">{year}년 {MONTHS[month]}</h2>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`py-2 text-center text-xs font-semibold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const isCurrentMonth = d.getMonth() === month
              const isToday = sameDay(d, todayDate)
              const isSelected = selected ? sameDay(d, selected) : false
              const dayTasks = getTasksForDate(d)
              const isSun = i % 7 === 0, isSat = i % 7 === 6

              return (
                <div
                  key={i}
                  onClick={() => isCurrentMonth && setSelected(sameDay(d, selected ?? new Date(0)) ? null : d)}
                  className={`min-h-[88px] p-1.5 border-b border-r border-slate-50 cursor-pointer transition-colors ${
                    !isCurrentMonth ? 'bg-slate-50/50 cursor-default' : isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  } ${i % 7 === 6 ? 'border-r-0' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full ${
                      isToday ? 'bg-indigo-600 text-white' :
                      !isCurrentMonth ? 'text-slate-300' :
                      isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-slate-600'
                    }`}>
                      {d.getDate()}
                    </span>
                    {dayTasks.length > 0 && isCurrentMonth && (
                      <span className="text-[9px] text-slate-400">{dayTasks.length}건</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${STATUS_COLOR[t.status] ?? STATUS_COLOR.TODO}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${PRIORITY_DOT[t.priority]}`} />
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-slate-400 px-1.5">+{dayTasks.length - 3}건 더</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 mb-2">상태 범례</p>
            <div className="space-y-1.5">
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_COLOR[k]}`}>{v}</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-3 mb-2">우선순위</p>
            <div className="flex flex-wrap gap-2">
              {[['URGENT', '긴급'], ['HIGH', '높음'], ['NORMAL', '보통'], ['LOW', '낮음']].map(([k, v]) => (
                <div key={k} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[k]}`} />
                  <span className="text-xs text-slate-500">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected day tasks */}
          {selected && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 mb-3">
                {selected.getMonth() + 1}월 {selected.getDate()}일 업무
                <span className="ml-1 text-slate-400">({selectedTasks.length}건)</span>
              </p>
              {selectedTasks.length === 0 ? (
                <p className="text-xs text-slate-400">업무가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {selectedTasks.map(t => (
                    <Link key={t.id} href={`/tasks/${t.id}`}
                      className="block p-2.5 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[t.priority]}`} />
                        <span className="text-xs font-medium text-slate-800 truncate">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                        {t.assigneeName && <span className="text-[10px] text-slate-400">{t.assigneeName}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* This month summary */}
          {!selected && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 mb-3">이번 달 업무 현황</p>
              {monthTasks.length === 0 ? (
                <p className="text-xs text-slate-400">업무가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const).map(s => {
                    const count = monthTasks.filter(t => t.status === s).length
                    if (count === 0) return null
                    return (
                      <div key={s} className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_COLOR[s]}`}>{STATUS_LABEL[s]}</span>
                        <span className="text-xs font-semibold text-slate-700">{count}건</span>
                      </div>
                    )
                  })}
                  <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs text-slate-500">완료율</span>
                    <span className="text-xs font-bold text-indigo-600">
                      {monthTasks.length > 0 ? Math.round((monthTasks.filter(t => t.status === 'COMPLETED').length / monthTasks.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
