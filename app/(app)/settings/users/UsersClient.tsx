'use client'

import { useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
  department: { name: string } | null
}

const ROLE_OPTIONS = ['ADMIN', 'HR', 'GENERAL', 'OPS', 'VIEW']
const ROLE_LABEL: Record<string, string> = { ADMIN: '관리자', HR: 'HR', GENERAL: '일반', OPS: '운영', VIEW: '조회' }
const ROLE_COLOR: Record<string, string> = {
  ADMIN: 'bg-red-50 text-red-700', HR: 'bg-purple-50 text-purple-700',
  GENERAL: 'bg-slate-100 text-slate-600', OPS: 'bg-blue-50 text-blue-700', VIEW: 'bg-slate-50 text-slate-500',
}

export function UsersClient({ users: initial, currentUserId }: { users: User[]; currentUserId: string }) {
  const [users, setUsers] = useState<User[]>(initial)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'VIEW', password: '' })
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')

  async function updateUser(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/settings/users/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setUsers(us => us.map(u => u.id === id ? { ...u, ...updated } : u))
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('사용자를 삭제하시겠습니까?')) return
    const res = await fetch(`/api/settings/users/${id}`, { method: 'DELETE' })
    if (res.ok) setUsers(us => us.filter(u => u.id !== id))
    else { const d = await res.json(); alert(d.error) }
  }

  async function addUser() {
    if (!form.name || !form.email || !form.password) { setErr('모든 항목을 입력해주세요'); return }
    setAdding(true); setErr('')
    const res = await fetch('/api/settings/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { setErr(data.error ?? '추가 실패'); setAdding(false); return }
    setUsers(us => [...us, { ...data, department: null }])
    setForm({ name: '', email: '', role: 'VIEW', password: '' })
    setShowAdd(false); setAdding(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">사용자 관리</h1>
          <p className="text-sm text-slate-400 mt-0.5">총 {users.length}명</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + 사용자 추가
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-indigo-800">새 사용자 추가</h3>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="이름" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="이메일" type="email" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="임시 비밀번호" type="password" className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex gap-2">
            <button onClick={addUser} disabled={adding}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {adding ? '추가 중...' : '추가'}
            </button>
            <button onClick={() => { setShowAdd(false); setErr('') }}
              className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">
              취소
            </button>
          </div>
        </div>
      )}

      {/* Settings nav */}
      <div className="flex gap-2 border-b border-slate-100 pb-0">
        <Link href="/settings/profile" className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">프로필</Link>
        <span className="px-4 py-2 text-sm text-indigo-700 font-medium border-b-2 border-indigo-600">사용자 관리</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">이름</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">이메일</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">권한</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">상태</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400">등록일</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {u.name}
                  {u.id === currentUserId && <span className="ml-2 text-xs text-indigo-500 font-normal">(나)</span>}
                </td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  {u.id === currentUserId ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLOR[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                  ) : (
                    <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500 ${ROLE_COLOR[u.role]}`}>
                      {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.id === currentUserId ? (
                    <span className="text-xs text-emerald-600">활성</span>
                  ) : (
                    <button onClick={() => updateUser(u.id, { active: !u.active })}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${u.active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                      {u.active ? '활성' : '비활성'}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUserId && (
                    <button onClick={() => deleteUser(u.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                      삭제
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
