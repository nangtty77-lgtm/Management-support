'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NewOpportunityForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: string; name: string; companyName: string | null }>>([])
  const [form, setForm] = useState({
    customerId: searchParams.get('customerId') || '',
    title: '',
    amount: '',
    stage: 'LEAD',
    probability: '0',
    expectedClose: '',
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
    await fetch('/api/crm/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount.replace(/,/g, '')) || 0,
        probability: Number(form.probability),
      }),
    })
    router.push('/crm/opportunities')
    router.refresh()
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">영업기회 등록</h1>
        <p className="text-sm text-slate-500 mt-0.5">새 영업기회를 등록하세요</p>
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
          <label className="block text-xs font-medium text-slate-700 mb-1">영업기회명 *</label>
          <input required value={form.title} onChange={set('title')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="프로젝트명 또는 상품명" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">예상 금액 (원)</label>
            <input type="number" value={form.amount} onChange={set('amount')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">성사 확률 (%)</label>
            <input type="number" min="0" max="100" value={form.probability} onChange={set('probability')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">단계</label>
            <select value={form.stage} onChange={set('stage')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="LEAD">리드</option>
              <option value="QUALIFIED">검증</option>
              <option value="PROPOSAL">제안</option>
              <option value="NEGOTIATION">협상</option>
              <option value="CLOSED_WON">수주</option>
              <option value="CLOSED_LOST">실패</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">예상 마감일</label>
            <input type="date" value={form.expectedClose} onChange={set('expectedClose')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">메모</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="영업 전략, 특이사항..." />
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

export default function NewOpportunityPage() {
  return (
    <Suspense fallback={<div className="text-slate-500">로딩 중...</div>}>
      <NewOpportunityForm />
    </Suspense>
  )
}
