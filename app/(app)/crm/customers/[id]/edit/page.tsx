'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [id, setId] = useState('')
  const [form, setForm] = useState({
    name: '', companyName: '', phone: '', email: '',
    address: '', industry: '', grade: 'NORMAL', status: 'ACTIVE', notes: '',
  })

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid)
      fetch(`/api/crm/customers/${pid}`).then((r) => r.json()).then((c) => {
        setForm({
          name: c.name || '',
          companyName: c.companyName || '',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          industry: c.industry || '',
          grade: c.grade || 'NORMAL',
          status: c.status || 'ACTIVE',
          notes: c.notes || '',
        })
      })
    })
  }, [params])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch(`/api/crm/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.push(`/crm/customers/${id}`)
    router.refresh()
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">고객 수정</h1>
        <p className="text-sm text-slate-500 mt-0.5">고객 정보를 수정하세요</p>
      </div>
      <form onSubmit={submit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">고객명 *</label>
            <input required value={form.name} onChange={set('name')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">회사명</label>
            <input value={form.companyName} onChange={set('companyName')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">연락처</label>
            <input value={form.phone} onChange={set('phone')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">이메일</label>
            <input type="email" value={form.email} onChange={set('email')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">업종</label>
          <input value={form.industry} onChange={set('industry')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">주소</label>
          <input value={form.address} onChange={set('address')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">등급</label>
            <select value={form.grade} onChange={set('grade')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="NORMAL">일반</option>
              <option value="PREMIUM">프리미엄</option>
              <option value="VIP">VIP</option>
              <option value="INACTIVE">비활성</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">상태</label>
            <select value={form.status} onChange={set('status')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ACTIVE">활성</option>
              <option value="PROSPECT">잠재</option>
              <option value="INACTIVE">비활성</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">메모</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
