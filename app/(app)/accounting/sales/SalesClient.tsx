'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Sale {
  id: string
  vendorId: string
  vendor: { name: string }
  title: string
  amount: string
  taxAmount: string
  totalAmount: string
  paidAmount: string
  saleDate: string
  dueDate: string | null
  paidDate: string | null
  status: string
  notes: string | null
  assigneeId: string | null
}

const STATUS_LABEL: Record<string, string> = {
  UNPAID: '미수금', PARTIAL: '부분입금', PAID: '입금완료', OVERDUE: '연체',
}
const STATUS_COLOR: Record<string, string> = {
  UNPAID: 'bg-red-50 text-red-700',
  PARTIAL: 'bg-amber-50 text-amber-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  OVERDUE: 'bg-red-100 text-red-800',
}

function exportCSV(data: Sale[]) {
  const header = ['매출명', '거래처', '공급가액', '세액', '합계', '입금액', '미수금', '매출일', '입금예정일', '상태']
  const rows = data.map((s) => [
    s.title, s.vendor.name,
    Number(s.amount), Number(s.taxAmount), Number(s.totalAmount),
    Number(s.paidAmount), Number(s.totalAmount) - Number(s.paidAmount),
    s.saleDate.slice(0, 10),
    s.dueDate?.slice(0, 10) ?? '',
    STATUS_LABEL[s.status] ?? s.status,
  ])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `매출내역_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function SalesClient({ sales }: { sales: Sale[] }) {
  const now = new Date()
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()))
  const [monthFilter, setMonthFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const years = [...new Set(sales.map((s) => s.saleDate.slice(0, 4)))].sort().reverse()

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (yearFilter && !s.saleDate.startsWith(yearFilter)) return false
      if (monthFilter && s.saleDate.slice(5, 7) !== monthFilter.padStart(2, '0')) return false
      if (statusFilter && s.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!s.title.toLowerCase().includes(q) && !s.vendor.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [sales, search, yearFilter, monthFilter, statusFilter])

  const totalSales = filtered.reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const totalPaid = filtered.filter((s) => s.status === 'PAID').reduce((sum, s) => sum + Number(s.totalAmount), 0)
  const totalUnpaid = filtered
    .filter((s) => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(s.status))
    .reduce((sum, s) => sum + Number(s.totalAmount) - Number(s.paidAmount), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">매출 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length}건 · 합계 {totalSales.toLocaleString('ko-KR')}원
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(filtered)}
            className="border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            CSV 내보내기
          </button>
          <Link href="/accounting/sales/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            매출 등록
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '총 매출', value: totalSales, color: 'text-indigo-600' },
          { label: '입금완료', value: totalPaid, color: 'text-emerald-600' },
          { label: '미수금', value: totalUnpaid, color: 'text-red-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className={`text-lg font-bold ${c.color}`}>{c.value.toLocaleString('ko-KR')}원</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="매출명, 거래처 검색..." />
        </div>
        <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">전체 연도</option>
          {years.map((y) => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">전체 월</option>
          {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={String(i+1)}>{i+1}월</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(search || monthFilter || statusFilter) && (
          <button onClick={() => { setSearch(''); setMonthFilter(''); setStatusFilter('') }}
            className="text-sm text-slate-400 hover:text-slate-600">초기화</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['매출명', '거래처', '공급가액', '세액', '합계', '매출일', '입금예정일', '상태'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/accounting/sales/${s.id}`} className="font-medium text-slate-800 hover:text-indigo-600 hover:underline">{s.title}</Link>
                </td>
                <td className="px-5 py-3 text-slate-500">{s.vendor.name}</td>
                <td className="px-5 py-3 text-slate-500">{Number(s.amount).toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-3 text-slate-500">{Number(s.taxAmount).toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-3 font-semibold text-slate-800">{Number(s.totalAmount).toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-3 text-slate-500">{s.saleDate.slice(0, 10)}</td>
                <td className="px-5 py-3 text-slate-500">{s.dueDate?.slice(0, 10) ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-slate-400">조건에 맞는 매출이 없습니다</p>
            <Link href="/accounting/sales/new" className="inline-block mt-3 text-sm text-indigo-600 hover:underline">+ 첫 매출 등록하기</Link>
          </div>
        )}
      </div>
    </div>
  )
}
