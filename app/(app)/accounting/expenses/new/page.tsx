'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const EXPENSE_TYPES = [
  { value: 'CORPORATE_CARD', label: '법인카드' },
  { value: 'PERSONAL', label: '개인경비' },
  { value: 'TRAVEL', label: '출장비' },
  { value: 'ENTERTAINMENT', label: '접대비' },
  { value: 'VEHICLE', label: '차량비' },
  { value: 'SUPPLIES', label: '소모품비' },
  { value: 'OTHER', label: '기타' },
]

export default function ExpenseNewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    type: 'CORPORATE_CARD',
    title: '',
    amount: '',
    expenseDate: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('비용명을 입력해주세요.'); return }
    if (!form.amount || Number(form.amount) <= 0) { setError('금액을 입력해주세요.'); return }
    if (!form.expenseDate) { setError('비용 발생일을 입력해주세요.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          amount: form.amount,
          expenseDate: form.expenseDate,
          notes: form.notes || undefined,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? '저장 실패')
      }
      router.push('/accounting/expenses')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">비용 신청</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {error && (
          <p className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-navy">비용 유형</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              {EXPENSE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="비용명 *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="비용명을 입력하세요"
          />

          <Input
            label="금액 *"
            type="number"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0"
          />

          <Input
            label="비용 발생일 *"
            type="date"
            value={form.expenseDate}
            onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
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
              {loading ? '저장 중...' : '신청'}
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
