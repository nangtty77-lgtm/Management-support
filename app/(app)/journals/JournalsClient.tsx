'use client'

import { useState, useMemo } from 'react'

interface Journal {
  id: string; authorId: string; authorName: string; date: string; content: string
  tasks: string; plan: string; issues: string; mood: string; createdAt: string
}
interface User { id: string; name: string }

const MOOD_EMOJI: Record<string, string> = { GREAT: '😄', GOOD: '😊', NORMAL: '😐', STRESSED: '😰', DIFFICULT: '😣' }
const MOOD_LABEL: Record<string, string> = { GREAT: '훌륭함', GOOD: '좋음', NORMAL: '보통', STRESSED: '스트레스', DIFFICULT: '힘듦' }
const MOOD_COLOR: Record<string, string> = { GREAT: 'text-emerald-600', GOOD: 'text-blue-600', NORMAL: 'text-slate-500', STRESSED: 'text-amber-600', DIFFICULT: 'text-red-600' }

function formatDate(iso: string) {
  const d = new Date(iso)
  const utcDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  return `${utcDate.getUTCFullYear()}.${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}.${String(utcDate.getUTCDate()).padStart(2, '0')}`
}

const emptyForm = { date: '', content: '', tasks: '', plan: '', issues: '', mood: 'NORMAL' }

export function JournalsClient({
  journals: initial, users, currentUserId, isAdmin, today,
}: { journals: Journal[]; users: User[]; currentUserId: string; isAdmin: boolean; today: string }) {
  const [journals, setJournals] = useState<Journal[]>(initial)
  const [selected, setSelected] = useState<Journal | null>(initial[0] ?? null)
  const [writing, setWriting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterAuthor, setFilterAuthor] = useState<string>('all')
  const [form, setForm] = useState({ ...emptyForm, date: today.slice(0, 10) })

  const todayStr = (() => { const d = new Date(today); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })()
  const todayJournal = journals.find(j => {
    const jd = new Date(j.date)
    const jStr = `${jd.getUTCFullYear()}-${String(jd.getUTCMonth() + 1).padStart(2, '0')}-${String(jd.getUTCDate()).padStart(2, '0')}`
    return j.authorId === currentUserId && jStr === todayStr
  })

  async function saveJournal() {
    if (!form.content) return
    setSaving(true)
    try {
      const res = await fetch('/api/journals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      if (res.ok) {
        const created = await res.json()
        setJournals(prev => {
          const filtered = prev.filter(j => !(j.authorId === created.authorId && j.date === created.date))
          return [created, ...filtered]
        })
        setWriting(false)
        setSelected(created)
        setForm({ ...emptyForm, date: todayStr })
      }
    } finally { setSaving(false) }
  }

  async function deleteJournal(id: string) {
    if (!confirm('업무일지를 삭제하시겠습니까?')) return
    await fetch(`/api/journals/${id}`, { method: 'DELETE' })
    setJournals(prev => prev.filter(j => j.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const filtered = useMemo(() =>
    filterAuthor === 'all' ? journals : journals.filter(j => j.authorId === filterAuthor),
    [journals, filterAuthor])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">업무일지</h1>
          <p className="text-sm text-slate-400 mt-0.5">이번 달 {journals.length}건</p>
        </div>
        <button onClick={() => { setWriting(true); setForm({ ...emptyForm, date: todayStr }) }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          {todayJournal ? '오늘 일지 수정' : '+ 일지 작성'}
        </button>
      </div>

      {/* Writing form */}
      {writing && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">업무일지 작성</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">날짜:</span>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="border border-slate-200 rounded px-2 py-1 text-xs" />
            </div>
          </div>

          {/* Mood selector */}
          <div>
            <label className="text-xs text-slate-500 mb-2 block">오늘 기분</label>
            <div className="flex gap-2">
              {Object.entries(MOOD_EMOJI).map(([k, emoji]) => (
                <button key={k} onClick={() => setForm(f => ({ ...f, mood: k }))}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-colors ${form.mood === k ? 'bg-indigo-50 border-indigo-300' : 'border-slate-100 hover:border-slate-200'}`}>
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs text-slate-400">{MOOD_LABEL[k]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">오늘 한 일 *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="오늘 수행한 주요 업무를 작성해주세요"
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">완료한 업무 (요약)</label>
              <textarea value={form.tasks} onChange={e => setForm(f => ({ ...f, tasks: e.target.value }))}
                placeholder="• 완료한 업무 목록"
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">내일 계획</label>
              <textarea value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                placeholder="• 내일 할 일 목록"
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 mb-1 block">이슈/특이사항</label>
            <textarea value={form.issues} onChange={e => setForm(f => ({ ...f, issues: e.target.value }))}
              placeholder="이슈, 블로커, 특이사항 등"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div className="flex gap-2">
            <button onClick={saveJournal} disabled={saving || !form.content}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => setWriting(false)} className="text-sm text-slate-500 px-4 py-2">취소</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Journal list */}
        <div className="space-y-3">
          {isAdmin && users.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <button onClick={() => setFilterAuthor('all')}
                className={`text-xs px-3 py-1 rounded-full border ${filterAuthor === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}>
                전체
              </button>
              {users.map(u => (
                <button key={u.id} onClick={() => setFilterAuthor(u.id)}
                  className={`text-xs px-3 py-1 rounded-full border ${filterAuthor === u.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600'}`}>
                  {u.name}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 text-sm">
              업무일지가 없습니다
            </div>
          ) : (
            filtered.map(j => (
              <button key={j.id} onClick={() => setSelected(selected?.id === j.id ? null : j)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === j.id ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800">{formatDate(j.date)}</span>
                  <span className={`text-base ${MOOD_COLOR[j.mood]}`}>{MOOD_EMOJI[j.mood]}</span>
                </div>
                {isAdmin && <p className="text-xs text-indigo-500 mb-1">{j.authorName}</p>}
                <p className="text-xs text-slate-500 line-clamp-2">{j.content}</p>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4 sticky top-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-900">{formatDate(selected.date)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isAdmin && <span className="text-xs text-indigo-500">{selected.authorName}</span>}
                    <span className={`text-sm ${MOOD_COLOR[selected.mood]}`}>{MOOD_EMOJI[selected.mood]} {MOOD_LABEL[selected.mood]}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selected.authorId === currentUserId && (
                    <button onClick={() => {
                      const jd = new Date(selected.date)
                      const dateStr = `${jd.getUTCFullYear()}-${String(jd.getUTCMonth() + 1).padStart(2, '0')}-${String(jd.getUTCDate()).padStart(2, '0')}`
                      setForm({ date: dateStr, content: selected.content, tasks: selected.tasks, plan: selected.plan, issues: selected.issues, mood: selected.mood })
                      setWriting(true)
                    }} className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">수정</button>
                  )}
                  {(selected.authorId === currentUserId || isAdmin) && (
                    <button onClick={() => deleteJournal(selected.id)}
                      className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50">삭제</button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1 font-medium">오늘 한 일</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-lg p-3">{selected.content}</p>
                </div>
                {selected.tasks && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1 font-medium">완료 업무</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap bg-emerald-50 rounded-lg p-3">{selected.tasks}</p>
                  </div>
                )}
                {selected.plan && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1 font-medium">내일 계획</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap bg-blue-50 rounded-lg p-3">{selected.plan}</p>
                  </div>
                )}
                {selected.issues && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1 font-medium">이슈/특이사항</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap bg-amber-50 rounded-lg p-3">{selected.issues}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-sm">일지를 선택하거나 새로 작성하세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
