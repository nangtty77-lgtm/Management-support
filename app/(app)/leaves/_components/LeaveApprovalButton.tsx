'use client'
import { Button } from '@/components/ui/Button'

export default function LeaveApprovalButton({ leaveId }: { leaveId: string }) {
  async function handle(status: 'APPROVED' | 'REJECTED') {
    await fetch(`/api/leaves/${leaveId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    window.location.reload()
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="primary" onClick={() => handle('APPROVED')}>승인</Button>
      <Button size="sm" variant="danger" onClick={() => handle('REJECTED')}>반려</Button>
    </div>
  )
}
