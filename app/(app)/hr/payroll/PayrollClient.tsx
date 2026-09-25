'use client'

import { useState } from 'react'

interface Employee { id: string; name: string; position: string; department: string }
interface PayrollRecord {
  id: string; employeeId: string; employeeName: string; position: string; department: string
  year: number; month: number
  baseSalary: string; bonus: string; deduction: string; netPay: string
  status: string; paidAt: string | null; notes: string
}

const STATUS_LABEL: Record<string, string> = { DRAFT: '초안', CONFIRMED: '확정', PAID: '지급완료' }
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  CONFIRMED: 'bg-amber-100 text-amber-700',
  PAID: 'bg-emerald-100 text-emerald-700',
}

function fmt(n: string | number) {
  return Number(n).toLocaleString('ko-KR') + '원'
}

export function PayrollClient({
  employees, payrolls: initial, initialYear, initialMonth, canManage,
}: {
  employees: Employee[]
  payrolls: PayrollRecord[]
  initialYear: number
  initialMonth: number
  canManage: boolean
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(initial)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ employeeId: '', baseSalary: '', bonus: '0', deduction: '0', notes: '' })
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<PayrollRecord | null>(null)

  async function loadPayrolls(y: number, m: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll?year=${y}&month=${m}`)
      const data = await res.json()
      setPayrolls(data)
    } finally { setLoading(false) }
  }

  function changeMonth(delta: number) {
    let nm = month + delta
    let ny = year
    if (nm < 1) { nm = 12; ny-- }
    if (nm > 12) { nm = 1; ny++ }
    setYear(ny); setMonth(nm)
    loadPayrolls(ny, nm)
    setSelected(null)
  }

  async function savePayroll() {
    if (!form.employeeId || !form.baseSalary) return
    setSaving(true)
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, year, month, baseSalary: Number(form.baseSalary.replace(/,/g, '')), bonus: Number(form.bonus.replace(/,/g, '')), deduction: Number(form.deduction.replace(/,/g, '')) }),
      })
      const created = await res.json()
      const emp = employees.find(e => e.id === form.employeeId)
      const record: PayrollRecord = { ...created, employeeName: emp?.name ?? '', position: emp?.position ?? '', department: emp?.department ?? '', notes: created.notes ?? '' }
      setPayrolls(prev => {
        const filtered = prev.filter(p => p.employeeId !== form.employeeId)
        return [...filtered, record].sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'ko'))
      })
      setShowForm(false)
      setForm({ employeeId: '', baseSalary: '', bonus: '0', deduction: '0', notes: '' })
    } finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: string) {
    const paidAt = status === 'PAID' ? new Date().toISOString() : null
    const res = await fetch(`/api/payroll/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, paidAt }),
    })
    const updated = await res.json()
    setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status: updated.status, paidAt: updated.paidAt } : p))
    if (selected?.id === id) setSelected(s => s ? { ...s, status: updated.status, paidAt: updated.paidAt } : null)
  }

  const totalNet = payrolls.reduce((s, p) => s + Number(p.netPay), 0)
  const paidCount = payrolls.filter(p => p.status === 'PAID').length
  const missingEmployees = employees.filter(e => !payrolls.find(p => p.employeeId === e.id))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">급여 관리</h1>
          <p className="text-sm text-slate-400 mt-0.5">{year}년 {month}월 • 총 {payrolls.length}명 • 지급완료 {paidCount}명</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => changeMonth(-1)} className="px-3 py-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 text-sm transition-colors">←</button>
            <span className="px-4 py-2 text-sm font-semibold text-slate-700 border-x border-slate-200">{year}.{String(month).padStart(2, '0')}</span>
            <button onClick={() => changeMonth(1)} className="px-3 py-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700 text-sm transition-colors">→</button>
          </div>
          {canManage && (
            <button onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              + 급여 등록
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '총 지급액', value: fmt(totalNet), color: 'text-indigo-600' },
          { label: '직원 수', value: `${payrolls.length}명`, color: 'text-slate-700' },
          { label: '지급 완료', value: `${paidCount}명`, color: 'text-emerald-600' },
          { label: '미지급', value: `${payrolls.length - paidCount}명`, color: 'text-amber-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className={`text-xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && canManage && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">{year}년 {month}월 급여 등록</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">직원</label>
              <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">직원 선택</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.department} / {e.position})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">기본급 (원)</label>
              <input type="number" value={form.baseSalary} onChange={e => setForm(f => ({ ...f, baseSalary: e.target.value }))}
                placeholder="예: 3000000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">성과급 (원)</label>
              <input type="number" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">공제 합계 (원)</label>
              <input type="number" value={form.deduction} onChange={e => setForm(f => ({ ...f, deduction: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {form.baseSalary && (
            <div className="mt-3 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-700">
              실수령액: <strong>{fmt(Number(form.baseSalary) + Number(form.bonus || 0) - Number(form.deduction || 0))}</strong>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={savePayroll} disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 hover:text-slate-700 px-4 py-2">취소</button>
          </div>
        </div>
      )}

      {/* 미등록 직원 알림 */}
      {missingEmployees.length > 0 && canManage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          <strong>급여 미등록 직원 {missingEmployees.length}명:</strong>{' '}
          {missingEmployees.map(e => e.name).join(', ')}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">불러오는 중...</div>
      ) : payrolls.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 text-sm">
          이번 달 급여 데이터가 없습니다
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100">
              <tr className="text-xs text-slate-400 font-semibold">
                <th className="text-left px-4 py-3">직원</th>
                <th className="text-left px-4 py-3">부서/직책</th>
                <th className="text-right px-4 py-3">기본급</th>
                <th className="text-right px-4 py-3">성과급</th>
                <th className="text-right px-4 py-3">공제</th>
                <th className="text-right px-4 py-3 font-bold text-slate-600">실수령액</th>
                <th className="text-center px-4 py-3">상태</th>
                {canManage && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payrolls.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{p.employeeName}</td>
                  <td className="px-4 py-3 text-slate-500">{p.department} / {p.position}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{fmt(p.baseSalary)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">+{fmt(p.bonus)}</td>
                  <td className="px-4 py-3 text-right text-red-500">-{fmt(p.deduction)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{fmt(p.netPay)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {p.status === 'DRAFT' && (
                          <button onClick={() => updateStatus(p.id, 'CONFIRMED')}
                            className="text-xs px-2 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors">
                            확정
                          </button>
                        )}
                        {p.status === 'CONFIRMED' && (
                          <button onClick={() => updateStatus(p.id, 'PAID')}
                            className="text-xs px-2 py-1 rounded border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors">
                            지급처리
                          </button>
                        )}
                        {p.status === 'PAID' && p.paidAt && (
                          <span className="text-xs text-slate-400">{new Date(p.paidAt).toLocaleDateString('ko-KR')} 지급</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr className="text-sm font-semibold">
                <td className="px-4 py-3 text-slate-700" colSpan={2}>합계 ({payrolls.length}명)</td>
                <td className="px-4 py-3 text-right text-slate-600">{fmt(payrolls.reduce((s, p) => s + Number(p.baseSalary), 0))}</td>
                <td className="px-4 py-3 text-right text-emerald-600">{fmt(payrolls.reduce((s, p) => s + Number(p.bonus), 0))}</td>
                <td className="px-4 py-3 text-right text-red-500">{fmt(payrolls.reduce((s, p) => s + Number(p.deduction), 0))}</td>
                <td className="px-4 py-3 text-right text-indigo-700">{fmt(totalNet)}</td>
                <td colSpan={canManage ? 2 : 1} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
