import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const notice = await db.notice.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true } }, _count: { select: { reads: true } } },
  })
  if (!notice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Mark as read
  await db.noticeRead.upsert({
    where: { noticeId_userId: { noticeId: id, userId: session.user.id } },
    create: { noticeId: id, userId: session.user.id },
    update: {},
  })

  return NextResponse.json({
    ...notice,
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString(),
    readCount: notice._count.reads,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const notice = await db.notice.findUnique({ where: { id } })
  if (!notice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (notice.authorId !== session.user.id && session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const updated = await db.notice.update({
    where: { id },
    data: {
      title: body.title ?? undefined,
      content: body.content ?? undefined,
      isPinned: body.isPinned ?? undefined,
    },
    include: { author: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const notice = await db.notice.findUnique({ where: { id } })
  if (!notice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (notice.authorId !== session.user.id && session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await db.notice.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
