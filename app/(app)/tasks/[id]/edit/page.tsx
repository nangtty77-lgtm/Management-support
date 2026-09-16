'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface Employee {
  id: string
  user: { name: string }
}

interface Task {
  id: string
  title: string
  description: string | null
  assigneeId: string | null
  priority: string
  dueDate: string | null
}

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: '긴급' },
  { value: 'HIGH', label: '높음' },
  { value: 'NORMAL', label: '보통' },
  { value: 'LOW', label: '낮음' },
]

export default function TaskEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'NORMAL',
    dueDate: '',
  })

  useEffect(() => {
    params.then(({ id: taskId }) => {
      setId(taskId)
      Promise.all([
        fetch(`/api/tasks/${taskId}`).then((r) => r.json()) as Promise<Task>,
        fetch('/api/employees').then((r) => r.json()) as Promise<Employee[]>,
      ])
        .then(([task, emps]) => {
          setForm({
            title: task.title ?? '',
            description: task.description ?? '',
            assigneeId: task.assigneeId ?? '',
            priority: task.priority ?? 'NORMAL',
            dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
          })
          setEmployees(Array.isArray(emps) ? emps : [])
        })
        .catch(() => setError('데이터를 불러오지 못했습니다.'))
        .finally(() => setLoading(false))
    })
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          assigneeId: form.assigneeId || null,
          priority: form.priority,
          dueDate: form.dueDate || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? '저장 실패')
      }
      router.push(`/tasks/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const employeeOptions = [
    { value: '', label: '담당자 없음' },
    ...employees.map((e) => ({ value: e.id, label: e.user.name })),
  ]

  if (loading) {
    return <div className="text-sub text-sm">불러오는 중...</div>
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-navy">업무 수정</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {error && (
          <p className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="제목 *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="업무 제목을 입력하세요"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-navy">설명</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="업무 설명을 입력하세요 (선택)"
            />
          </div>
          <Select
            label="담당자"
            options={employeeOptions}
            value={form.assigneeId}
            onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
          />
          <Select
            label="우선순위"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
          />
          <Input
            label="마감일"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
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
