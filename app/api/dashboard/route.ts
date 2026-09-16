import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  const in90Days = new Date(now)
  in90Days.setDate(in90Days.getDate() + 90)

  const [urgentTasks, todayDueTasks, expiringContracts, pendingLeaves] = await Promise.all([
    db.task.count({ where: { priority: 'URGENT', status: { not: 'COMPLETED' } } }),
    db.task.count({ where: { dueDate: { lte: todayEnd }, status: { not: 'COMPLETED' } } }),
    db.contract.count({ where: { endDate: { lte: in90Days, gte: now }, status: 'ACTIVE' } }),
    db.leaveRequest.count({ where: { status: 'PENDING' } }),
  ])

  const todayTasks = await db.task.findMany({
    where: { dueDate: { lte: todayEnd }, status: { not: 'COMPLETED' } },
    include: { assignee: { select: { name: true } } },
    orderBy: { priority: 'asc' },
    take: 10,
  })

  const nearExpiryContracts = await db.contract.findMany({
    where: { endDate: { lte: in90Days, gte: now }, status: 'ACTIVE' },
    orderBy: { endDate: 'asc' },
    take: 5,
  })

  return NextResponse.json({
    kpi: { urgentTasks, todayDueTasks, expiringContracts, pendingLeaves },
    todayTasks,
    nearExpiryContracts: nearExpiryContracts.map((c) => ({
      ...c,
      amount: c.amount.toString(),
    })),
  })
}
