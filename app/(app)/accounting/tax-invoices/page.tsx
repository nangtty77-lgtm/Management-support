import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { TaxInvoicesClient } from './TaxInvoicesClient'

export default async function TaxInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const session = await auth()
  if (!session) return null

  const { year: yearStr } = await searchParams
  const year = parseInt(yearStr ?? String(new Date().getFullYear()))

  const invoices = await db.taxInvoice.findMany({
    where: {
      issueDate: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
    include: { vendor: { select: { id: true, name: true } } },
    orderBy: { issueDate: 'desc' },
  })

  return (
    <TaxInvoicesClient
      year={year}
      invoices={invoices.map((inv) => ({
        id: inv.id,
        type: inv.type,
        invoiceNo: inv.invoiceNo,
        issueDate: inv.issueDate.toISOString(),
        amount: inv.amount.toString(),
        taxAmount: inv.taxAmount.toString(),
        totalAmount: inv.totalAmount.toString(),
        description: inv.description,
        status: inv.status,
        vendor: inv.vendor,
      }))}
    />
  )
}
