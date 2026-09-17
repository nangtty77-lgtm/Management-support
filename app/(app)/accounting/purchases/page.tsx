import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { PurchasesClient } from './PurchasesClient'

export default async function PurchasesPage() {
  const session = await auth()
  if (!session) return null

  const purchases = await db.purchase.findMany({
    include: { vendor: { select: { name: true } } },
    orderBy: { purchaseDate: 'desc' },
  })

  return (
    <PurchasesClient
      purchases={purchases.map((p) => ({
        ...p,
        amount: p.amount.toString(),
        taxAmount: p.taxAmount.toString(),
        totalAmount: p.totalAmount.toString(),
        paidAmount: p.paidAmount.toString(),
        purchaseDate: p.purchaseDate.toISOString(),
        dueDate: p.dueDate?.toISOString() ?? null,
        paidDate: p.paidDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  )
}
