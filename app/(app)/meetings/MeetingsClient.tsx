'use client'

import { useState } from 'react'

interface Attendee { id: string; name: string; confirmed: boolean }
interface Meeting {
  id: string; title: string; description: string; startAt: string; endAt: string
  location: string; status: string; organizerId: string; organizerName: string; attendees: Attendee[]
}
interface User { id: string; name: string }

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: '예정', IN_PROGRESS: '진행중', COMPLETED: '완료', CANCELLED: '취소',
}

function formatDuration(start: string, end: string) {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000
  if (diff < 60) return `${diff}분`
  return `${Math.floor(diff / 60)}시간${diff % 60 ? ` ${diff % 60}분` : ''}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function MeetingsClient({
  meetings: initial, users, currentUserId, today,
}: { meetings: Meeting[]; users: User[]; currentUserId: string; today: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>(initial)
  const [selected, setSelected] = useState<Meeting | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', startAt: '', endAt: '', location: '', attendeeIds: [] as string[],
  })

  async function saveMeeting() {
    if (!form.title || !form.startAt || !form.endAt) return
    setSaving(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const created = await res.json()
        setMeetings(prev => [...prev, created].sort((a, b) => a.startAt.localeCompare(b.startAt)))
        setShowForm(false)
        setForm({ title: '', description: '', startAt: '', endAt: '', location: '', attendeeIds: [] })
      }
    } finally { setSaving(false) }
  }

  async function deleteMeeting(id: string) {
    if (!confirm('회의를 삭제하시겠습니까?')) return
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
    setMeetings(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/meetings/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : null)
  }

  const upcomingMeetings = meetings.filter(m => m.status !== 'CANCELLED' && m.status !== 'COMPLETED')
  const pastMeetings = meetings.filter(m => m.status === 'COMPLETED' || m.status === 'CANCELLED')

  function toggleAttendee(uid: string) {
    setForm(f => ({
      ...f,
      attendeeIds: f.attendeeIds.includes(uid) ? f.attendeeIds.filter(id => id !== uid) : [...f.attendeeIds, uid],
    }))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">회의 관리</h1>
          <p className="text-sm text-slate-400 mt-0.5">이번 달 {meetings.length}건</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + 회의 등록
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">새 회의 등록</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-slate-500 mb-1 block">회의 제목 *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="예: 주간 팀 미팅"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">시작 시간 *</label>
              <input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">종료 시간 *</label>
              <input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">장소</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="예: 회의실 A, Zoom"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">참석자</label>
              <div className="flex flex-wrap gap-1 border border-slate-200 rounded-lg p-2 max-h-24 overflow-y-auto">
                {users.filter(u => u.id !== currentUserId).map(u => (
                  <button key={u.id} type="button" onClick={() => toggleAttendee(u.id)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      form.attendeeIds.includes(u.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveMeeting} disabled={saving || !form.title || !form.startAt || !form.endAt}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">취소</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Meeting list */}
        <div className="col-span-2 space-y-5">
          {/* Upcoming */}
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">예정된 회의 ({upcomingMeetings.length})</h2>
            {upcomingMeetings.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
                예정된 회의가 없습니다
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingMeetings.map(m => (
                  <button key={m.id} onClick={() => setSelected(selected?.id === m.id ? null : m)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === m.id ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-center shrink-0">
                        <p className="text-lg font-bold text-indigo-600">{new Date(m.startAt).getDate()}</p>
                        <p className="text-xs text-slate-400">{new Date(m.startAt).getMonth() + 1}월</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLOR[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                          <span className="text-sm font-medium text-slate-800 truncate">{m.title}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {formatDateTime(m.startAt)} · {formatDuration(m.startAt, m.endAt)}
                          {m.location && ` · ${m.location}`}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          주최: {m.organizerName} · 참석 {m.attendees.length}명
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {pastMeetings.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-400 mb-3">완료/취소 ({pastMeetings.length})</h2>
              <div className="space-y-2 opacity-60">
                {pastMeetings.map(m => (
                  <div key={m.id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 shadow-sm p-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${STATUS_COLOR[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                    <span className="text-sm text-slate-600 flex-1 truncate">{m.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">{formatDateTime(m.startAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Detail */}
        <div>
          {selected ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sticky top-6 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-slate-900">{selected.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${STATUS_COLOR[selected.status]}`}>
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-slate-400 w-12 shrink-0">시간</span>
                  <span className="text-slate-700">{formatDateTime(selected.startAt)} ~ {formatDateTime(selected.endAt)}</span>
                </div>
                {selected.location && (
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-12 shrink-0">장소</span>
                    <span className="text-slate-700">{selected.location}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="text-slate-400 w-12 shrink-0">주최</span>
                  <span className="text-slate-700">{selected.organizerName}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400 w-12 shrink-0">소요</span>
                  <span className="text-slate-700">{formatDuration(selected.startAt, selected.endAt)}</span>
                </div>
              </div>

              {selected.description && (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{selected.description}</p>
              )}

              {/* Attendees */}
              <div>
                <p className="text-xs text-slate-400 mb-2">참석자 ({selected.attendees.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.attendees.map(a => (
                    <div key={a.id} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                      a.confirmed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${a.confirmed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {a.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {selected.organizerId === currentUserId && selected.status === 'SCHEDULED' && (
                <div className="flex gap-2 pt-2 border-t border-slate-50">
                  <button onClick={() => updateStatus(selected.id, 'COMPLETED')}
                    className="flex-1 text-xs py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    완료 처리
                  </button>
                  <button onClick={() => updateStatus(selected.id, 'CANCELLED')}
                    className="flex-1 text-xs py-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                    취소
                  </button>
                  <button onClick={() => deleteMeeting(selected.id)}
                    className="text-xs py-2 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                    삭제
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
              회의를 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
