import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const TYPE_LABEL: Record<string, string> = {
  CUSTOMER: '고객사',
  SUPPLIER: '매입처',
  BOTH: '고객/매입처',
}
const TYPE_BADGE: Record<string, 'teal' | 'navy' | 'gray'> = {
  CUSTOMER: 'teal',
  SUPPLIER: 'navy',
  BOTH: 'gray',
}

export default async function VendorsPage() {
  const session = await auth()
  if (!session) return null
  const vendors = await db.vendor.findMany({ orderBy: { name: 'asc' } })
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">거래처 관리</h1>
        <Link
          href="/accounting/vendors/new"
          className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90"
        >
          + 거래처 등록
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['거래처명', '사업자번호', '대표자', '연락처', '유형'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/accounting/vendors/${v.id}`}
                    className="text-navy font-medium hover:underline"
                  >
                    {v.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sub">{v.bizNo ?? '—'}</td>
                <td className="px-4 py-3 text-sub">{v.ceoName ?? '—'}</td>
                <td className="px-4 py-3 text-sub">{v.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={TYPE_BADGE[v.type]}>{TYPE_LABEL[v.type]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {vendors.length === 0 && (
          <p className="text-center text-sub py-12">등록된 거래처가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
