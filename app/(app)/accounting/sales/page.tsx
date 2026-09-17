import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { SalesClient } from './SalesClient'

export default async function SalesPage() {
  const session = await auth()
  if (!session) return null

  const sales = await db.sale.findMany({
    include: { vendor: { select: { name: true } } },
    orderBy: { saleDate: 'desc' },
  })

  return (
    <SalesClient
      sales={sales.map((s) => ({
        ...s,
        amount: s.amount.toString(),
        taxAmount: s.taxAmount.toString(),
        totalAmount: s.totalAmount.toString(),
        paidAmount: s.paidAmount.toString(),
        saleDate: s.saleDate.toISOString(),
        dueDate: s.dueDate?.toISOString() ?? null,
        paidDate: s.paidDate?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))}
    />
  )
}
