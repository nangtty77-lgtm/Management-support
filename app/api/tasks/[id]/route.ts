import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

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

  const canEditAll = ['ADMIN', 'OPS'].includes(session.user.role)
  const isOwn = task.assigneeId === session.user.id || task.creatorId === session.user.id
  if (!canEditAll && !isOwn) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

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

  const canDeleteAll = ['ADMIN', 'OPS'].includes(session.user.role)
  const isOwn = task.creatorId === session.user.id
  if (!canDeleteAll && !isOwn) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  await db.task.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
