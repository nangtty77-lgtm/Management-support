import { PrismaClient, Role, EmpStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  // Departments
  const depts = await Promise.all([
    db.department.upsert({ where: { id: 'dept-admin' }, update: {}, create: { id: 'dept-admin', name: '경영지원팀' } }),
    db.department.upsert({ where: { id: 'dept-sales' }, update: {}, create: { id: 'dept-sales', name: '영업팀' } }),
    db.department.upsert({ where: { id: 'dept-dev' }, update: {}, create: { id: 'dept-dev', name: '개발팀' } }),
  ])

  // Admin user
  const hash = await bcrypt.hash('admin1234!', 12)
  const admin = await db.user.upsert({
    where: { email: 'admin@bizhub.local' },
    update: {},
    create: {
      id: 'user-admin',
      name: '관리자',
      email: 'admin@bizhub.local',
      password: hash,
      role: Role.ADMIN,
      departmentId: depts[0].id,
    },
  })

  await db.employee.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      departmentId: depts[0].id,
      position: '부장',
      hireDate: new Date('2020-01-01'),
      status: EmpStatus.ACTIVE,
    },
  })

  // Vendors
  await db.vendor.createMany({
    skipDuplicates: true,
    data: [
      { id: 'vendor-hcinfo', name: 'HCINFO', type: 'CUSTOMER', email: 'contact@hcinfo.kr' },
      { id: 'vendor-mega', name: 'MEGA', type: 'CUSTOMER', email: 'contact@mega.co.kr' },
      { id: 'vendor-s1', name: '(주)공급업체A', type: 'SUPPLIER' },
      { id: 'vendor-s2', name: '(주)공급업체B', type: 'SUPPLIER' },
    ],
  })

  // 2026 Budgets (연간, month=null)
  const budgets = [
    { category: 'SALES' as const, title: '영업·마케팅 예산', amount: BigInt(50_000_000), usedAmount: BigInt(18_500_000) },
    { category: 'MARKETING' as const, title: '마케팅 예산', amount: BigInt(30_000_000), usedAmount: BigInt(22_000_000) },
    { category: 'LABOR' as const, title: '인건비 예산', amount: BigInt(200_000_000), usedAmount: BigInt(157_000_000) },
    { category: 'OFFICE' as const, title: '사무비 예산', amount: BigInt(15_000_000), usedAmount: BigInt(9_200_000) },
    { category: 'TRAVEL' as const, title: '출장·교통비 예산', amount: BigInt(20_000_000), usedAmount: BigInt(14_800_000) },
    { category: 'IT' as const, title: 'IT 인프라 예산', amount: BigInt(25_000_000), usedAmount: BigInt(11_500_000) },
    { category: 'FACILITY' as const, title: '시설 유지보수 예산', amount: BigInt(10_000_000), usedAmount: BigInt(3_200_000) },
    { category: 'OTHER' as const, title: '기타 예산', amount: BigInt(10_000_000), usedAmount: BigInt(2_700_000) },
  ]
  for (const b of budgets) {
    await db.budget.create({ data: { year: 2026, ...b } }).catch(() => null)
  }

  // 2026 Sales
  const salesData = [
    { m: 1, v: 'vendor-hcinfo', title: 'HCINFO 1월 용역', amt: 18_000_000 },
    { m: 2, v: 'vendor-hcinfo', title: 'HCINFO 2월 용역', amt: 22_000_000 },
    { m: 3, v: 'vendor-mega', title: 'MEGA 시스템 구축', amt: 45_000_000 },
    { m: 3, v: 'vendor-hcinfo', title: 'HCINFO 3월 유지보수', amt: 15_000_000 },
    { m: 4, v: 'vendor-hcinfo', title: 'HCINFO 4월 용역', amt: 20_000_000 },
    { m: 4, v: 'vendor-mega', title: 'MEGA 추가 개발', amt: 30_000_000 },
    { m: 5, v: 'vendor-hcinfo', title: 'HCINFO 5월 용역', amt: 20_000_000 },
    { m: 5, v: 'vendor-mega', title: 'MEGA 2차 구축', amt: 55_000_000 },
    { m: 6, v: 'vendor-hcinfo', title: 'HCINFO 상반기 정산', amt: 25_000_000 },
    { m: 7, v: 'vendor-hcinfo', title: 'HCINFO 7월 용역', amt: 22_000_000 },
    { m: 7, v: 'vendor-mega', title: 'MEGA 3차 구축', amt: 40_000_000 },
    { m: 8, v: 'vendor-hcinfo', title: 'HCINFO 8월 용역', amt: 18_000_000 },
    { m: 8, v: 'vendor-mega', title: 'MEGA 유지보수', amt: 12_000_000 },
    { m: 9, v: 'vendor-hcinfo', title: 'HCINFO 9월 용역', amt: 20_000_000 },
  ]
  for (const s of salesData) {
    const tax = Math.round(s.amt * 0.1)
    await db.sale.create({
      data: {
        vendorId: s.v, title: s.title,
        amount: BigInt(s.amt), taxAmount: BigInt(tax), totalAmount: BigInt(s.amt + tax),
        paidAmount: BigInt(s.amt + tax),
        saleDate: new Date(`2026-${String(s.m).padStart(2, '0')}-15`),
        status: 'PAID', assigneeId: admin.id,
      },
    }).catch(() => null)
  }

  // 2026 Purchases
  const purchasesData = [
    { m: 1, v: 'vendor-s1', title: '서버 임대비 1월', amt: 3_500_000 },
    { m: 2, v: 'vendor-s1', title: '서버 임대비 2월', amt: 3_500_000 },
    { m: 3, v: 'vendor-s2', title: '외주 개발비 3월', amt: 8_000_000 },
    { m: 3, v: 'vendor-s1', title: '서버 임대비 3월', amt: 3_500_000 },
    { m: 4, v: 'vendor-s1', title: '서버 임대비 4월', amt: 3_500_000 },
    { m: 4, v: 'vendor-s2', title: '외주 개발비 4월', amt: 6_000_000 },
    { m: 5, v: 'vendor-s1', title: '서버 임대비 5월', amt: 3_500_000 },
    { m: 5, v: 'vendor-s2', title: '외주 개발비 5월', amt: 10_000_000 },
    { m: 6, v: 'vendor-s1', title: '서버 임대비 6월', amt: 3_500_000 },
    { m: 7, v: 'vendor-s1', title: '서버 임대비 7월', amt: 3_500_000 },
    { m: 7, v: 'vendor-s2', title: '외주 개발비 7월', amt: 7_000_000 },
    { m: 8, v: 'vendor-s1', title: '서버 임대비 8월', amt: 3_500_000 },
    { m: 9, v: 'vendor-s1', title: '서버 임대비 9월', amt: 3_500_000 },
  ]
  for (const p of purchasesData) {
    const tax = Math.round(p.amt * 0.1)
    await db.purchase.create({
      data: {
        vendorId: p.v, title: p.title,
        amount: BigInt(p.amt), taxAmount: BigInt(tax), totalAmount: BigInt(p.amt + tax),
        paidAmount: BigInt(p.amt + tax),
        purchaseDate: new Date(`2026-${String(p.m).padStart(2, '0')}-20`),
        status: 'PAID', assigneeId: admin.id,
      },
    }).catch(() => null)
  }

  // 2026 Expenses
  const expenseData = [
    { m: 1, type: 'CORPORATE_CARD' as const, title: '1월 법인카드', amt: 1_200_000 },
    { m: 1, type: 'TRAVEL' as const, title: '출장비 1월', amt: 450_000 },
    { m: 2, type: 'CORPORATE_CARD' as const, title: '2월 법인카드', amt: 980_000 },
    { m: 2, type: 'ENTERTAINMENT' as const, title: '고객 접대비', amt: 350_000 },
    { m: 3, type: 'CORPORATE_CARD' as const, title: '3월 법인카드', amt: 1_500_000 },
    { m: 3, type: 'TRAVEL' as const, title: '3월 출장비', amt: 680_000 },
    { m: 4, type: 'CORPORATE_CARD' as const, title: '4월 법인카드', amt: 1_100_000 },
    { m: 4, type: 'SUPPLIES' as const, title: '소모품 구매', amt: 320_000 },
    { m: 5, type: 'CORPORATE_CARD' as const, title: '5월 법인카드', amt: 1_350_000 },
    { m: 5, type: 'TRAVEL' as const, title: '5월 출장비', amt: 520_000 },
    { m: 6, type: 'CORPORATE_CARD' as const, title: '6월 법인카드', amt: 900_000 },
    { m: 6, type: 'ENTERTAINMENT' as const, title: '상반기 파트너 미팅', amt: 580_000 },
    { m: 7, type: 'CORPORATE_CARD' as const, title: '7월 법인카드', amt: 1_050_000 },
    { m: 7, type: 'TRAVEL' as const, title: '7월 출장비', amt: 410_000 },
    { m: 8, type: 'CORPORATE_CARD' as const, title: '8월 법인카드', amt: 820_000 },
    { m: 9, type: 'CORPORATE_CARD' as const, title: '9월 법인카드', amt: 950_000 },
    { m: 9, type: 'TRAVEL' as const, title: '9월 출장비', amt: 380_000 },
  ]
  for (const e of expenseData) {
    await db.expense.create({
      data: {
        type: e.type, title: e.title, amount: BigInt(e.amt),
        expenseDate: new Date(`2026-${String(e.m).padStart(2, '0')}-10`),
        paidById: admin.id, status: 'PAID',
      },
    }).catch(() => null)
  }

  console.log('Seed complete. Admin: admin@bizhub.local / admin1234!')
}

main().catch(console.error).finally(() => db.$disconnect())
