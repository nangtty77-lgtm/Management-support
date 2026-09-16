import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

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

const SALE_STATUS_LABEL: Record<string, string> = {
  UNPAID: '미수금',
  PARTIAL: '일부수령',
  PAID: '수금완료',
  OVERDUE: '연체',
}
const SALE_STATUS_BADGE: Record<string, 'warning' | 'teal' | 'danger' | 'gray'> = {
  UNPAID: 'warning',
  PARTIAL: 'teal',
  PAID: 'teal',
  OVERDUE: 'danger',
}

const PURCHASE_STATUS_LABEL: Record<string, string> = {
  UNPAID: '미지급',
  PARTIAL: '일부지급',
  PAID: '지급완료',
  OVERDUE: '연체',
}

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return null
  const { id } = await params
  const vendor = await db.vendor.findUnique({
    where: { id },
    include: {
      sales: { orderBy: { saleDate: 'desc' }, take: 10 },
      purchases: { orderBy: { purchaseDate: 'desc' }, take: 10 },
    },
  })
  if (!vendor) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{vendor.name}</h1>
          <div className="mt-1">
            <Badge variant={TYPE_BADGE[vendor.type]}>{TYPE_LABEL[vendor.type]}</Badge>
          </div>
        </div>
        <Link
          href={`/accounting/vendors/${vendor.id}/edit`}
          className="bg-white border border-gray-200 text-navy px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          수정
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-sub">거래처명</span>
          <p className="font-medium">{vendor.name}</p>
        </div>
        <div>
          <span className="text-sub">사업자번호</span>
          <p className="font-medium">{vendor.bizNo ?? '—'}</p>
        </div>
        <div>
          <span className="text-sub">대표자</span>
          <p className="font-medium">{vendor.ceoName ?? '—'}</p>
        </div>
        <div>
          <span className="text-sub">전화번호</span>
          <p className="font-medium">{vendor.phone ?? '—'}</p>
        </div>
        <div>
          <span className="text-sub">이메일</span>
          <p className="font-medium">{vendor.email ?? '—'}</p>
        </div>
        <div>
          <span className="text-sub">주소</span>
          <p className="font-medium">{vendor.address ?? '—'}</p>
        </div>
      </div>

      {vendor.sales.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-navy">최근 매출</h2>
            <Link href="/accounting/sales" className="text-teal text-sm hover:underline">
              전체보기
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['매출명', '매출일', '금액', '상태'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-sub font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendor.sales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{s.title}</td>
                  <td className="px-3 py-2 text-sub">
                    {s.saleDate.toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-3 py-2 text-sub">
                    {Number(s.totalAmount).toLocaleString('ko-KR')}원
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant={SALE_STATUS_BADGE[s.status] ?? 'gray'}>
                      {SALE_STATUS_LABEL[s.status] ?? s.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vendor.purchases.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-navy">최근 매입</h2>
            <Link href="/accounting/purchases" className="text-teal text-sm hover:underline">
              전체보기
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['매입명', '매입일', '금액', '상태'].map((h) => (
                  <th key={h} className="text-left px-3 py-2 text-sub font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {vendor.purchases.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{p.title}</td>
                  <td className="px-3 py-2 text-sub">
                    {p.purchaseDate.toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-3 py-2 text-sub">
                    {Number(p.totalAmount).toLocaleString('ko-KR')}원
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="gray">
                      {PURCHASE_STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
