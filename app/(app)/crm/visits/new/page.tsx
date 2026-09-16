'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NewVisitForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; companyName: string | null }>>([])
  const [form, setForm] = useState({
    customerId: searchParams.get('customerId') || '',
    title: '',
    visitDate: '',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/crm/customers').then((r) => r.json()).then(setCustomers)
  }, [])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/crm/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, status: 'PLANNED' }),
    })
    router.push('/crm/visits')
    router.refresh()
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">방문계획 추가</h1>
        <p className="text-sm text-slate-500 mt-0.5">방문 일정을 등록하세요</p>
      </div>
      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">고객 *</label>
          <select required value={form.customerId} onChange={set('customerId')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">고객 선택</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName ? `${c.name} (${c.companyName})` : c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">방문명 *</label>
          <input required value={form.title} onChange={set('title')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="정기 미팅, 제품 소개, 계약 협의..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">방문일 *</label>
          <input required type="datetime-local" value={form.visitDate} onChange={set('visitDate')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">메모</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="방문 목적, 준비사항..." />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={() => router.back()} className="border border-slate-200 text-slate-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewVisitPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">로딩 중...</div>}>
      <NewVisitForm />
    </Suspense>
  )
}
