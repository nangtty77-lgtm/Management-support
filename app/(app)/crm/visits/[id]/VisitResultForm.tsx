'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function VisitResultForm({ visitId, currentStatus }: { visitId: string; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ status: 'COMPLETED', result: '', nextAction: '' })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/crm/visits/${visitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">결과 상태</label>
        <select value={form.status} onChange={set('status')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="COMPLETED">완료</option>
          <option value="DELAYED">지연</option>
          <option value="CANCELLED">취소</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">방문 결과</label>
        <textarea value={form.result} onChange={set('result')} rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="미팅 내용, 협의 사항, 고객 반응..." />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">다음 액션</label>
        <input value={form.nextAction} onChange={set('nextAction')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="후속 조치, 다음 일정..." />
      </div>
      <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {loading ? '저장 중...' : '결과 저장'}
      </button>
    </form>
  )
}
