import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { PipelineClient } from './PipelineClient'

export default async function PipelinePage() {
  const session = await auth()
  if (!session) return null

  const [opportunities, customers] = await Promise.all([
    db.opportunity.findMany({
      include: {
        customer: { select: { name: true, companyName: true } },
        assignee: { select: { name: true } },
      },
      orderBy: [{ stage: 'asc' }, { amount: 'desc' }],
    }),
    db.customer.findMany({
      select: { id: true, name: true, companyName: true, grade: true, status: true },
      where: { status: 'ACTIVE' },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <PipelineClient
      opportunities={opportunities.map(o => ({
        id: o.id,
        title: o.title,
        amount: o.amount.toString(),
        stage: o.stage,
        probability: o.probability,
        expectedClose: o.expectedClose?.toISOString() ?? null,
        customerName: o.customer.companyName ?? o.customer.name,
        assigneeName: o.assignee?.name ?? null,
        notes: o.notes ?? '',
      }))}
      customers={customers.map(c => ({
        id: c.id,
        name: c.name,
        companyName: c.companyName ?? '',
        grade: c.grade,
        status: c.status,
      }))}
    />
  )
}
