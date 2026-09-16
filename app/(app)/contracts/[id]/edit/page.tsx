'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface Contract {
  id: string
  name: string
  vendorName: string
  amount: string
  startDate: string
  endDate: string
  autoRenewal: boolean
  status: string
  notes: string | null
}

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '유효' },
  { value: 'DRAFT', label: '초안' },
  { value: 'EXPIRED', label: '만료' },
  { value: 'TERMINATED', label: '해지' },
]

export default function ContractEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    vendorName: '',
    amount: '',
    startDate: '',
    endDate: '',
    autoRenewal: false,
    status: 'ACTIVE',
    notes: '',
  })

  useEffect(() => {
    params.then(({ id: contractId }) => {
      setId(contractId)
      fetch(`/api/contracts/${contractId}`)
        .then((r) => r.json())
        .then((data: Contract) => {
          setForm({
            name: data.name ?? '',
            vendorName: data.vendorName ?? '',
            amount: data.amount ?? '',
            startDate: data.startDate ? data.startDate.slice(0, 10) : '',
            endDate: data.endDate ? data.endDate.slice(0, 10) : '',
            autoRenewal: data.autoRenewal ?? false,
            status: data.status ?? 'ACTIVE',
            notes: data.notes ?? '',
          })
        })
        .catch(() => setError('데이터를 불러오지 못했습니다.'))
        .finally(() => setLoading(false))
    })
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('계약명을 입력해주세요.'); return }
    if (!form.vendorName.trim()) { setError('거래처를 입력해주세요.'); return }
    if (!form.amount || isNaN(Number(form.amount))) { setError('올바른 금액을 입력해주세요.'); return }
    if (!form.endDate) { setError('종료일을 입력해주세요.'); return }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          vendorName: form.vendorName,
          amount: form.amount,
          endDate: form.endDate,
          status: form.status,
          notes: form.notes || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? '저장 실패')
      }
      router.push(`/contracts/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sub text-sm">불러오는 중...</div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">계약 수정</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {error && (
          <p className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="계약명 *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="계약명을 입력하세요"
          />
          <Input
            label="거래처 *"
            value={form.vendorName}
            onChange={(e) => setForm((f) => ({ ...f, vendorName: e.target.value }))}
            placeholder="거래처명을 입력하세요"
          />
          <Input
            label="계약금액 (원) *"
            type="number"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="계약금액을 입력하세요"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="시작일"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              disabled
            />
            <Input
              label="종료일 *"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <Select
            label="상태"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-navy">비고</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="비고를 입력하세요 (선택)"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
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
