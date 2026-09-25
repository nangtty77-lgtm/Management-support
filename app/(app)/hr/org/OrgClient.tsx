'use client'

import Link from 'next/link'

interface Employee {
  id: string; name: string; email: string; position: string; status: string; hireDate: string
}
interface Dept { id: string; name: string; employees: Employee[] }

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PROBATION: 'bg-amber-100 text-amber-700',
  LEAVE: 'bg-blue-100 text-blue-700',
}
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '재직', PROBATION: '수습', LEAVE: '휴직',
}

const DEPT_COLORS = [
  'from-indigo-500 to-indigo-600',
  'from-teal-500 to-teal-600',
  'from-violet-500 to-violet-600',
  'from-sky-500 to-sky-600',
  'from-rose-500 to-rose-600',
]

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const classes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-14 h-14 text-xl' }
  return (
    <div className={`${classes[size]} rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0`}>
      {name[0]}
    </div>
  )
}

export function OrgClient({ departments }: { departments: Dept[] }) {
  const totalEmployees = departments.reduce((s, d) => s + d.employees.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">조직도</h1>
          <p className="text-sm text-slate-400 mt-0.5">총 {departments.length}개 부서 · {totalEmployees}명</p>
        </div>
        <Link href="/employees" className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg">
          직원 목록
        </Link>
      </div>

      {/* Company box */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl px-8 py-4 text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl font-bold">B</span>
          </div>
          <p className="font-bold text-lg">BizHub</p>
          <p className="text-indigo-200 text-sm">통합 경영지원 플랫폼</p>
          <p className="text-white/80 text-xs mt-1">{totalEmployees}명</p>
        </div>
      </div>

      {/* Connector line */}
      <div className="flex justify-center">
        <div className="w-0.5 h-8 bg-slate-200" />
      </div>

      {/* Departments row */}
      <div className="grid grid-cols-3 gap-4">
        {departments.map((dept, idx) => (
          <div key={dept.id} className="space-y-3">
            {/* Dept header */}
            <div className={`bg-gradient-to-br ${DEPT_COLORS[idx % DEPT_COLORS.length]} text-white rounded-xl p-4 text-center shadow-sm`}>
              <p className="font-bold">{dept.name}</p>
              <p className="text-white/70 text-xs mt-0.5">{dept.employees.length}명</p>
            </div>

            {/* Employee cards */}
            <div className="space-y-2">
              {dept.employees.length === 0 ? (
                <div className="border-2 border-dashed border-slate-100 rounded-xl p-4 text-center text-xs text-slate-300">
                  직원 없음
                </div>
              ) : (
                dept.employees.map(emp => (
                  <Link key={emp.id} href={`/employees/${emp.id}`}
                    className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 shadow-sm p-3 hover:border-indigo-200 hover:shadow-md transition-all">
                    <Avatar name={emp.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{emp.name}</p>
                      <p className="text-xs text-slate-400 truncate">{emp.position}</p>
                    </div>
                    {STATUS_LABEL[emp.status] && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${STATUS_COLOR[emp.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {STATUS_LABEL[emp.status]}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
