'use client'
import { Button } from '@/components/ui/Button'

const STATUSES = [
  { value: 'PENDING', label: '대기' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'REVIEW', label: '검토' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'ON_HOLD', label: '보류' },
]

export default function StatusChanger({ taskId, currentStatus }: { taskId: string; currentStatus: string }) {
  async function changeStatus(status: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    window.location.reload()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => (
        <Button
          key={s.value}
          size="sm"
          variant={currentStatus === s.value ? 'primary' : 'secondary'}
          onClick={() => changeStatus(s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  )
}
