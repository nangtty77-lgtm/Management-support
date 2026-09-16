import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canManageAllTasks, canManageOwnTask } from '@/lib/permissions'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params
  const task = await db.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { name: true, email: true } },
      creator: { select: { name: true } },
      contract: { select: { name: true } },
    },
  })
  if (!task) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json(task)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params
  const task = await db.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: '없음' }, { status: 404 })

  const canEdit = canManageAllTasks(session) || canManageOwnTask(session, task)
  if (!canEdit) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await req.json()
  const updated = await db.task.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId,
      priority: body.priority,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      completedAt: body.status === 'COMPLETED' ? new Date() : body.status ? null : undefined,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await params
  const task = await db.task.findUnique({ where: { id } })
  if (!task) return NextResponse.json({ error: '없음' }, { status: 404 })

  const canDelete = canManageAllTasks(session) || canManageOwnTask(session, { assigneeId: null, creatorId: task.creatorId })
  if (!canDelete) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  await db.task.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
