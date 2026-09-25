import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const journal = await db.workJournal.findUnique({ where: { id } })
  if (!journal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (journal.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.workJournal.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
