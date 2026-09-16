'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PaymentFormProps {
  saleId: string
  totalAmount: string
  paidAmount: string
}

const STATUS_OPTIONS = [
  { value: 'PARTIAL', label: '부분입금' },
  { value: 'PAID', label: '입금완료' },
]

export function PaymentForm({ saleId, totalAmount, paidAmount }: PaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newPaidAmount, setNewPaidAmount] = useState(paidAmount === '0' ? totalAmount : paidAmount)
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('PAID')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/accounting/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidAmount: newPaidAmount,
          paidDate,
          status,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? '처리 실패')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="font-bold text-navy mb-4">입금 처리</h2>
      {error && (
        <p className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-navy">입금 상태</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="입금금액"
          type="number"
          min="0"
          value={newPaidAmount}
          onChange={(e) => setNewPaidAmount(e.target.value)}
        />
        <Input
          label="입금일"
          type="date"
          value={paidDate}
          onChange={(e) => setPaidDate(e.target.value)}
        />
        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? '처리 중...' : '입금 처리'}
          </Button>
        </div>
      </form>
    </div>
  )
}
