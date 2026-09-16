import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const STATUS_LABEL: Record<string, string> = { ACTIVE: '유효', EXPIRED: '만료', TERMINATED: '해지', DRAFT: '초안' }
const STATUS_BADGE: Record<string, 'teal' | 'danger' | 'gray' | 'warning'> = {
  ACTIVE: 'teal', EXPIRED: 'danger', TERMINATED: 'gray', DRAFT: 'warning',
}

export default async function ContractsPage() {
  const session = await auth()
  const canWrite = ['ADMIN', 'GENERAL'].includes(session?.user?.role ?? '')

  const contracts = await db.contract.findMany({
    include: { owner: { select: { name: true } } },
    orderBy: { endDate: 'asc' },
  })
  const now = new Date()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">계약관리</h1>
        {canWrite && (
          <Link href="/contracts/new" className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90">
            + 계약 등록
          </Link>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['계약명', '거래처', '금액', '만료일', '담당자', '상태'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {contracts.map((c) => {
              const daysLeft = Math.ceil((c.endDate.getTime() - now.getTime()) / 86400000)
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/contracts/${c.id}`} className="text-navy font-medium hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sub">{c.vendorName}</td>
                  <td className="px-4 py-3 text-sub">{Number(c.amount).toLocaleString('ko-KR')}원</td>
                  <td className="px-4 py-3 text-sub">
                    {c.endDate.toLocaleDateString('ko-KR')}
                    {c.status === 'ACTIVE' && daysLeft <= 90 && (
                      <span className={`ml-2 text-xs ${daysLeft <= 30 ? 'text-danger' : 'text-warning'}`}>
                        D-{daysLeft}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sub">{c.owner.name}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</Badge></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
