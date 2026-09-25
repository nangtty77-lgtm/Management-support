'use client'

import { useState, useMemo } from 'react'

interface Employee { id: string; name: string; userId: string }
interface AttendanceRecord {
  id: string; employeeId: string; employeeName: string; date: string
  checkIn: string | null; checkOut: string | null; status: string; notes: string
}

const STATUS_COLOR: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700',
  ABSENT: 'bg-red-100 text-red-700',
  LATE: 'bg-amber-100 text-amber-700',
  HALF_DAY: 'bg-blue-100 text-blue-700',
  REMOTE: 'bg-indigo-100 text-indigo-700',
  HOLIDAY: 'bg-slate-100 text-slate-500',
}
const STATUS_LABEL: Record<string, string> = {
  PRESENT: '출근', ABSENT: '결근', LATE: '지각', HALF_DAY: '반차', REMOTE: '재택', HOLIDAY: '휴일',
}

function formatTime(iso: string | null) {
  if (!iso) return '-'
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function workDuration(checkIn: string | null, checkOut: string | null) {
  if (!checkIn || !checkOut) return null
  const mins = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000
  if (mins < 0) return null
  return `${Math.floor(mins / 60)}h ${Math.floor(mins % 60)}m`
}

export function AttendanceClient({
  employees, attendances: initial, myEmployeeId, currentUserId, isAdmin, today, initialYear, initialMonth,
}: {
  employees: Employee[]; attendances: AttendanceRecord[]; myEmployeeId: string | null
  currentUserId: string; isAdmin: boolean; today: string; initialYear: number; initialMonth: number
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [records, setRecords] = useState<AttendanceRecord[]>(initial)
  const [selectedEmp, setSelectedEmp] = useState<string>(myEmployeeId ?? (employees[0]?.id ?? ''))
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ date: today.slice(0, 10), checkIn: '09:00', checkOut: '18:00', status: 'PRESENT', notes: '' })

  const todayDate = new Date(today)
  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`
  const todayRecord = records.find(r => {
    if (r.employeeId !== myEmployeeId) return false
    const rd = new Date(r.date)
    const rStr = `${rd.getUTCFullYear()}-${String(rd.getUTCMonth() + 1).padStart(2, '0')}-${String(rd.getUTCDate()).padStart(2, '0')}`
    return rStr === todayStr
  })

  async function fetchMonth(y: number, m: number) {
    const res = await fetch(`/api/attendance?year=${y}&month=${m}${selectedEmp ? `&employeeId=${selectedEmp}` : ''}`)
    if (res.ok) { const data = await res.json(); setRecords(data) }
  }

  function navMonth(delta: number) {
    let newM = month + delta, newY = year
    if (newM > 12) { newM = 1; newY++ }
    if (newM < 1) { newM = 12; newY-- }
    setMonth(newM); setYear(newY)
    fetchMonth(newY, newM)
  }

  async function saveRecord() {
    if (!form.date) return
    setSaving(true)
    try {
      const dateBase = form.date
      const body = {
        employeeId: selectedEmp,
        date: dateBase,
        checkIn: form.status !== 'ABSENT' && form.status !== 'HOLIDAY' ? `${dateBase}T${form.checkIn}:00` : null,
        checkOut: form.status !== 'ABSENT' && form.status !== 'HOLIDAY' ? `${dateBase}T${form.checkOut}:00` : null,
        status: form.status,
        notes: form.notes || null,
      }
      const res = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const created = await res.json()
        setRecords(prev => {
          const filtered = prev.filter(r => !(r.employeeId === created.employeeId && r.date.slice(0, 10) === created.date.slice(0, 10)))
          return [...filtered, created].sort((a, b) => a.date.localeCompare(b.date))
        })
        setShowForm(false)
      }
    } finally { setSaving(false) }
  }

  async function checkInNow() {
    if (!myEmployeeId) return
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const body = { employeeId: myEmployeeId, date: dateStr, checkIn: now.toISOString(), status: now.getHours() >= 9 && now.getMinutes() > 5 ? 'LATE' : 'PRESENT' }
    const res = await fetch('/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { const created = await res.json(); setRecords(prev => [...prev.filter(r => !(r.employeeId === created.employeeId && r.date.slice(0, 10) === created.date.slice(0, 10))), created]) }
  }

  async function checkOutNow() {
    if (!myEmployeeId || !todayRecord) return
    const now = new Date()
    const res = await fetch(`/api/attendance/${todayRecord.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ checkOut: now.toISOString() }) })
    if (res.ok) { const updated = await res.json(); setRecords(prev => prev.map(r => r.id === updated.id ? { ...r, checkOut: updated.checkOut } : r)) }
  }

  const empRecords = useMemo(() => records.filter(r => r.employeeId === selectedEmp), [records, selectedEmp])

  const stats = useMemo(() => {
    const present = empRecords.filter(r => r.status === 'PRESENT').length
    const late = empRecords.filter(r => r.status === 'LATE').length
    const absent = empRecords.filter(r => r.status === 'ABSENT').length
    const remote = empRecords.filter(r => r.status === 'REMOTE').length
    const workingDays = empRecords.filter(r => r.status !== 'HOLIDAY').length
    return { present, late, absent, remote, workingDays, rate: workingDays > 0 ? Math.round(((present + late + remote) / workingDays) * 100) : 0 }
  }, [empRecords])

  const daysInMonth = new Date(year, month, 0).getDate()
  const daysArr = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">근태 관리</h1>
          <p className="text-sm text-slate-400 mt-0.5">{year}년 {month}월</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => navMonth(-1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 text-sm">←</button>
            <span className="text-sm font-medium text-slate-700 w-20 text-center">{year}.{String(month).padStart(2, '0')}</span>
            <button onClick={() => navMonth(1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-500 text-sm">→</button>
          </div>
          {(isAdmin) && (
            <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
              + 기록 입력
            </button>
          )}
        </div>
      </div>

      {/* Today check-in/out for own employee */}
      {myEmployeeId && (
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs mb-1">오늘 ({todayStr})</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-indigo-200">출근</p>
                  <p className="text-lg font-bold">{formatTime(todayRecord?.checkIn ?? null)}</p>
                </div>
                <div className="text-indigo-300">→</div>
                <div>
                  <p className="text-xs text-indigo-200">퇴근</p>
                  <p className="text-lg font-bold">{formatTime(todayRecord?.checkOut ?? null)}</p>
                </div>
                {todayRecord?.checkIn && todayRecord?.checkOut && (
                  <div>
                    <p className="text-xs text-indigo-200">근무시간</p>
                    <p className="text-lg font-bold">{workDuration(todayRecord.checkIn, todayRecord.checkOut) ?? '-'}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!todayRecord?.checkIn && (
                <button onClick={checkInNow} className="bg-white text-indigo-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50">
                  출근 체크인
                </button>
              )}
              {todayRecord?.checkIn && !todayRecord?.checkOut && (
                <button onClick={checkOutNow} className="bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-800 border border-indigo-400">
                  퇴근 체크아웃
                </button>
              )}
              {todayRecord?.checkIn && todayRecord?.checkOut && (
                <span className="bg-indigo-700 text-indigo-200 text-xs px-3 py-2 rounded-lg">퇴근 완료</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">근태 기록 입력</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">직원</label>
              <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">날짜</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">상태</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {form.status !== 'ABSENT' && form.status !== 'HOLIDAY' && (
              <>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">출근 시간</label>
                  <input type="time" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">퇴근 시간</label>
                  <input type="time" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </>
            )}
            <div className="col-span-3">
              <label className="text-xs text-slate-500 mb-1 block">메모</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="선택 사항"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveRecord} disabled={saving}
              className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40">
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-slate-500 px-4 py-2">취소</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {/* Stats */}
        {[
          { label: '출근', value: stats.present, color: 'text-emerald-600' },
          { label: '지각', value: stats.late, color: 'text-amber-600' },
          { label: '결근', value: stats.absent, color: 'text-red-600' },
          { label: '출근율', value: `${stats.rate}%`, color: 'text-indigo-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs text-slate-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Employee filter (admin) + Records table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isAdmin && (
          <div className="flex items-center gap-2 p-4 border-b border-slate-50">
            <span className="text-xs text-slate-400">직원 선택:</span>
            <div className="flex flex-wrap gap-1">
              {employees.map(e => (
                <button key={e.id} onClick={() => { setSelectedEmp(e.id); fetchMonth(year, month) }}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${selectedEmp === e.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                  {e.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">날짜</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">출근</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">퇴근</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">근무시간</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">메모</th>
              </tr>
            </thead>
            <tbody>
              {daysArr.map(day => {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const rec = empRecords.find(r => {
                  const rd = new Date(r.date)
                  const rStr = `${rd.getUTCFullYear()}-${String(rd.getUTCMonth() + 1).padStart(2, '0')}-${String(rd.getUTCDate()).padStart(2, '0')}`
                  return rStr === dateStr
                })
                const d = new Date(year, month - 1, day)
                const dow = d.getDay()
                const isWeekend = dow === 0 || dow === 6
                return (
                  <tr key={day} className={`border-t border-slate-50 ${isWeekend ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                    <td className={`px-4 py-2.5 ${isWeekend ? 'text-red-400' : 'text-slate-700'}`}>
                      <span className="font-medium">{String(day).padStart(2, '0')}</span>
                      <span className="text-xs text-slate-400 ml-1">({['일','월','화','수','목','금','토'][dow]})</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {rec ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[rec.status]}`}>
                          {STATUS_LABEL[rec.status]}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">{isWeekend ? '주말' : '-'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{rec ? formatTime(rec.checkIn) : '-'}</td>
                    <td className="px-4 py-2.5 text-slate-600">{rec ? formatTime(rec.checkOut) : '-'}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{rec ? (workDuration(rec.checkIn, rec.checkOut) ?? '-') : '-'}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{rec?.notes ?? ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
