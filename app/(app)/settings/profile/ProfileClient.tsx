'use client'

import { useState } from 'react'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: '관리자', HR: 'HR', GENERAL: '일반', OPS: '운영', VIEW: '조회',
}

export function ProfileClient({ user }: { user: { id: string; name: string; email: string; role: string } }) {
  const [name, setName] = useState(user.name)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function save() {
    if (newPw && newPw !== confirmPw) { setMsg({ type: 'err', text: '새 비밀번호가 일치하지 않습니다' }); return }
    setSaving(true); setMsg(null)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, currentPassword: currentPw || undefined, newPassword: newPw || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setMsg({ type: 'err', text: data.error ?? '저장 실패' }); return }
      setMsg({ type: 'ok', text: '저장되었습니다' })
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch { setMsg({ type: 'err', text: '저장 실패' }) }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">내 프로필</h1>
        <p className="text-sm text-slate-400 mt-0.5">계정 정보와 비밀번호를 관리합니다</p>
      </div>

      {/* 계정 정보 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">기본 정보</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">이름</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">이메일</label>
            <input
              value={user.email}
              disabled
              className="w-full border border-slate-100 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">권한</label>
            <div className="text-sm text-slate-600 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
              {ROLE_LABEL[user.role] ?? user.role}
            </div>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">비밀번호 변경</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="현재 비밀번호"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">새 비밀번호</label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="8자 이상"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="비밀번호 재입력"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-2.5 rounded-lg ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      <button
        onClick={save} disabled={saving}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}
