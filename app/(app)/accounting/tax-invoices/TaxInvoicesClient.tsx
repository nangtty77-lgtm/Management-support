'use client'

import { useState, useMemo } from 'react'
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
  status: string
  vendor: { id: string; name: string } | null
}

const TYPE_LABEL: Record<string, string> = { ISSUED: '발행', RECEIVED: '수취' }
const TYPE_COLOR: Record<string, string> = {
  ISSUED: 'bg-indigo-50 text-indigo-700',
  RECEIVED: 'bg-purple-50 text-purple-700',
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

const QUARTERS = [
  { label: '1분기', months: [1, 2, 3] },
  { label: '2분기', months: [4, 5, 6] },
  { label: '3분기', months: [7, 8, 9] },
  { label: '4분기', months: [10, 11, 12] },
]

function exportCSV(data: Invoice[]) {
  const header = ['유형', '승인번호', '거래처', '발행일', '공급가액', '세액', '합계', '상태']
  const rows = data.map((inv) => [
    TYPE_LABEL[inv.type] ?? inv.type,
    inv.invoiceNo ?? '',
    inv.vendor?.name ?? '',
    inv.issueDate.slice(0, 10),
    Number(inv.amount),
    Number(inv.taxAmount),
    Number(inv.totalAmount),
    STATUS_LABEL[inv.status] ?? inv.status,
  ])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `세금계산서_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function TaxInvoicesClient({ year, invoices }: { year: number; invoices: Invoice[] }) {
  const router = useRouter()
  const now = new Date()
  const thisYear = now.getFullYear()
  const years = [thisYear - 1, thisYear, thisYear + 1]

  const [tab, setTab] = useState<'ALL' | 'ISSUED' | 'RECEIVED'>('ALL')
  const [quarter, setQuarter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (tab !== 'ALL' && inv.type !== tab) return false
      if (statusFilter && inv.status !== statusFilter) return false
      if (quarter) {
        const q = QUARTERS.find((q) => q.label === quarter)
        if (q) {
          const m = new Date(inv.issueDate).getMonth() + 1
          if (!q.months.includes(m)) return false
        }
      }
      if (search) {
        const q = search.toLowerCase()
        if (
          !inv.description?.toLowerCase().includes(q) &&
          !inv.vendor?.name.toLowerCase().includes(q) &&
          !inv.invoiceNo?.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [invoices, tab, statusFilter, quarter, search])

  // 부가세 집계
  const issued = invoices.filter((i) => i.type === 'ISSUED')
  const received = invoices.filter((i) => i.type === 'RECEIVED')
  const issuedTax = issued.reduce((s, i) => s + Number(i.taxAmount), 0)
  const receivedTax = received.reduce((s, i) => s + Number(i.taxAmount), 0)
  const payTax = issuedTax - receivedTax

  const filteredTotal = filtered.reduce((s, i) => s + Number(i.totalAmount), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">세금계산서 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">{year}년 · {filtered.length}건 · {filteredTotal.toLocaleString('ko-KR')}원</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => router.push(`/accounting/tax-invoices?year=${y}`)}
                className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${
                  y === year ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {y}년
              </button>
            ))}
          </div>
          <button
            onClick={() => exportCSV(filtered)}
            className="border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            CSV
          </button>
          <Link
            href="/accounting/tax-invoices/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            세금계산서 등록
          </Link>
        </div>
      </div>

      {/* 부가세 집계 KPI */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4">
          <p className="text-xs text-indigo-500 mb-1">매출 세액 <span className="text-slate-400">({issued.length}건)</span></p>
          <p className="text-xl font-bold text-indigo-700">{issuedTax.toLocaleString('ko-KR')}원</p>
        </div>
        <div className="bg-purple-50 rounded-xl border border-purple-100 p-4">
          <p className="text-xs text-purple-500 mb-1">매입 세액 <span className="text-slate-400">({received.length}건)</span></p>
          <p className="text-xl font-bold text-purple-700">{receivedTax.toLocaleString('ko-KR')}원</p>
        </div>
        <div className={`rounded-xl border p-4 ${payTax >= 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <p className={`text-xs mb-1 ${payTax >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {payTax >= 0 ? '납부 세액' : '환급 세액'}
          </p>
          <p className={`text-xl font-bold ${payTax >= 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {Math.abs(payTax).toLocaleString('ko-KR')}원
          </p>
        </div>
      </div>

      {/* 탭 + 필터 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        {/* 탭 */}
        <div className="flex border-b border-slate-100">
          {(['ALL', 'ISSUED', 'RECEIVED'] as const).map((t) => {
            const label = t === 'ALL' ? '전체' : TYPE_LABEL[t]
            const cnt = t === 'ALL' ? invoices.length : invoices.filter((i) => i.type === t).length
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {label} <span className="ml-1 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{cnt}</span>
              </button>
            )
          })}
        </div>

        {/* 필터 */}
        <div className="px-4 py-3 flex flex-wrap gap-3 items-center border-b border-slate-50">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="거래처, 품목, 승인번호 검색..."
              className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select value={quarter} onChange={(e) => setQuarter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">전체 분기</option>
            {QUARTERS.map((q) => <option key={q.label} value={q.label}>{q.label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value="">전체 상태</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {(search || quarter || statusFilter) && (
            <button onClick={() => { setSearch(''); setQuarter(''); setStatusFilter('') }}
              className="text-sm text-slate-400 hover:text-slate-600">초기화</button>
          )}
        </div>

        {/* 테이블 */}
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['유형', '승인번호', '거래처', '품목', '발행일', '공급가액', '세액', '합계', '상태'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLOR[inv.type] ?? 'bg-slate-100 text-slate-600'}`}>
                    {TYPE_LABEL[inv.type] ?? inv.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">{inv.invoiceNo ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{inv.vendor?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <Link href={`/accounting/tax-invoices/${inv.id}`} className="text-slate-800 font-medium hover:text-indigo-600 hover:underline">
                    {inv.description ?? '—'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">{inv.issueDate.slice(0, 10)}</td>
                <td className="px-4 py-3 text-slate-600">{Number(inv.amount).toLocaleString('ko-KR')}원</td>
                <td className="px-4 py-3 text-slate-600">{Number(inv.taxAmount).toLocaleString('ko-KR')}원</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{Number(inv.totalAmount).toLocaleString('ko-KR')}원</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[inv.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {STATUS_LABEL[inv.status] ?? inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-slate-400">{year}년 세금계산서가 없습니다</p>
            <Link href="/accounting/tax-invoices/new" className="inline-block mt-2 text-sm text-indigo-600 hover:underline">+ 등록하기</Link>
          </div>
        )}
      </div>
    </div>
  )
}
