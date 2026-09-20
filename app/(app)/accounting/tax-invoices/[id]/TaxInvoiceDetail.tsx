'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Invoice {
  id: string
  type: string
  invoiceNo: string | null
  issueDate: string
  amount: string
  taxAmount: string
  totalAmount: string
  description: string | null
  notes: string | null
  status: string
  vendor: { id: string; name: string; bizNo: string | null } | null
  sale: { id: string; title: string } | null
  purchase: { id: string; title: string } | null
  createdBy: { id: string; name: string }
  createdAt: string
}

const TYPE_LABEL: Record<string, string> = { ISSUED: '발행 (매출)', RECEIVED: '수취 (매입)' }
const TYPE_COLOR: Record<string, string> = {
  ISSUED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RECEIVED: 'bg-purple-50 text-purple-700 border-purple-200',
}
const STATUS_LABEL: Record<string, string> = {
  DRAFT: '임시저장', CONFIRMED: '확정', REPORTED: '신고완료', CANCELLED: '취소',
}
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-500',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  REPORTED: 'bg-blue-50 text-blue-700',
  CANCELLED: 'bg-red-50 text-red-600',
}

export function TaxInvoiceDetail({ invoice }: { invoice: Invoice }) {
  const router = useRouter()
  const [editStatus, setEditStatus] = useState(invoice.status)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setSaving(true)
    try {
      await fetch(`/api/tax-invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setEditStatus(newStatus)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/tax-invoices/${invoice.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/accounting/tax-invoices')
    } finally {
      setDeleting(false)
    }
  }

  const field = (label: string, value: React.ReactNode) => (
    <div className="flex items-start gap-4 py-3 border-b border-slate-50 last:border-0">
      <span className="w-28 text-xs text-slate-400 mt-0.5 shrink-0">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/accounting/tax-invoices" className="text-slate-400 hover:text-slate-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">세금계산서 상세</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/accounting/tax-invoices/new`}
            className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg"
          >
            + 새 등록
          </Link>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg"
            >
              삭제
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">정말 삭제할까요?</span>
              <button
                onClick={handleDelete} disabled={deleting}
                className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? '...' : '확인'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-slate-400 hover:text-slate-600">취소</button>
            </div>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLOR[invoice.type] ?? ''}`}>
            {TYPE_LABEL[invoice.type] ?? invoice.type}
          </span>
          <select
            value={editStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={saving}
            className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${STATUS_COLOR[editStatus] ?? ''}`}
          >
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {field('품목', invoice.description ?? '—')}
        {field('거래처', invoice.vendor
          ? <span>{invoice.vendor.name}{invoice.vendor.bizNo && <span className="ml-2 text-xs text-slate-400">{invoice.vendor.bizNo}</span>}</span>
          : '—'
        )}
        {field('발행일', invoice.issueDate.slice(0, 10))}
        {field('승인번호', invoice.invoiceNo
          ? <span className="font-mono text-xs">{invoice.invoiceNo}</span>
          : '—'
        )}
      </div>

      {/* 금액 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">금액</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">공급가액</p>
            <p className="text-base font-semibold text-slate-800">{Number(invoice.amount).toLocaleString('ko-KR')}원</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-400 mb-1">세액</p>
            <p className="text-base font-semibold text-slate-800">{Number(invoice.taxAmount).toLocaleString('ko-KR')}원</p>
          </div>
          <div className={`text-center p-3 rounded-lg ${invoice.type === 'ISSUED' ? 'bg-indigo-50' : 'bg-purple-50'}`}>
            <p className="text-xs text-slate-400 mb-1">합계</p>
            <p className={`text-lg font-bold ${invoice.type === 'ISSUED' ? 'text-indigo-700' : 'text-purple-700'}`}>
              {Number(invoice.totalAmount).toLocaleString('ko-KR')}원
            </p>
          </div>
        </div>
      </div>

      {/* 연결 정보 */}
      {(invoice.sale || invoice.purchase) && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">연결 항목</h2>
          {invoice.sale && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">매출</span>
              <span className="text-slate-600">{invoice.sale.title}</span>
            </div>
          )}
          {invoice.purchase && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded">매입</span>
              <span className="text-slate-600">{invoice.purchase.title}</span>
            </div>
          )}
        </div>
      )}

      {/* 비고 & 메타 */}
      {invoice.notes && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">비고</h2>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      <p className="text-xs text-slate-400 text-right">
        등록: {invoice.createdBy.name} · {new Date(invoice.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
      </p>
    </div>
  )
}
