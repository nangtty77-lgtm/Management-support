import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const PRIORITY_LABEL: Record<string, string> = { URGENT: '긴급', HIGH: '높음', NORMAL: '보통', LOW: '낮음' }
const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'gray' | 'teal'> = { URGENT: 'danger', HIGH: 'warning', NORMAL: 'gray', LOW: 'teal' }
const STATUS_LABEL: Record<string, string> = { PENDING: '대기', IN_PROGRESS: '진행중', REVIEW: '검토', COMPLETED: '완료', ON_HOLD: '보류' }

export default async function TasksPage() {
  const session = await auth()
  const canWrite = ['ADMIN', 'OPS'].includes(session?.user?.role ?? '') || !!session

  const tasks = await db.task.findMany({
    where: { status: { not: 'COMPLETED' } },
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">업무관리</h1>
        {canWrite && (
          <Link href="/tasks/new" className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90">
            + 업무 등록
          </Link>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['제목', '담당자', '우선순위', '상태', '마감일'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/tasks/${t.id}`} className="text-navy font-medium hover:underline">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sub">{t.assignee?.name ?? '—'}</td>
                <td className="px-4 py-3"><Badge variant={PRIORITY_BADGE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge></td>
                <td className="px-4 py-3 text-sub">{STATUS_LABEL[t.status]}</td>
                <td className="px-4 py-3 text-sub">{t.dueDate ? t.dueDate.toLocaleDateString('ko-KR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
