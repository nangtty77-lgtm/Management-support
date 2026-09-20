'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface BudgetItem {
  id: string
  category: string
  title: string
  month: number | null
  amount: string
  usedAmount: string
}

interface SaleRow { saleDate: string; totalAmount: string }
interface PurchaseRow { purchaseDate: string; totalAmount: string }
interface ExpenseRow { expenseDate: string; amount: string; type: string }

const CAT_LABEL: Record<string, string> = {
  SALES: '영업·마케팅',
  MARKETING: '마케팅',
  LABOR: '인건비',
  OFFICE: '사무비',
  TRAVEL: '출장·교통비',
  IT: 'IT비용',
  FACILITY: '시설비',
  OTHER: '기타',
}

const CAT_BAR: Record<string, string> = {
  SALES: 'bg-indigo-500',
  MARKETING: 'bg-purple-500',
  LABOR: 'bg-blue-500',
  OFFICE: 'bg-teal-500',
  TRAVEL: 'bg-orange-500',
  IT: 'bg-cyan-500',
  FACILITY: 'bg-slate-400',
  OTHER: 'bg-gray-400',
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function ratePct(used: number, budget: number) {
  if (budget === 0) return 0
  return Math.min(Math.round((used / budget) * 100), 100)
}

function barColor(pct: number) {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-400'
  return 'bg-emerald-500'
}

export function BudgetReportClient({
  year,
  budgets,
  sales,
  purchases,
  expenses,
}: {
  year: number
  budgets: BudgetItem[]
  sales: SaleRow[]
  purchases: PurchaseRow[]
  expenses: ExpenseRow[]
}) {
  const router = useRouter()
  const thisYear = new Date().getFullYear()
  const years = [thisYear - 1, thisYear, thisYear + 1]

  // 카테고리별 예산 집계 (월 구분 없이 연간 합산)
  const byCategory = useMemo(() => {
    const map: Record<string, { budget: number; used: number }> = {}
    for (const b of budgets) {
      if (!map[b.category]) map[b.category] = { budget: 0, used: 0 }
      map[b.category].budget += Number(b.amount)
      map[b.category].used += Number(b.usedAmount)
    }
    return map
  }, [budgets])

  const totalBudget = Object.values(byCategory).reduce((s, v) => s + v.budget, 0)
  const totalUsed = Object.values(byCategory).reduce((s, v) => s + v.used, 0)

  // 월별 실제 매출/비용 집계
  const monthly = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const rev = sales
        .filter((s) => new Date(s.saleDate).getMonth() + 1 === m)
        .reduce((sum, s) => sum + Number(s.totalAmount), 0)
      const cost =
        purchases
          .filter((p) => new Date(p.purchaseDate).getMonth() + 1 === m)
          .reduce((sum, p) => sum + Number(p.totalAmount), 0) +
        expenses
          .filter((e) => new Date(e.expenseDate).getMonth() + 1 === m)
          .reduce((sum, e) => sum + Number(e.amount), 0)
      return { month: MONTHS[i], rev, cost }
    })
  }, [sales, purchases, expenses])

  const maxMonthly = Math.max(...monthly.map((m) => Math.max(m.rev, m.cost)), 1)

  const totalActualRev = monthly.reduce((s, m) => s + m.rev, 0)
  const totalActualCost = monthly.reduce((s, m) => s + m.cost, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">예산 vs 실적</h1>
          <p className="text-sm text-slate-500 mt-0.5">{year}년 예산 집행 현황</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => router.push(`/accounting/budget-report?year=${y}`)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                y === year ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {y}년
            </button>
          ))}
        </div>
      </div>

      {/* KPI 카드 4개 */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '총 예산', value: totalBudget, color: 'text-slate-800', sub: '' },
          { label: '집행 금액', value: totalUsed, color: 'text-indigo-600', sub: `집행률 ${ratePct(totalUsed, totalBudget)}%` },
          { label: '잔여 예산', value: totalBudget - totalUsed, color: totalBudget - totalUsed >= 0 ? 'text-emerald-600' : 'text-red-600', sub: '' },
          { label: '실제 매출', value: totalActualRev, color: 'text-indigo-600', sub: `실제 비용 ${totalActualCost.toLocaleString('ko-KR')}원` },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-500 mb-1">{c.label}</p>
            <p className={`text-lg font-bold ${c.color}`}>{c.value.toLocaleString('ko-KR')}원</p>
            {c.sub && <p className="text-xs text-slate-400 mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* 메인 2열 */}
      <div className="grid grid-cols-5 gap-5">
        {/* 카테고리별 예산 테이블 (3/5) */}
        <div className="col-span-3 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">카테고리별 예산 집행</h2>
          </div>
          {Object.keys(CAT_LABEL).length === 0 || Object.keys(byCategory).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-slate-400">{year}년 예산 데이터가 없습니다</p>
              <a href="/budget" className="inline-block mt-2 text-sm text-indigo-600 hover:underline">예산 등록하기 →</a>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {Object.entries(CAT_LABEL).map(([cat, label]) => {
                const data = byCategory[cat]
                if (!data) return null
                const pct = ratePct(data.used, data.budget)
                return (
                  <div key={cat} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${CAT_BAR[cat]}`} />
                        <span className="text-sm font-medium text-slate-700">{label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-400">예산 {data.budget.toLocaleString('ko-KR')}원</span>
                        <span className="font-semibold text-slate-800">집행 {data.used.toLocaleString('ko-KR')}원</span>
                        <span className={`w-12 text-right font-bold text-xs ${pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 월별 비교 차트 (2/5) */}
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-1">월별 매출 vs 비용</h2>
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-indigo-400 inline-block" />매출</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-3 rounded-sm bg-rose-400 inline-block" />비용</span>
          </div>
          <div className="space-y-1.5">
            {monthly.map((m) => (
              <div key={m.month} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 w-8 shrink-0">{m.month}</span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${(m.rev / maxMonthly) * 100}%` }}
                    />
                  </div>
                  <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${(m.cost / maxMonthly) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-400 w-6 shrink-0 text-right">
                  {m.rev > 0 || m.cost > 0 ? '' : '—'}
                </span>
              </div>
            ))}
          </div>
          {totalActualRev === 0 && totalActualCost === 0 && (
            <p className="text-center text-xs text-slate-400 mt-4">{year}년 거래 데이터 없음</p>
          )}
        </div>
      </div>

      {/* 연간 손익 요약 */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-800 mb-4">연간 손익 요약</h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: '연간 매출', value: totalActualRev, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: '연간 총비용', value: totalActualCost, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: '영업이익', value: totalActualRev - totalActualCost, color: totalActualRev - totalActualCost >= 0 ? 'text-emerald-600' : 'text-red-600', bg: totalActualRev - totalActualCost >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
          ].map((item) => (
            <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>
                {item.value >= 0 ? '' : '-'}{Math.abs(item.value).toLocaleString('ko-KR')}원
              </p>
              {item.label === '영업이익' && totalActualRev > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  이익률 {Math.round(((totalActualRev - totalActualCost) / totalActualRev) * 100)}%
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
