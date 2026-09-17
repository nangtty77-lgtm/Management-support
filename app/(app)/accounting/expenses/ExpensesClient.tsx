'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Expense {
  id: string
  type: string
  title: string
  amount: string
  expenseDate: string
  paidBy: { name: string }
  status: string
  notes: string | null
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: '대기', APPROVED: '승인', REJECTED: '반려', PAID: '지급완료',
}
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  PAID: 'bg-slate-100 text-slate-600',
}
const TYPE_LABEL: Record<string, string> = {
  CORPORATE_CARD: '법인카드', PERSONAL: '개인경비', TRAVEL: '출장비',
  ENTERTAINMENT: '접대비', VEHICLE: '차량비', SUPPLIES: '소모품비', OTHER: '기타',
}

function exportCSV(data: Expense[]) {
  const header = ['비용명', '유형', '금액', '비용일', '신청자', '상태']
  const rows = data.map((e) => [
    e.title, TYPE_LABEL[e.type] ?? e.type, Number(e.amount),
    e.expenseDate.slice(0, 10), e.paidBy.name, STATUS_LABEL[e.status] ?? e.status,
  ])
  const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `비용내역_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ExpensesClient({ expenses }: { expenses: Expense[] }) {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()))
  const [monthFilter, setMonthFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const years = [...new Set(expenses.map((e) => e.expenseDate.slice(0, 4)))].sort().reverse()

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (yearFilter && !e.expenseDate.startsWith(yearFilter)) return false
      if (monthFilter && e.expenseDate.slice(5, 7) !== monthFilter.padStart(2, '0')) return false
      if (statusFilter && e.status !== statusFilter) return false
      if (typeFilter && e.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!e.title.toLowerCase().includes(q) && !e.paidBy.name.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [expenses, search, yearFilter, monthFilter, statusFilter, typeFilter])

  const thisMonth = expenses.filter((e) => e.expenseDate >= thisMonthStart)
  const totalThisMonth = thisMonth.reduce((sum, e) => sum + Number(e.amount), 0)
  const pendingCount = expenses.filter((e) => e.status === 'PENDING').length
  const filteredTotal = filtered.reduce((sum, e) => sum + Number(e.amount), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">비용 관리</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length}건 · {filteredTotal.toLocaleString('ko-KR')}원</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportCSV(filtered)}
            className="border border-slate-200 text-slate-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            CSV 내보내기
          </button>
          <Link href="/accounting/expenses/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            비용 신청
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '이번달 총 비용', value: totalThisMonth.toLocaleString('ko-KR') + '원', color: 'text-slate-800' },
          { label: '승인 대기', value: pendingCount + '건', color: 'text-amber-600' },
          { label: '조회 기간 합계', value: filteredTotal.toLocaleString('ko-KR') + '원', color: 'text-indigo-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="비용명, 신청자 검색..." />
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
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">전체 유형</option>
          {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(search || monthFilter || statusFilter || typeFilter) && (
          <button onClick={() => { setSearch(''); setMonthFilter(''); setStatusFilter(''); setTypeFilter('') }}
            className="text-sm text-slate-400 hover:text-slate-600">초기화</button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['비용명', '유형', '금액', '비용일', '신청자', '상태'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-slate-500 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <Link href={`/accounting/expenses/${e.id}`} className="font-medium text-slate-800 hover:text-indigo-600 hover:underline">{e.title}</Link>
                </td>
                <td className="px-5 py-3 text-slate-500">{TYPE_LABEL[e.type] ?? e.type}</td>
                <td className="px-5 py-3 font-medium text-slate-800">{Number(e.amount).toLocaleString('ko-KR')}원</td>
                <td className="px-5 py-3 text-slate-500">{e.expenseDate.slice(0, 10)}</td>
                <td className="px-5 py-3 text-slate-500">{e.paidBy.name}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[e.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-slate-400">조건에 맞는 비용이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}
