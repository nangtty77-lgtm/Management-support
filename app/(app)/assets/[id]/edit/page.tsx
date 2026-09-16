'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'IT_EQUIPMENT', label: 'IT장비' },
  { value: 'FURNITURE', label: '가구/집기' },
  { value: 'VEHICLE', label: '차량' },
  { value: 'MACHINERY', label: '기계' },
  { value: 'OFFICE_SUPPLIES', label: '사무용품' },
  { value: 'BUILDING', label: '건물' },
  { value: 'OTHER', label: '기타' },
]

const STATUSES = [
  { value: 'IN_USE', label: '사용중' },
  { value: 'IN_STORAGE', label: '보관중' },
  { value: 'UNDER_REPAIR', label: '수리중' },
  { value: 'DISPOSED', label: '폐기' },
]

export default function AssetEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    name: '', code: '', category: 'IT_EQUIPMENT', status: 'IN_USE',
    purchaseDate: '', purchasePrice: '', currentValue: '',
    location: '', vendor: '', serialNo: '', notes: '',
  })

  useEffect(() => {
    fetch(`/api/assets/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          name: data.name || '',
          code: data.code || '',
          category: data.category || 'IT_EQUIPMENT',
          status: data.status || 'IN_USE',
          purchaseDate: data.purchaseDate ? data.purchaseDate.slice(0, 10) : '',
          purchasePrice: data.purchasePrice || '',
          currentValue: data.currentValue || '',
          location: data.location || '',
          vendor: data.vendor || '',
          serialNo: data.serialNo || '',
          notes: data.notes || '',
        })
      })
  }, [id])

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          purchasePrice: form.purchasePrice ? Number(String(form.purchasePrice).replace(/,/g, '')) : null,
          currentValue: form.currentValue ? Number(String(form.currentValue).replace(/,/g, '')) : null,
        }),
      })
      if (!res.ok) throw new Error('수정 실패')
      router.push('/assets')
    } catch {
      alert('자산 수정에 실패했습니다.')
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('이 자산을 삭제하시겠습니까?')) return
    setDeleting(true)
    await fetch(`/api/assets/${id}`, { method: 'DELETE' })
    router.push('/assets')
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/assets" className="text-slate-400 hover:text-slate-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">자산 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">자산명 <span className="text-red-500">*</span></label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">자산번호</label>
            <input value={form.code} onChange={(e) => set('code', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">시리얼번호</label>
            <input value={form.serialNo} onChange={(e) => set('serialNo', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">분류</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">상태</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">취득일</label>
            <input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">위치</label>
            <input value={form.location} onChange={(e) => set('location', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">취득가액 (원)</label>
            <input value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              inputMode="numeric" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">현재가치 (원)</label>
            <input value={form.currentValue} onChange={(e) => set('currentValue', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              inputMode="numeric" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">공급업체</label>
            <input value={form.vendor} onChange={(e) => set('vendor', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">메모</label>
            <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {loading ? '저장 중...' : '저장'}
            </button>
            <Link href="/assets" className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              취소
            </Link>
          </div>
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 hover:underline disabled:opacity-50">
            삭제
          </button>
        </div>
      </form>
    </div>
  )
}
