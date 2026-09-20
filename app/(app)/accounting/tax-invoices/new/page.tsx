'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewTaxInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    type: 'ISSUED',
    invoiceNo: '',
    issueDate: new Date().toISOString().slice(0, 10),
    amount: '',
    taxAmount: '',
    totalAmount: '',
    description: '',
    notes: '',
    status: 'DRAFT',
    vendorId: '',
  })

  useEffect(() => {
    fetch('/api/vendors').then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setVendors(d)
    }).catch(() => {})
  }, [])

  function handleAmountChange(field: 'amount' | 'taxAmount', value: string) {
    const updated = { ...form, [field]: value }
    if (field === 'amount') {
      const amt = Number(value.replace(/[^0-9]/g, ''))
      updated.taxAmount = String(Math.round(amt * 0.1))
      updated.totalAmount = String(amt + Math.round(amt * 0.1))
    } else {
      const amt = Number(updated.amount.replace(/[^0-9]/g, ''))
      const tax = Number(value.replace(/[^0-9]/g, ''))
      updated.totalAmount = String(amt + tax)
    }
    setForm(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.issueDate) return
    setLoading(true)
    try {
      const res = await fetch('/api/tax-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          invoiceNo: form.invoiceNo || null,
          issueDate: form.issueDate,
          amount: form.amount,
          taxAmount: form.taxAmount || '0',
          totalAmount: form.totalAmount || form.amount,
          description: form.description || null,
          notes: form.notes || null,
          status: form.status,
          vendorId: form.vendorId || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/accounting/tax-invoices/${data.id}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/accounting/tax-invoices" className="text-slate-400 hover:text-slate-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">세금계산서 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        {/* 유형 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">유형 *</label>
          <div className="flex gap-3">
            {[{ v: 'ISSUED', l: '발행 (매출)' }, { v: 'RECEIVED', l: '수취 (매입)' }].map(({ v, l }) => (
              <button
                key={v} type="button"
                onClick={() => setForm({ ...form, type: v })}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  form.type === v
                    ? v === 'ISSUED' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-purple-600 text-white border-purple-600'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* 발행일 + 승인번호 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">발행일 *</label>
            <input
              type="date" value={form.issueDate}
              onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">승인번호</label>
            <input
              type="text" value={form.invoiceNo} placeholder="승인번호 (선택)"
              onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 거래처 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">거래처</label>
          <select
            value={form.vendorId}
            onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">거래처 선택 (선택)</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>

        {/* 품목 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">품목</label>
          <input
            type="text" value={form.description} placeholder="품목/내용을 입력하세요"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 금액 */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">금액 *</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">공급가액</label>
              <input
                type="number" value={form.amount} placeholder="0"
                onChange={(e) => handleAmountChange('amount', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">세액 (10%)</label>
              <input
                type="number" value={form.taxAmount} placeholder="자동 계산"
                onChange={(e) => handleAmountChange('taxAmount', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">합계</label>
              <input
                type="number" value={form.totalAmount} placeholder="자동 계산"
                readOnly
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
          {form.amount && (
            <p className="text-xs text-slate-400">
              합계: {(Number(form.totalAmount)).toLocaleString('ko-KR')}원
            </p>
          )}
        </div>

        {/* 상태 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">상태</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="DRAFT">임시저장</option>
            <option value="CONFIRMED">확정</option>
            <option value="REPORTED">신고완료</option>
          </select>
        </div>

        {/* 비고 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">비고</label>
          <textarea
            value={form.notes} placeholder="메모 (선택)"
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* 버튼 */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/accounting/tax-invoices"
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
            취소
          </Link>
          <button
            type="submit" disabled={loading}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
