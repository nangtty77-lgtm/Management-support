'use client'

import { useState, useEffect } from 'react'

const CATEGORY_LABEL: Record<string, string> = {
  SALES: '영업', MARKETING: '마케팅', LABOR: '인건비',
  OFFICE: '사무비', TRAVEL: '출장비', IT: 'IT',
  FACILITY: '시설', OTHER: '기타',
}
const CATEGORY_COLOR: Record<string, string> = {
  SALES: 'bg-indigo-500', MARKETING: 'bg-purple-500', LABOR: 'bg-blue-500',
  OFFICE: 'bg-slate-500', TRAVEL: 'bg-amber-500', IT: 'bg-cyan-500',
  FACILITY: 'bg-emerald-500', OTHER: 'bg-pink-500',
}
const CATEGORY_BG: Record<string, string> = {
  SALES: 'bg-indigo-50', MARKETING: 'bg-purple-50', LABOR: 'bg-blue-50',
  OFFICE: 'bg-slate-50', TRAVEL: 'bg-amber-50', IT: 'bg-cyan-50',
  FACILITY: 'bg-emerald-50', OTHER: 'bg-pink-50',
}

interface BudgetRow {
  id: string
  year: number
  month: number | null
  category: string
  title: string
  amount: string
  usedAmount: string
  notes: string | null
  department?: { name: string } | null
}

interface BudgetForm {
  category: string
  title: string
  amount: string
  month: string
  notes: string
}

export default function BudgetPage() {
  const year = new Date().getFullYear()
  const [budgets, setBudgets] = useState<BudgetRow[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<BudgetForm>({ category: 'SALES', title: '', amount: '', month: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/budget?year=${year}`).then((r) => r.json()).then(setBudgets)
  }, [year])

  const set = (k: keyof BudgetForm, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0)
  const totalUsed = budgets.reduce((s, b) => s + Number(b.usedAmount), 0)
  const usedPct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        category: form.category, title: form.title,
        amount: Number(form.amount.replace(/,/g, '')),
        month: form.month ? Number(form.month) : null,
        year, notes: form.notes || null,
      }
      if (editId) {
        const res = await fetch(`/api/budget/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const updated = await res.json()
        setBudgets((prev) => prev.map((b) => b.id === editId ? updated : b))
      } else {
        const res = await fetch('/api/budget', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const created = await res.json()
        setBudgets((prev) => [...prev, created])
      }
      setShowForm(false)
      setEditId(null)
      setForm({ category: 'SALES', title: '', amount: '', month: '', notes: '' })
    } catch {
      alert('저장에 실패했습니다.')
    }
    setSaving(false)
  }

  async function handleUpdateUsed(id: string, usedAmount: string) {
    const val = prompt('실제 집행금액을 입력하세요 (원):', usedAmount)
    if (val === null) return
    const res = await fetch(`/api/budget/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usedAmount: Number(val.replace(/,/g, '')) }) })
    const updated = await res.json()
    setBudgets((prev) => prev.map((b) => b.id === id ? updated : b))
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/budget/${id}`, { method: 'DELETE' })
    setBudgets((prev) => prev.filter((b) => b.id !== id))
  }

  function startEdit(b: BudgetRow) {
    setEditId(b.id)
    setForm({ category: b.category, title: b.title, amount: b.amount, month: b.month?.toString() || '', notes: b.notes || '' })
    setShowForm(true)
  }

  // Group by category
  const grouped = Object.entries(CATEGORY_LABEL).map(([cat, label]) => ({
    cat, label,
    items: budgets.filter((b) => b.category === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">예산관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">{year}년 예산 현황</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ category: 'SALES', title: '', amount: '', month: '', notes: '' }); setShowForm(true) }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          예산 등록
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '총 예산', value: totalBudget.toLocaleString('ko-KR') + '원', color: 'text-slate-900' },
          { label: '집행금액', value: totalUsed.toLocaleString('ko-KR') + '원', color: 'text-amber-600' },
          { label: '잔여예산', value: (totalBudget - totalUsed).toLocaleString('ko-KR') + '원', color: totalBudget - totalUsed >= 0 ? 'text-emerald-600' : 'text-red-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-500 mb-1">{item.label}</p>
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            {item.label === '집행금액' && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1"><span>집행율</span><span>{usedPct}%</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${usedPct > 90 ? 'bg-red-500' : usedPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(usedPct, 100)}%` }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">{editId ? '예산 수정' : '예산 등록'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">항목명 *</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="광고비" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">분류</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                {Object.entries(CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">월 (선택)</label>
              <select value={form.month} onChange={(e) => set('month', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">연간</option>
                {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={String(i+1)}>{i+1}월</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">예산금액 (원) *</label>
              <input value={form.amount} onChange={(e) => set('amount', e.target.value)} inputMode="numeric"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="5000000" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">메모</label>
              <input value={form.notes} onChange={(e) => set('notes', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={!form.title || !form.amount || saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              취소
            </button>
          </div>
        </div>
      )}

      {/* Budget list by category */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm text-center py-20">
          <p className="text-slate-500">등록된 예산이 없습니다</p>
        </div>
      ) : grouped.map(({ cat, label, items }) => {
        const catBudget = items.reduce((s, b) => s + Number(b.amount), 0)
        const catUsed = items.reduce((s, b) => s + Number(b.usedAmount), 0)
        const pct = catBudget > 0 ? Math.round((catUsed / catBudget) * 100) : 0
        return (
          <div key={cat} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`flex items-center justify-between px-5 py-3.5 border-b border-slate-100 ${CATEGORY_BG[cat]}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${CATEGORY_COLOR[cat]}`} />
                <span className="font-semibold text-sm text-slate-800">{label}</span>
                <span className="text-xs text-slate-500">{items.length}건</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-700">{catBudget.toLocaleString('ko-KR')}원</div>
                <div className="text-xs text-slate-400">집행 {pct}% · {catUsed.toLocaleString('ko-KR')}원</div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-slate-100">
              <div className={`h-full ${CATEGORY_COLOR[cat]} transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-50">
                {items.map((b) => {
                  const bPct = Number(b.amount) > 0 ? Math.round((Number(b.usedAmount) / Number(b.amount)) * 100) : 0
                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <span className="font-medium text-slate-800">{b.title}</span>
                        {b.month && <span className="ml-2 text-xs text-slate-400">{b.month}월</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{Number(b.amount).toLocaleString('ko-KR')}원</td>
                      <td className="px-5 py-3 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${bPct > 90 ? 'bg-red-500' : bPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(bPct, 100)}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{bPct}%</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{Number(b.usedAmount).toLocaleString('ko-KR')}원 집행</p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleUpdateUsed(b.id, b.usedAmount)}
                            className="text-xs text-indigo-600 hover:underline">집행 업데이트</button>
                          <button onClick={() => startEdit(b)}
                            className="text-xs text-slate-500 hover:text-slate-700">수정</button>
                          <button onClick={() => handleDelete(b.id)}
                            className="text-xs text-red-400 hover:text-red-600">삭제</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      })}
    </div>
  )
}
