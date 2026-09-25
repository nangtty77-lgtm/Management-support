import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const comments = await db.taskComment.findMany({
    where: { taskId: id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(comments)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: '내용을 입력하세요' }, { status: 400 })

  const comment = await db.taskComment.create({
    data: { taskId: id, authorId: session.user.id, content: content.trim() },
    include: { author: { select: { id: true, name: true } } },
  })

  return NextResponse.json(comment, { status: 201 })
}
