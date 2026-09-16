import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { isViewOnly } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const tasks = await db.task.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(priority ? { priority: priority as never } : {}),
    },
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (isViewOnly(session)) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await req.json()
  const task = await db.task.create({
    data: {
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId || null,
      creatorId: session.user.id,
      priority: body.priority ?? 'NORMAL',
      status: 'PENDING',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      contractId: body.contractId || null,
    },
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
  })

  // Notify assignee
  if (task.assigneeId && task.assigneeId !== session.user.id) {
    await db.notification.create({
      data: {
        userId: task.assigneeId,
        type: 'TASK_ASSIGNED',
        title: '업무 배정',
        message: `"${task.title}" 업무가 배정되었습니다.`,
        link: `/tasks/${task.id}`,
      },
    })
  }

  return NextResponse.json(task, { status: 201 })
}
