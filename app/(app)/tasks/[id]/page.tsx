import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import StatusChanger from '../_components/StatusChanger'

const PRIORITY_LABEL: Record<string, string> = { URGENT: '긴급', HIGH: '높음', NORMAL: '보통', LOW: '낮음' }
const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'gray' | 'teal'> = { URGENT: 'danger', HIGH: 'warning', NORMAL: 'gray', LOW: 'teal' }
const STATUS_LABEL: Record<string, string> = { PENDING: '대기', IN_PROGRESS: '진행중', REVIEW: '검토', COMPLETED: '완료', ON_HOLD: '보류' }

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params
  const task = await db.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { name: true, email: true } },
      creator: { select: { name: true } },
      contract: { select: { name: true, id: true } },
    },
  })
  if (!task) notFound()

  const canEdit = ['ADMIN', 'OPS'].includes(session?.user?.role ?? '')
    || task.assigneeId === session?.user?.id
    || task.creatorId === session?.user?.id

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{task.title}</h1>
          {task.description && <p className="text-sub mt-1 text-sm">{task.description}</p>}
        </div>
        <Badge variant={PRIORITY_BADGE[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-sub">담당자</span><p className="font-medium">{task.assignee?.name ?? '—'}</p></div>
        <div><span className="text-sub">등록자</span><p className="font-medium">{task.creator.name}</p></div>
        <div><span className="text-sub">마감일</span><p className="font-medium">{task.dueDate ? task.dueDate.toLocaleDateString('ko-KR') : '—'}</p></div>
        <div><span className="text-sub">관련 계약</span><p className="font-medium">{task.contract?.name ?? '—'}</p></div>
        <div>
          <span className="text-sub">현재 상태</span>
          <p className="font-medium mt-1">{STATUS_LABEL[task.status]}</p>
        </div>
      </div>

      {canEdit && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-navy mb-3">상태 변경</h2>
          <StatusChanger taskId={task.id} currentStatus={task.status} />
        </div>
      )}
    </div>
  )
}
