import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = { ACTIVE: '유효', EXPIRED: '만료', TERMINATED: '해지', DRAFT: '초안' }
const STATUS_BADGE: Record<string, 'teal' | 'danger' | 'gray' | 'warning'> = {
  ACTIVE: 'teal', EXPIRED: 'danger', TERMINATED: 'gray', DRAFT: 'warning',
}

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      tasks: { include: { assignee: { select: { name: true } } }, take: 10 },
      alerts: { orderBy: { alertDays: 'desc' } },
    },
  })
  if (!contract) notFound()

  const canWrite = ['ADMIN', 'GENERAL'].includes(session?.user?.role ?? '')

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-navy">{contract.name}</h1>
        <Badge variant={STATUS_BADGE[contract.status]}>{STATUS_LABEL[contract.status]}</Badge>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-sub">거래처</span><p className="font-medium">{contract.vendorName}</p></div>
        <div><span className="text-sub">계약금액</span><p className="font-medium">{Number(contract.amount).toLocaleString('ko-KR')}원</p></div>
        <div><span className="text-sub">계약기간</span><p className="font-medium">{contract.startDate.toLocaleDateString('ko-KR')} ~ {contract.endDate.toLocaleDateString('ko-KR')}</p></div>
        <div><span className="text-sub">담당자</span><p className="font-medium">{contract.owner.name}</p></div>
        <div><span className="text-sub">자동갱신</span><p className="font-medium">{contract.autoRenewal ? '예' : '아니오'}</p></div>
        {contract.fileUrl && (
          <div><span className="text-sub">계약서</span>
            <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline text-sm">
              파일 보기
            </a>
          </div>
        )}
      </div>

      {contract.notes && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-navy mb-2">비고</h2>
          <p className="text-sm text-sub whitespace-pre-line">{contract.notes}</p>
        </div>
      )}

      {contract.tasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-navy mb-3">관련 업무</h2>
          <ul className="divide-y text-sm">
            {contract.tasks.map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between">
                <Link href={`/tasks/${t.id}`} className="text-navy hover:underline">{t.title}</Link>
                <span className="text-sub">{t.assignee?.name ?? '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
