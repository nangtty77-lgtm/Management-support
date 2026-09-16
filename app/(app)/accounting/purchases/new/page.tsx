'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Vendor {
  id: string
  name: string
}

export default function PurchaseNewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vendors, setVendors] = useState<Vendor[]>([])

  const [form, setForm] = useState({
    vendorId: '',
    title: '',
    amount: '',
    taxAmount: '',
    purchaseDate: '',
    dueDate: '',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/vendors')
      .then((r) => r.json())
      .then((data: Vendor[]) => {
        setVendors(data)
        if (data.length > 0) setForm((f) => ({ ...f, vendorId: data[0].id }))
      })
      .catch(() => {})
  }, [])

  const totalAmount =
    (Number(form.amount) || 0) + (Number(form.taxAmount) || 0)

  const handleAmountChange = (val: string) => {
    const amt = Number(val) || 0
    setForm((f) => ({
      ...f,
      amount: val,
      taxAmount: Math.round(amt * 0.1).toString(),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendorId) { setError('거래처를 선택해주세요.'); return }
    if (!form.title.trim()) { setError('매입명을 입력해주세요.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setError('공급가액을 입력해주세요.'); return }
    if (!form.purchaseDate) { setError('매입일을 입력해주세요.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/accounting/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: form.vendorId,
          title: form.title,
          amount: form.amount,
          taxAmount: form.taxAmount || '0',
          totalAmount: totalAmount.toString(),
          purchaseDate: form.purchaseDate,
          dueDate: form.dueDate || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? '저장 실패')
      }
      router.push('/accounting/purchases')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">매입 등록</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {error && (
          <p className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-navy">거래처 *</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
              value={form.vendorId}
              onChange={(e) => setForm((f) => ({ ...f, vendorId: e.target.value }))}
            >
              {vendors.length === 0 && <option value="">로딩 중...</option>}
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="매입명 *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="매입명을 입력하세요"
          />

          <Input
            label="공급가액 *"
            type="number"
            min="0"
            value={form.amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0"
          />

          <Input
            label="세액 (공급가액 × 10%)"
            type="number"
            min="0"
            value={form.taxAmount}
            onChange={(e) => setForm((f) => ({ ...f, taxAmount: e.target.value }))}
            placeholder="0"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-navy">합계</label>
            <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-sub">
              {totalAmount.toLocaleString('ko-KR')}원
            </div>
          </div>

          <Input
            label="매입일 *"
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
          />

          <Input
            label="지급예정일"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-navy">메모</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="메모를 입력하세요"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
