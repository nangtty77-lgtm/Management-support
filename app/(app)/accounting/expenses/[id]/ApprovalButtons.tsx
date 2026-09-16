'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface ApprovalButtonsProps {
  expenseId: string
}

export function ApprovalButtons({ expenseId }: ApprovalButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/accounting/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
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
    <div className="space-y-2">
      {error && (
        <p className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          variant="primary"
          disabled={loading}
          onClick={() => handleAction('APPROVED')}
        >
          승인
        </Button>
        <Button
          variant="danger"
          disabled={loading}
          onClick={() => handleAction('REJECTED')}
        >
          반려
        </Button>
      </div>
    </div>
  )
}
