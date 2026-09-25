import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl
  const year = parseInt(url.searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(url.searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const employeeId = url.searchParams.get('employeeId')

  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0, 23, 59, 59)

  const attendances = await db.attendance.findMany({
    where: {
      date: { gte: from, lte: to },
      ...(employeeId ? { employeeId } : {}),
    },
    include: { employee: { include: { user: { select: { name: true } } } } },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(attendances.map(a => ({
    id: a.id,
    employeeId: a.employeeId,
    employeeName: a.employee.user.name,
    date: a.date.toISOString(),
    checkIn: a.checkIn?.toISOString() ?? null,
    checkOut: a.checkOut?.toISOString() ?? null,
    status: a.status,
    notes: a.notes,
  })))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { employeeId, date, checkIn, checkOut, status, notes } = body

  if (!employeeId || !date) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })

  // Parse date as UTC midnight to avoid timezone shifting
  const dateObj = new Date(date + 'T00:00:00.000Z')

  const record = await db.attendance.upsert({
    where: { employeeId_date: { employeeId, date: dateObj } },
    create: {
      employeeId, date: dateObj,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      status: status ?? 'PRESENT',
      notes,
    },
    update: {
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      status: status ?? 'PRESENT',
      notes,
    },
    include: { employee: { include: { user: { select: { name: true } } } } },
  })

  return NextResponse.json({
    id: record.id,
    employeeId: record.employeeId,
    employeeName: record.employee.user.name,
    date: record.date.toISOString(),
    checkIn: record.checkIn?.toISOString() ?? null,
    checkOut: record.checkOut?.toISOString() ?? null,
    status: record.status,
    notes: record.notes,
  }, { status: 201 })
}
