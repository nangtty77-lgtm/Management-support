import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const notices = await db.notice.findMany({
    include: {
      author: { select: { id: true, name: true } },
      reads: { where: { userId: session.user.id }, select: { id: true } },
      _count: { select: { reads: true } },
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(notices.map(n => ({
    id: n.id,
    title: n.title,
    content: n.content,
    isPinned: n.isPinned,
    author: n.author,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    isRead: n.reads.length > 0,
    readCount: n._count.reads,
  })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['ADMIN', 'HR', 'GENERAL'].includes(session.user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, content, isPinned } = await req.json()
  if (!title?.trim() || !content?.trim()) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })

  const notice = await db.notice.create({
    data: { title: title.trim(), content: content.trim(), isPinned: isPinned ?? false, authorId: session.user.id },
    include: { author: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ ...notice, createdAt: notice.createdAt.toISOString(), updatedAt: notice.updatedAt.toISOString(), isRead: false, readCount: 0 }, { status: 201 })
}
