import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { BudgetReportClient } from './BudgetReportClient'

export default async function BudgetReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const session = await auth()
  if (!session) return null

  const { year: yearStr } = await searchParams
  const year = parseInt(yearStr ?? String(new Date().getFullYear()))

  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59)

  const [budgets, sales, purchases, expenses] = await Promise.all([
    db.budget.findMany({ where: { year }, orderBy: { category: 'asc' } }),
    db.sale.findMany({
      where: { saleDate: { gte: yearStart, lte: yearEnd } },
      select: { saleDate: true, totalAmount: true },
    }),
    db.purchase.findMany({
      where: { purchaseDate: { gte: yearStart, lte: yearEnd } },
      select: { purchaseDate: true, totalAmount: true },
    }),
    db.expense.findMany({
      where: {
        expenseDate: { gte: yearStart, lte: yearEnd },
        status: { in: ['APPROVED', 'PAID'] },
      },
      select: { expenseDate: true, amount: true, type: true },
    }),
  ])

  return (
    <BudgetReportClient
      year={year}
      budgets={budgets.map((b) => ({
        id: b.id,
        category: b.category,
        title: b.title,
        month: b.month,
        amount: b.amount.toString(),
        usedAmount: b.usedAmount.toString(),
      }))}
      sales={sales.map((s) => ({
        saleDate: s.saleDate.toISOString(),
        totalAmount: s.totalAmount.toString(),
      }))}
      purchases={purchases.map((p) => ({
        purchaseDate: p.purchaseDate.toISOString(),
        totalAmount: p.totalAmount.toString(),
      }))}
      expenses={expenses.map((e) => ({
        expenseDate: e.expenseDate.toISOString(),
        amount: e.amount.toString(),
        type: e.type,
      }))}
    />
  )
}
