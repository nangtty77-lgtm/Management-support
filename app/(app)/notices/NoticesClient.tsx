'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Notice {
  id: string
  title: string
  content: string
  isPinned: boolean
  author: { id: string; name: string }
  createdAt: string
  isRead: boolean
  readCount: number
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`
  return new Date(iso).toLocaleDateString('ko-KR')
}

export function NoticesClient({
  notices: initial, canWrite, currentUserId, isAdmin,
}: {
  notices: Notice[]; canWrite: boolean; currentUserId: string; isAdmin: boolean
}) {
  const router = useRouter()
  const [notices, setNotices] = useState<Notice[]>(initial)
  const [selected, setSelected] = useState<Notice | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', isPinned: false })
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function openNotice(notice: Notice) {
    setSelected(notice)
    if (!notice.isRead) {
      await fetch(`/api/notices/${notice.id}`)
      setNotices(ns => ns.map(n => n.id === notice.id ? { ...n, isRead: true } : n))
    }
  }

  async function saveNotice() {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch(`/api/notices/${editId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        const updated = await res.json()
        setNotices(ns => {
          const list = ns.map(n => n.id === editId ? { ...n, ...updated } : n)
          return [...list.filter(n => n.isPinned), ...list.filter(n => !n.isPinned)]
        })
        if (selected?.id === editId) setSelected(prev => prev ? { ...prev, ...updated } : null)
      } else {
        const res = await fetch('/api/notices', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        })
        const created = await res.json()
        setNotices(ns => form.isPinned ? [created, ...ns] : [...ns.filter(n => n.isPinned), created, ...ns.filter(n => !n.isPinned)])
      }
      setShowForm(false); setEditId(null); setForm({ title: '', content: '', isPinned: false })
    } finally { setSaving(false) }
  }

  async function deleteNotice(id: string) {
    if (!confirm('공지사항을 삭제하시겠습니까?')) return
    await fetch(`/api/notices/${id}`, { method: 'DELETE' })
    setNotices(ns => ns.filter(n => n.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  function startEdit(notice: Notice) {
    setForm({ title: notice.title, content: notice.content, isPinned: notice.isPinned })
    setEditId(notice.id)
    setShowForm(true)
    setSelected(null)
  }

  async function togglePin(notice: Notice) {
    const res = await fetch(`/api/notices/${notice.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !notice.isPinned }),
    })
    const updated = await res.json()
    setNotices(ns => {
      const list = ns.map(n => n.id === notice.id ? { ...n, isPinned: updated.isPinned } : n)
      return [...list.filter(n => n.isPinned), ...list.filter(n => !n.isPinned)]
    })
    if (selected?.id === notice.id) setSelected(prev => prev ? { ...prev, isPinned: updated.isPinned } : null)
  }

  const unreadCount = notices.filter(n => !n.isRead).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">공지사항</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            총 {notices.length}건
            {unreadCount > 0 && <span className="ml-2 text-indigo-600 font-medium">미읽음 {unreadCount}건</span>}
          </p>
        </div>
        {canWrite && !showForm && (
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ title: '', content: '', isPinned: false }) }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + 공지 등록
          </button>
        )}
      </div>

      {/* Write / Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">{editId ? '공지 수정' : '새 공지 등록'}</h3>
          <input
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="제목을 입력하세요"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="내용을 입력하세요"
            rows={6}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-slate-600">상단 고정</span>
            </label>
          )}
          <div className="flex gap-2">
            <button onClick={saveNotice} disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
              취소
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-5 gap-5">
        {/* List */}
        <div className="col-span-2 space-y-2">
          {notices.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              등록된 공지사항이 없습니다
            </div>
          )}
          {notices.map(notice => (
            <button key={notice.id} onClick={() => openNotice(notice)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === notice.id
                  ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
              }`}>
              <div className="flex items-start gap-2">
                {notice.isPinned && (
                  <span className="shrink-0 mt-0.5 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">고정</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${notice.isRead ? 'text-slate-600' : 'text-slate-900'}`}>
                      {notice.title}
                    </p>
                    {!notice.isRead && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{notice.content.slice(0, 60)}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                    <span>{notice.author.name}</span>
                    <span>·</span>
                    <span>{timeAgo(notice.createdAt)}</span>
                    <span>·</span>
                    <span>읽음 {notice.readCount}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="col-span-3">
          {selected ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {selected.isPinned && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">📌 고정</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{selected.title}</h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>{selected.author.name}</span>
                    <span>·</span>
                    <span>{new Date(selected.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>·</span>
                    <span>읽음 {selected.readCount}명</span>
                  </div>
                </div>
                {(selected.author.id === currentUserId || isAdmin) && (
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {isAdmin && (
                      <button onClick={() => togglePin(selected)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${selected.isPinned ? 'border-indigo-200 text-indigo-600 hover:bg-indigo-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        {selected.isPinned ? '고정 해제' : '📌 고정'}
                      </button>
                    )}
                    <button onClick={() => startEdit(selected)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
                      수정
                    </button>
                    <button onClick={() => deleteNotice(selected.id)}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50">
                      삭제
                    </button>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{selected.content}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-slate-100 shadow-sm text-slate-400 text-sm">
              공지사항을 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
