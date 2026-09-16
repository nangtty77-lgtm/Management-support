'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '재직' },
  { value: 'PROBATION', label: '수습' },
  { value: 'LEAVE', label: '휴직' },
  { value: 'RESIGNED', label: '퇴직' },
]

export default function EmployeeNewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
    position: '',
    phone: '',
    hireDate: '',
    status: 'ACTIVE',
    annualLeave: '15',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('이름을 입력해주세요.'); return }
    if (!form.email.trim()) { setError('이메일을 입력해주세요.'); return }
    if (!form.departmentId.trim()) { setError('부서 ID를 입력해주세요.'); return }
    if (!form.position.trim()) { setError('직급을 입력해주세요.'); return }
    if (!form.hireDate) { setError('입사일을 입력해주세요.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          departmentId: form.departmentId,
          position: form.position,
          phone: form.phone || undefined,
          hireDate: form.hireDate,
          status: form.status,
          annualLeave: Number(form.annualLeave),
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? '저장 실패')
      }
      router.push('/employees')
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">직원 등록</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {error && (
          <p className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이름 *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="이름을 입력하세요"
          />
          <Input
            label="이메일 *"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="이메일을 입력하세요"
          />
          <Input
            label="비밀번호 (미입력 시 bizhub1234! 적용)"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="비밀번호를 입력하세요 (선택)"
          />
          <Input
            label="부서 ID *"
            value={form.departmentId}
            onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
            placeholder="부서 ID를 입력하세요"
          />
          <Input
            label="직급 *"
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            placeholder="직급을 입력하세요"
          />
          <Input
            label="연락처"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="연락처를 입력하세요 (선택)"
          />
          <Input
            label="입사일 *"
            type="date"
            value={form.hireDate}
            onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))}
          />
          <Select
            label="상태"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          />
          <Input
            label="연차 (일)"
            type="number"
            min="0"
            value={form.annualLeave}
            onChange={(e) => setForm((f) => ({ ...f, annualLeave: e.target.value }))}
          />
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
