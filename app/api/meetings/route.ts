import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const meetings = await db.meeting.findMany({
    where: {
      ...(from && to ? { startAt: { gte: new Date(from), lte: new Date(to) } } : {}),
      OR: [
        { organizerId: session.user.id },
        { attendees: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: { startAt: 'asc' },
  })

  return NextResponse.json(meetings.map(m => ({
    id: m.id, title: m.title, description: m.description, startAt: m.startAt.toISOString(),
    endAt: m.endAt.toISOString(), location: m.location, status: m.status,
    organizerName: m.organizer.name, organizerId: m.organizer.id,
    attendees: m.attendees.map(a => ({ id: a.user.id, name: a.user.name, confirmed: a.confirmed })),
  })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, description, startAt, endAt, location, attendeeIds = [] } = body

  if (!title || !startAt || !endAt) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })

  const meeting = await db.meeting.create({
    data: {
      title, description, startAt: new Date(startAt), endAt: new Date(endAt), location,
      organizerId: session.user.id,
      attendees: {
        create: [...new Set([...attendeeIds, session.user.id].filter(Boolean))].map((uid: string) => ({
          userId: uid, confirmed: uid === session.user.id,
        })),
      },
    },
    include: {
      organizer: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true } } } },
    },
  })

  return NextResponse.json({
    id: meeting.id, title: meeting.title, startAt: meeting.startAt.toISOString(),
    endAt: meeting.endAt.toISOString(), organizerName: meeting.organizer.name,
    attendees: meeting.attendees.map(a => ({ id: a.user.id, name: a.user.name, confirmed: a.confirmed })),
  }, { status: 201 })
}
