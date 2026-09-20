'use client'

import { useState } from 'react'

interface KpiData {
  today: {
    sales: string; salesCount: number
    ydSales: string
    expenses: string; expCount: number
    ydExpenses: string
    taskDueToday: number; taskOverdue: number
  }
  month: {
    sales: string; salesCount: number
    lmSales: string
    expenses: string; expCount: number
    lmExpenses: string
    purchase: string
    taskTotal: number; taskCompleted: number; taskInProgress: number
  }
  year: {
    sales: string; salesCount: number
    lySales: string
    expenses: string
    purchase: string
    budget: string
    issuedTax: string; receivedTax: string
  }
  contractsExpiringSoon: number
  dailyTrend: { label: string; sales: string }[]
  monthlyTrend: { label: string; sales: string; purchase: string }[]
  currentMonth: number
  currentYear: number
}

type Period = 'day' | 'month' | 'year'

function fmt(v: string | number) {
  const n = Number(v)
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)}억`
  if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString('ko-KR')}만`
  return n.toLocaleString('ko-KR')
}
function fmtFull(v: string | number) {
  return Number(v).toLocaleString('ko-KR') + '원'
}
function delta(curr: string | number, prev: string | number) {
  const c = Number(curr), p = Number(prev)
  if (p === 0) return null
  return Math.round(((c - p) / p) * 100)
}
function DeltaBadge({ pct, inverse = false }: { pct: number | null; inverse?: boolean }) {
  if (pct === null) return null
  const up = pct >= 0
  const good = inverse ? !up : up
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${good ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  )
}

function KpiCard({
  label, value, sub, delta: d, inverse, suffix, accent,
}: {
  label: string; value: string; sub?: string; delta?: number | null
  inverse?: boolean; suffix?: string; accent?: string
}) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 ${accent ?? 'border-slate-100'}`}>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold mb-1 ${accent ? 'text-indigo-700' : 'text-slate-900'}`}>
        {value}<span className="text-base font-normal text-slate-500 ml-0.5">{suffix}</span>
      </p>
      <div className="flex items-center gap-2">
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
        {d !== undefined && <DeltaBadge pct={d} inverse={inverse} />}
      </div>
    </div>
  )
}

function MiniBarChart({ data, keys, colors, maxH = 80 }: {
  data: { label: string; [k: string]: string }[]
  keys: string[]; colors: string[]; maxH?: number
}) {
  const max = Math.max(...data.flatMap(d => keys.map(k => Number(d[k] ?? 0))), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: `${maxH}px` }}>
            {keys.map((k, ki) => {
              const h = Math.max(2, Math.round((Number(d[k] ?? 0) / max) * maxH))
              return (
                <div
                  key={k}
                  style={{ height: `${h}px`, backgroundColor: colors[ki], flex: 1 }}
                  className="rounded-t-sm min-w-[4px]"
                  title={`${d.label}: ${fmtFull(d[k] ?? 0)}`}
                />
              )
            })}
          </div>
          <span className="text-[9px] text-slate-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function TaskDonut({ total, completed, inProgress }: { total: number; completed: number; inProgress: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  const r = 28, c = 2 * Math.PI * r
  const dash = (c * pct) / 100
  return (
    <div className="flex items-center gap-4">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="36" cy="36" r={r} fill="none" stroke="#4f46e5" strokeWidth="8"
          strokeDasharray={`${dash} ${c}`} strokeDashoffset={c / 4} strokeLinecap="round" />
        <text x="36" y="40" textAnchor="middle" className="text-xs font-bold" fill="#1e293b" fontSize="14" fontWeight="700">{pct}%</text>
      </svg>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /><span className="text-slate-600">완료 {completed}건</span></div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /><span className="text-slate-600">진행 {inProgress}건</span></div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /><span className="text-slate-600">전체 {total}건</span></div>
      </div>
    </div>
  )
}

export function KpiClient({ kpi }: { kpi: KpiData }) {
  const [period, setPeriod] = useState<Period>('month')
  const { today, month, year } = kpi

  const tabs: { key: Period; label: string }[] = [
    { key: 'day', label: '일간' },
    { key: 'month', label: '월간' },
    { key: 'year', label: '연간' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KPI 대시보드</h1>
          <p className="text-sm text-slate-400 mt-0.5">{kpi.currentYear}년 {kpi.currentMonth}월 경영 현황</p>
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setPeriod(t.key)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${period === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 알림 배너 */}
      {(kpi.contractsExpiringSoon > 0 || today.taskOverdue > 0) && (
        <div className="flex flex-wrap gap-2">
          {kpi.contractsExpiringSoon > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <span>⚠</span> 계약 만료 임박 {kpi.contractsExpiringSoon}건 (30일 이내)
            </div>
          )}
          {today.taskOverdue > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-3 py-1.5 rounded-full">
              <span>!</span> 기한 초과 업무 {today.taskOverdue}건
            </div>
          )}
        </div>
      )}

      {/* 일간 */}
      {period === 'day' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label="오늘 매출" value={fmt(today.sales)} suffix="원"
              sub={`전일 ${fmt(today.ydSales)}원`}
              delta={delta(today.sales, today.ydSales)}
            />
            <KpiCard
              label="오늘 비용" value={fmt(today.expenses)} suffix="원"
              sub={`전일 ${fmt(today.ydExpenses)}원`}
              delta={delta(today.expenses, today.ydExpenses)} inverse
            />
            <KpiCard label="오늘 마감 업무" value={String(today.taskDueToday)} suffix="건"
              sub="미완료 기준"
            />
            <KpiCard label="기한 초과 업무" value={String(today.taskOverdue)} suffix="건"
              sub="누적" accent={today.taskOverdue > 0 ? 'border-red-200' : undefined}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">최근 7일 매출 추이</p>
              <MiniBarChart
                data={kpi.dailyTrend}
                keys={['sales']}
                colors={['#6366f1']}
              />
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">업무 현황</p>
              <TaskDonut total={month.taskTotal} completed={month.taskCompleted} inProgress={month.taskInProgress} />
            </div>
          </div>
        </>
      )}

      {/* 월간 */}
      {period === 'month' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label={`${kpi.currentMonth}월 매출`} value={fmt(month.sales)} suffix="원"
              sub={`전월 ${fmt(month.lmSales)}원`}
              delta={delta(month.sales, month.lmSales)}
            />
            <KpiCard
              label={`${kpi.currentMonth}월 매입`} value={fmt(month.purchase)} suffix="원"
              sub={`${month.salesCount}건 계약`}
            />
            <KpiCard
              label={`${kpi.currentMonth}월 비용`} value={fmt(month.expenses)} suffix="원"
              sub={`전월 ${fmt(month.lmExpenses)}원`}
              delta={delta(month.expenses, month.lmExpenses)} inverse
            />
            <KpiCard
              label="월 순이익 추정"
              value={fmt(Math.max(0, Number(month.sales) - Number(month.purchase) - Number(month.expenses)))}
              suffix="원"
              accent="border-indigo-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-slate-700 mb-1">월간 업무 완료율</p>
              <p className="text-xs text-slate-400 mb-3">전체 누적 기준</p>
              <TaskDonut total={month.taskTotal} completed={month.taskCompleted} inProgress={month.taskInProgress} />
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">월별 매출/매입 추이</p>
              <MiniBarChart
                data={kpi.monthlyTrend}
                keys={['sales', 'purchase']}
                colors={['#6366f1', '#a78bfa']}
              />
              <div className="flex gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" />매출</span>
                <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 rounded-sm bg-violet-400 inline-block" />매입</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 연간 */}
      {period === 'year' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label={`${kpi.currentYear}년 매출`} value={fmt(year.sales)} suffix="원"
              sub={`전년 ${fmt(year.lySales)}원`}
              delta={delta(year.sales, year.lySales)}
            />
            <KpiCard
              label="연간 예산" value={fmt(year.budget)} suffix="원"
              sub={year.budget !== '0' ? `집행률 ${Math.round((Number(year.sales) / Number(year.budget)) * 100)}%` : '예산 미설정'}
            />
            <KpiCard
              label="매출세액 (발행)" value={fmt(year.issuedTax)} suffix="원"
              sub={`${kpi.currentYear}년 누적`}
            />
            <KpiCard
              label="납부 예상 세액"
              value={fmt(Math.max(0, Number(year.issuedTax) - Number(year.receivedTax)))}
              suffix="원"
              sub={`매입세액 공제 후`}
              accent="border-amber-200"
            />
          </div>

          {/* 연간 P&L */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-slate-700 mb-4">{kpi.currentYear}년 손익 요약</p>
            <div className="grid grid-cols-5 gap-4 text-center">
              {[
                { label: '연간 매출', value: year.sales, color: 'text-indigo-700', bg: 'bg-indigo-50' },
                { label: '―', value: '', color: 'text-slate-300', bg: '' },
                { label: '매입 + 비용', value: String(Number(year.purchase) + Number(year.expenses)), color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: '=', value: '', color: 'text-slate-300', bg: '' },
                {
                  label: '영업이익 추정',
                  value: String(Math.max(0, Number(year.sales) - Number(year.purchase) - Number(year.expenses))),
                  color: 'text-emerald-700', bg: 'bg-emerald-50'
                },
              ].map((item, i) => item.value === '' ? (
                <div key={i} className="flex items-center justify-center text-2xl font-light text-slate-300">{item.label}</div>
              ) : (
                <div key={i} className={`${item.bg} rounded-xl p-3`}>
                  <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>{fmt(item.value)}원</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">월별 매출 추이 ({kpi.currentYear}년)</p>
            <MiniBarChart
              data={kpi.monthlyTrend}
              keys={['sales', 'purchase']}
              colors={['#6366f1', '#a78bfa']}
              maxH={100}
            />
            <div className="flex gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" />매출</span>
              <span className="flex items-center gap-1 text-xs text-slate-400"><span className="w-2 h-2 rounded-sm bg-violet-400 inline-block" />매입</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
