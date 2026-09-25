import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { commentId } = await params
  const comment = await db.taskComment.findUnique({ where: { id: commentId } })
  if (!comment) return NextResponse.json({ error: '없음' }, { status: 404 })
  if (comment.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.taskComment.delete({ where: { id: commentId } })
  return NextResponse.json({ ok: true })
}
