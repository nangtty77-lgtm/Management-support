import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { KpiClient } from './KpiClient'

export default async function KpiPage() {
  const session = await auth()
  if (!session) return null

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const ydStart = new Date(todayStart); ydStart.setDate(ydStart.getDate() - 1)
  const ydEnd = new Date(todayEnd); ydEnd.setDate(ydEnd.getDate() - 1)

  const mStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const yStart = new Date(now.getFullYear(), 0, 1)
  const yEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
  const lyStart = new Date(now.getFullYear() - 1, 0, 1)
  const lyEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59)

  const trend7Start = new Date(todayStart.getTime() - 6 * 864e5)
  const trend6mStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    todaySalesAgg, ydSalesAgg,
    mSalesAgg, lmSalesAgg,
    ySalesAgg, lySalesAgg,
    todayExpAgg, ydExpAgg,
    mExpAgg, lmExpAgg,
    yExpAgg,
    mPurchaseAgg,
    yPurchaseAgg,
    allTasks,
    contractsSoon,
    yearBudgets,
    taxYear,
    sales7d,
    sales6m,
    purchases6m,
  ] = await Promise.all([
    db.sale.aggregate({ where: { saleDate: { gte: todayStart, lte: todayEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.sale.aggregate({ where: { saleDate: { gte: ydStart, lte: ydEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.sale.aggregate({ where: { saleDate: { gte: mStart, lte: mEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.sale.aggregate({ where: { saleDate: { gte: lmStart, lte: lmEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.sale.aggregate({ where: { saleDate: { gte: yStart, lte: yEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.sale.aggregate({ where: { saleDate: { gte: lyStart, lte: lyEnd } }, _sum: { totalAmount: true }, _count: true }),
    db.expense.aggregate({ where: { expenseDate: { gte: todayStart, lte: todayEnd }, status: 'APPROVED' }, _sum: { amount: true }, _count: true }),
    db.expense.aggregate({ where: { expenseDate: { gte: ydStart, lte: ydEnd }, status: 'APPROVED' }, _sum: { amount: true }, _count: true }),
    db.expense.aggregate({ where: { expenseDate: { gte: mStart, lte: mEnd }, status: 'APPROVED' }, _sum: { amount: true }, _count: true }),
    db.expense.aggregate({ where: { expenseDate: { gte: lmStart, lte: lmEnd }, status: 'APPROVED' }, _sum: { amount: true }, _count: true }),
    db.expense.aggregate({ where: { expenseDate: { gte: yStart, lte: yEnd }, status: 'APPROVED' }, _sum: { amount: true } }),
    db.purchase.aggregate({ where: { purchaseDate: { gte: mStart, lte: mEnd } }, _sum: { totalAmount: true } }),
    db.purchase.aggregate({ where: { purchaseDate: { gte: yStart, lte: yEnd } }, _sum: { totalAmount: true } }),
    db.task.findMany({ select: { status: true, dueDate: true } }),
    db.contract.count({ where: { status: 'ACTIVE', endDate: { gte: now, lte: new Date(now.getTime() + 30 * 864e5) } } }),
    db.budget.findMany({ where: { year: now.getFullYear(), month: null } }),
    db.taxInvoice.findMany({ where: { issueDate: { gte: yStart, lte: yEnd } }, select: { type: true, taxAmount: true } }),
    db.sale.findMany({ where: { saleDate: { gte: trend7Start, lte: todayEnd } }, select: { saleDate: true, totalAmount: true } }),
    db.sale.findMany({ where: { saleDate: { gte: trend6mStart, lte: mEnd } }, select: { saleDate: true, totalAmount: true } }),
    db.purchase.findMany({ where: { purchaseDate: { gte: trend6mStart, lte: mEnd } }, select: { purchaseDate: true, totalAmount: true } }),
  ])

  // 7일 트렌드
  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayStart.getTime() - (6 - i) * 864e5)
    const ds = new Date(d); ds.setHours(0, 0, 0, 0)
    const de = new Date(d); de.setHours(23, 59, 59, 999)
    const sales = sales7d.filter(s => s.saleDate >= ds && s.saleDate <= de).reduce((a, s) => a + Number(s.totalAmount), 0)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    return { label, sales: String(sales) }
  })

  // 6개월 트렌드
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const me = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59)
    const sales = sales6m.filter(s => s.saleDate >= m && s.saleDate <= me).reduce((a, s) => a + Number(s.totalAmount), 0)
    const purch = purchases6m.filter(p => p.purchaseDate >= m && p.purchaseDate <= me).reduce((a, p) => a + Number(p.totalAmount), 0)
    return { label: `${m.getMonth() + 1}월`, sales: String(sales), purchase: String(purch) }
  })

  const taskTotal = allTasks.length
  const taskCompleted = allTasks.filter(t => t.status === 'COMPLETED').length
  const taskInProgress = allTasks.filter(t => t.status === 'IN_PROGRESS').length
  const taskOverdue = allTasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'COMPLETED').length
  const taskDueToday = allTasks.filter(t => t.dueDate && t.dueDate >= todayStart && t.dueDate <= todayEnd && t.status !== 'COMPLETED').length

  const yearBudgetTotal = yearBudgets.reduce((s, b) => s + Number(b.amount), 0)
  const issuedTax = taxYear.filter(t => t.type === 'ISSUED').reduce((s, t) => s + Number(t.taxAmount), 0)
  const receivedTax = taxYear.filter(t => t.type === 'RECEIVED').reduce((s, t) => s + Number(t.taxAmount), 0)

  const s = (n: bigint | null | undefined) => String(n ?? 0)

  return (
    <KpiClient kpi={{
      today: {
        sales: s(todaySalesAgg._sum.totalAmount), salesCount: todaySalesAgg._count,
        ydSales: s(ydSalesAgg._sum.totalAmount),
        expenses: s(todayExpAgg._sum.amount), expCount: todayExpAgg._count,
        ydExpenses: s(ydExpAgg._sum.amount),
        taskDueToday, taskOverdue,
      },
      month: {
        sales: s(mSalesAgg._sum.totalAmount), salesCount: mSalesAgg._count,
        lmSales: s(lmSalesAgg._sum.totalAmount),
        expenses: s(mExpAgg._sum.amount), expCount: mExpAgg._count,
        lmExpenses: s(lmExpAgg._sum.amount),
        purchase: s(mPurchaseAgg._sum.totalAmount),
        taskTotal, taskCompleted, taskInProgress,
      },
      year: {
        sales: s(ySalesAgg._sum.totalAmount), salesCount: ySalesAgg._count,
        lySales: s(lySalesAgg._sum.totalAmount),
        expenses: s(yExpAgg._sum.amount),
        purchase: s(yPurchaseAgg._sum.totalAmount),
        budget: String(yearBudgetTotal),
        issuedTax: String(issuedTax),
        receivedTax: String(receivedTax),
      },
      contractsExpiringSoon: contractsSoon,
      dailyTrend,
      monthlyTrend,
      currentMonth: now.getMonth() + 1,
      currentYear: now.getFullYear(),
    }} />
  )
}
