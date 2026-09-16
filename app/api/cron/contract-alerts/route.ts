import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Called by Vercel Cron (daily) — secured by CRON_SECRET header
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const alerts = await db.contractAlert.findMany({
    where: { sentAt: null },
    include: { contract: { include: { owner: true } } },
  })

  const sent: string[] = []

  for (const alert of alerts) {
    const contract = alert.contract
    if (contract.status !== 'ACTIVE') continue

    const daysUntilExpiry = Math.ceil(
      (contract.endDate.getTime() - now.getTime()) / 86400000,
    )

    if (daysUntilExpiry <= alert.alertDays && daysUntilExpiry >= 0) {
      // Notify contract owner and all ADMIN/GENERAL users
      const targets = await db.user.findMany({
        where: { role: { in: ['ADMIN', 'GENERAL'] }, active: true },
        select: { id: true },
      })
      const userIds = Array.from(
        new Set([contract.ownerId, ...targets.map((u) => u.id)])
      )

      await db.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type: 'CONTRACT_EXPIRY' as const,
          title: '계약 만료 임박',
          message: `[${contract.name}] 계약이 ${daysUntilExpiry}일 후 만료됩니다. (거래처: ${contract.vendorName})`,
          link: `/contracts/${contract.id}`,
        })),
        skipDuplicates: true,
      })

      await db.contractAlert.update({
        where: { id: alert.id },
        data: { sentAt: now },
      })

      sent.push(alert.id)
    }
  }

  return NextResponse.json({ sent: sent.length })
}
