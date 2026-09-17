import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { ExpensesClient } from './ExpensesClient'

export default async function ExpensesPage() {
  const session = await auth()
  if (!session) return null

  const expenses = await db.expense.findMany({
    include: { paidBy: { select: { name: true } } },
    orderBy: { expenseDate: 'desc' },
  })

  return (
    <ExpensesClient
      expenses={expenses.map((e) => ({
        ...e,
        amount: e.amount.toString(),
        expenseDate: e.expenseDate.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        approvedAt: e.approvedAt?.toISOString() ?? null,
      }))}
    />
  )
}
