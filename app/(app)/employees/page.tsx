import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '재직', PROBATION: '수습', LEAVE: '휴직', RESIGNED: '퇴직',
}
const STATUS_BADGE: Record<string, 'teal' | 'warning' | 'gray' | 'danger'> = {
  ACTIVE: 'teal', PROBATION: 'warning', LEAVE: 'gray', RESIGNED: 'danger',
}

export default async function EmployeesPage() {
  const session = await auth()
  const canWrite = ['ADMIN', 'HR'].includes(session?.user?.role ?? '')
  const employees = await db.employee.findMany({
    include: {
      user: { select: { name: true, email: true } },
      department: { select: { name: true } },
    },
    orderBy: { hireDate: 'desc' },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">직원관리</h1>
        {canWrite && (
          <Link href="/employees/new" className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90">
            + 직원 등록
          </Link>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['이름', '이메일', '부서', '직급', '입사일', '상태', '연차'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/employees/${e.id}`} className="text-navy font-medium hover:underline">
                    {e.user.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sub">{e.user.email}</td>
                <td className="px-4 py-3 text-sub">{e.department.name}</td>
                <td className="px-4 py-3 text-sub">{e.position}</td>
                <td className="px-4 py-3 text-sub">{e.hireDate.toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-sub">{e.usedLeave}/{e.annualLeave}일</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
