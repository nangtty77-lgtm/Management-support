import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { TaxInvoiceDetail } from './TaxInvoiceDetail'

export default async function TaxInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return null

  const { id } = await params
  const inv = await db.taxInvoice.findUnique({
    where: { id },
    include: {
      vendor: { select: { id: true, name: true, bizNo: true } },
      sale: { select: { id: true, title: true } },
      purchase: { select: { id: true, title: true } },
      createdBy: { select: { id: true, name: true } },
    },
  })

  if (!inv) notFound()

  return (
    <TaxInvoiceDetail
      invoice={{
        id: inv.id,
        type: inv.type,
        invoiceNo: inv.invoiceNo,
        issueDate: inv.issueDate.toISOString(),
        amount: inv.amount.toString(),
        taxAmount: inv.taxAmount.toString(),
        totalAmount: inv.totalAmount.toString(),
        description: inv.description,
        notes: inv.notes,
        status: inv.status,
        vendor: inv.vendor,
        sale: inv.sale,
        purchase: inv.purchase,
        createdBy: inv.createdBy,
        createdAt: inv.createdAt.toISOString(),
      }}
    />
  )
}
