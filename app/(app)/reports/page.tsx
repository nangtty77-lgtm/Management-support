import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { ReportsClient } from './ReportsClient'

export default async function ReportsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)
  const prevMonthStart = new Date(year, month - 2, 1)
  const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59)

  const [
    salesThisMonth, salesLastMonth,
    purchasesThisMonth, purchasesLastMonth,
    expensesThisMonth,
    taskStats,
    leaveStats,
    contractStats,
    employees,
    meetingsThisMonth,
    monthlySales,
  ] = await Promise.all([
    db.sale.aggregate({ where: { saleDate: { gte: monthStart, lte: monthEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.sale.aggregate({ where: { saleDate: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.purchase.aggregate({ where: { purchaseDate: { gte: monthStart, lte: monthEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.purchase.aggregate({ where: { purchaseDate: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.expense.aggregate({ where: { expenseDate: { gte: monthStart, lte: monthEnd } }, _sum: { amount: true }, _count: true }),
    db.task.groupBy({ by: ['status'], _count: true }),
    db.leaveRequest.groupBy({ by: ['status'], _count: true }),
    db.contract.groupBy({ by: ['status'], _count: true }),
    db.employee.count({ where: { status: 'ACTIVE' } }),
    db.meeting.count({ where: { startAt: { gte: monthStart, lte: monthEnd } } }),
    // Last 6 months sales
    Promise.all(Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 1 - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      return db.sale.aggregate({ where: { saleDate: { gte: start, lte: end } }, _sum: { totalAmount: true }, _count: true })
        .then(r => ({ month: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`, total: Number(r._sum.totalAmount ?? 0), count: r._count }))
    })),
  ])

  return (
    <ReportsClient
      year={year}
      month={month}
      salesThisMonth={{ total: Number(salesThisMonth._sum.totalAmount ?? 0), count: salesThisMonth._count }}
      salesLastMonth={{ total: Number(salesLastMonth._sum.totalAmount ?? 0), count: salesLastMonth._count }}
      purchasesThisMonth={{ total: Number(purchasesThisMonth._sum.totalAmount ?? 0), count: purchasesThisMonth._count }}
      purchasesLastMonth={{ total: Number(purchasesLastMonth._sum.totalAmount ?? 0), count: purchasesLastMonth._count }}
      expensesThisMonth={{ total: Number(expensesThisMonth._sum.amount ?? 0), count: expensesThisMonth._count }}
      taskStats={taskStats.map(t => ({ status: t.status, count: t._count }))}
      leaveStats={leaveStats.map(l => ({ status: l.status, count: l._count }))}
      contractStats={contractStats.map(c => ({ status: c.status, count: c._count }))}
      activeEmployees={employees}
      meetingsThisMonth={meetingsThisMonth}
      monthlySales={monthlySales.reverse()}
    />
  )
}
