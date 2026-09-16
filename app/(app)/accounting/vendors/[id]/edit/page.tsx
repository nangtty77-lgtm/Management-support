'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface VendorData {
  id: string
  name: string
  bizNo: string | null
  ceoName: string | null
  address: string | null
  phone: string | null
  email: string | null
  type: string
}

const TYPE_OPTIONS = [
  { value: 'BOTH', label: '고객/매입처' },
  { value: 'CUSTOMER', label: '고객사' },
  { value: 'SUPPLIER', label: '매입처' },
]

export default function VendorEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [vendorId, setVendorId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    bizNo: '',
    ceoName: '',
    address: '',
    phone: '',
    email: '',
    type: 'BOTH',
  })

  useEffect(() => {
    params.then(({ id }) => {
      setVendorId(id)
      fetch(`/api/vendors/${id}`)
        .then((r) => r.json())
        .then((data: VendorData) => {
          setForm({
            name: data.name ?? '',
            bizNo: data.bizNo ?? '',
            ceoName: data.ceoName ?? '',
            address: data.address ?? '',
            phone: data.phone ?? '',
            email: data.email ?? '',
            type: data.type ?? 'BOTH',
          })
        })
        .catch(() => setError('데이터를 불러오지 못했습니다.'))
        .finally(() => setLoading(false))
    })
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('거래처명을 입력해주세요.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          bizNo: form.bizNo || undefined,
          ceoName: form.ceoName || undefined,
          address: form.address || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          type: form.type,
        }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? '저장 실패')
      }
      router.push(`/accounting/vendors/${vendorId}`)
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
      <h1 className="text-2xl font-bold text-navy">거래처 수정</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {error && (
          <p className="text-danger text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="거래처명 *"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="거래처명을 입력하세요"
          />
          <Input
            label="사업자번호"
            value={form.bizNo}
            onChange={(e) => setForm((f) => ({ ...f, bizNo: e.target.value }))}
            placeholder="000-00-00000"
          />
          <Input
            label="대표자명"
            value={form.ceoName}
            onChange={(e) => setForm((f) => ({ ...f, ceoName: e.target.value }))}
            placeholder="대표자명을 입력하세요"
          />
          <Input
            label="주소"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="주소를 입력하세요"
          />
          <Input
            label="전화번호"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="000-0000-0000"
          />
          <Input
            label="이메일"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="example@company.com"
          />
          <Select
            label="유형"
            options={TYPE_OPTIONS}
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
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
