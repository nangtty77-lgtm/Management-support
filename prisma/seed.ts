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

  // Admin employee record
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

  console.log('Seed complete. Admin: admin@bizhub.local / admin1234!')
}

main().catch(console.error).finally(() => db.$disconnect())
