import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 1) return NextResponse.json({ results: [] })

  const like = { contains: q, mode: 'insensitive' as const }

  const [tasks, customers, contracts, employees, sales, purchases] = await Promise.all([
    db.task.findMany({
      where: { OR: [{ title: like }, { description: like }] },
      select: { id: true, title: true, status: true, priority: true },
      take: 5,
    }),
    db.customer.findMany({
      where: { OR: [{ name: like }, { companyName: like }, { email: like }] },
      select: { id: true, name: true, companyName: true },
      take: 5,
    }),
    db.contract.findMany({
      where: { OR: [{ name: like }, { vendorName: like }] },
      select: { id: true, name: true, vendorName: true, status: true },
      take: 5,
    }),
    db.employee.findMany({
      where: { OR: [{ user: { name: like } }, { position: like }] },
      select: { id: true, position: true, user: { select: { name: true } }, department: { select: { name: true } } },
      take: 5,
    }),
    db.sale.findMany({
      where: { OR: [{ title: like }, { notes: like }] },
      select: { id: true, title: true, totalAmount: true },
      take: 4,
    }),
    db.purchase.findMany({
      where: { OR: [{ title: like }, { notes: like }] },
      select: { id: true, title: true, totalAmount: true },
      take: 4,
    }),
  ])

  const results = [
    ...tasks.map(t => ({ type: 'task', href: `/tasks/${t.id}`, label: t.title, sub: `업무 · ${t.status}`, icon: 'check' })),
    ...customers.map(c => ({ type: 'customer', href: `/crm/customers/${c.id}`, label: c.name, sub: `고객 · ${c.companyName ?? ''}`, icon: 'crm' })),
    ...contracts.map(c => ({ type: 'contract', href: `/contracts/${c.id}`, label: c.name, sub: `계약 · ${c.vendorName}`, icon: 'document' })),
    ...employees.map(e => ({ type: 'employee', href: `/employees/${e.id}`, label: e.user.name, sub: `직원 · ${e.department?.name ?? ''} ${e.position ?? ''}`, icon: 'employee' })),
    ...sales.map(s => ({ type: 'sale', href: `/accounting/sales/${s.id}`, label: s.title, sub: `매출 · ${Number(s.totalAmount).toLocaleString('ko-KR')}원`, icon: 'money' })),
    ...purchases.map(p => ({ type: 'purchase', href: `/accounting/purchases/${p.id}`, label: p.title, sub: `매입 · ${Number(p.totalAmount).toLocaleString('ko-KR')}원`, icon: 'cart' })),
  ]

  return NextResponse.json({ results })
}
