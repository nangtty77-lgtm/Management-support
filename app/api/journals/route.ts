import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl
  const year = parseInt(url.searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(url.searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const authorId = url.searchParams.get('authorId')

  const isAdmin = ['ADMIN', 'HR'].includes(session.user.role)

  const journals = await db.workJournal.findMany({
    where: {
      date: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0, 23, 59, 59) },
      ...(isAdmin && authorId ? { authorId } : !isAdmin ? { authorId: session.user.id } : {}),
    },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(journals.map(j => ({
    id: j.id, authorId: j.authorId, authorName: j.author.name,
    date: j.date.toISOString(), content: j.content,
    tasks: j.tasks, plan: j.plan, issues: j.issues, mood: j.mood,
    createdAt: j.createdAt.toISOString(),
  })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { date, content, tasks, plan, issues, mood } = body

  if (!date || !content) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })

  const dateObj = new Date(date + 'T00:00:00.000Z')

  const journal = await db.workJournal.upsert({
    where: { authorId_date: { authorId: session.user.id, date: dateObj } },
    create: { authorId: session.user.id, date: dateObj, content, tasks, plan, issues, mood: mood ?? 'NORMAL' },
    update: { content, tasks, plan, issues, mood: mood ?? 'NORMAL' },
    include: { author: { select: { id: true, name: true } } },
  })

  return NextResponse.json({
    id: journal.id, authorId: journal.authorId, authorName: journal.author.name,
    date: journal.date.toISOString(), content: journal.content,
    tasks: journal.tasks, plan: journal.plan, issues: journal.issues, mood: journal.mood,
  }, { status: 201 })
}
