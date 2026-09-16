'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const TYPE_OPTIONS = [
  { value: 'ANNUAL', label: '연차' },
  { value: 'SICK', label: '병가' },
  { value: 'SPECIAL', label: '특별' },
  { value: 'UNPAID', label: '무급' },
]

function calcDays(start: string, end: string): number {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1
  return Math.max(0.5, diff)
}

export default function LeaveNewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const days = calcDays(form.startDate, form.endDate)

  useEffect(() => {
    if (form.startDate && !form.endDate) {
      setForm((f) => ({ ...f, endDate: form.startDate }))
    }
  }, [form.startDate, form.endDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.startDate) { setError('시작일을 입력해주세요.'); return }
    if (!form.endDate) { setError('종료일을 입력해주세요.'); return }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('종료일은 시작일 이후여야 합니다.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
          days,
          reason: form.reason || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? '저장 실패')
      }
      router.push('/leaves')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">연차 신청</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {error && (
          <p className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="구분 *"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="시작일 *"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label="종료일 *"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
            <span className="text-sub">신청 일수: </span>
            <span className="font-medium text-navy">{form.startDate && form.endDate ? `${days}일` : '—'}</span>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-navy">사유</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="사유를 입력하세요 (선택)"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? '신청 중...' : '신청'}
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
