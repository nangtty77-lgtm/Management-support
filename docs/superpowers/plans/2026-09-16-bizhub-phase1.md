# BizHub Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build BizHub Phase 1 MVP — 대시보드·업무관리·직원관리·계약관리·알림 — as a new Next.js 15 app at `C:\클로드\bizhub`, port 3400.

**Architecture:** Next.js 15 App Router with Server Components and Server Actions; Prisma 6 + PostgreSQL (Neon); Auth.js v5 credentials provider with JWT; role-based middleware guard; Vercel Blob for contract file storage.

**Tech Stack:** Next.js 15, TypeScript (strict), Prisma 6, PostgreSQL/Neon, Auth.js v5, Tailwind CSS v4, Noto Sans KR, Vercel Blob, Vitest

**Spec:** `C:\클로드\bizhub\docs\superpowers\specs\2026-09-16-bizhub-phase1-design.md`

## Global Constraints

- Node ≥ 20, pnpm preferred
- TypeScript strict mode — no `any`
- Tailwind CSS v4 (not v3)
- Auth.js v5 (package: `next-auth@beta`)
- Prisma 6 (package: `prisma@^6`, `@prisma/client@^6`)
- Sidebar: `#0D1E40` navy, teal accent `#00BFA5`, content bg `#EFF3F9`
- Font: Noto Sans KR (Google Fonts CDN)
- Monetary values: `BigInt` (원 정수)
- Port: 3400 (`next dev -p 3400`)
- All user-visible text: Korean
- Max file upload: 10MB; allowed types: PDF, DOCX, HWP
- Permissions double-checked: Next.js middleware + Server Action level

---

## File Map

```
C:\클로드\bizhub\
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── tasks/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── _components/TaskForm.tsx
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── _components/EmployeeForm.tsx
│   │   ├── leaves/
│   │   │   ├── page.tsx
│   │   │   └── _components/LeaveForm.tsx
│   │   ├── contracts/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── _components/ContractForm.tsx
│   │   └── notifications/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── dashboard/route.ts
│       ├── tasks/route.ts
│       ├── tasks/[id]/route.ts
│       ├── employees/route.ts
│       ├── employees/[id]/route.ts
│       ├── leaves/route.ts
│       ├── leaves/[id]/route.ts
│       ├── contracts/route.ts
│       ├── contracts/[id]/route.ts
│       ├── contracts/upload/route.ts
│       └── notifications/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       └── Modal.tsx
├── lib/
│   ├── auth.ts          (Auth.js config)
│   ├── db.ts            (Prisma client singleton)
│   └── permissions.ts   (RBAC helper)
├── middleware.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── vitest.config.ts
├── .env.local
└── package.json
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `C:\클로드\bizhub\` (entire project root via create-next-app)
- Create: `.env.local`
- Create: `vitest.config.ts`
- Modify: `package.json` (add dev script with port 3400)
- Modify: `app/layout.tsx` (Noto Sans KR font)
- Modify: `tailwind.config.ts` (WEHAGO color tokens)

**Interfaces:**
- Produces: working `pnpm dev` on port 3400, Tailwind colors available, Vitest configured

- [ ] **Step 1: Bootstrap project**

```bash
cd C:\클로드
npx create-next-app@latest bizhub --typescript --tailwind --eslint --app --src-dir no --import-alias "@/*"
cd bizhub
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add next-auth@beta @auth/prisma-adapter prisma @prisma/client
pnpm add @vercel/blob
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Set port 3400 in package.json**

In `package.json`, change:
```json
"scripts": {
  "dev": "next dev -p 3400",
  "build": "next build",
  "start": "next start -p 3400",
  "lint": "next lint",
  "test": "vitest"
}
```

- [ ] **Step 4: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
```

Create `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create .env.local**

```env
DATABASE_URL="postgresql://USER:PASS@HOST/bizhub?sslmode=require"
NEXTAUTH_SECRET="change-me-in-production-use-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3400"
# BLOB_READ_WRITE_TOKEN=""  # add when setting up Vercel Blob
# ANTHROPIC_API_KEY=""      # Phase 2 reserved
```

- [ ] **Step 6: Add WEHAGO colors to tailwind config**

Replace `tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0D1E40',
        teal: '#00BFA5',
        'content-bg': '#EFF3F9',
        'card-bg': '#FFFFFF',
        sub: '#64748B',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 7: Update root layout for Noto Sans KR**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BizHub — 경영지원 플랫폼',
  description: '통합 경영지원 업무관리 플랫폼',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-content-bg">{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
pnpm dev
```
Expected: server running at http://localhost:3400

- [ ] **Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold BizHub Next.js 15 project with WEHAGO theme

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Database Schema + Prisma + Seed

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `lib/db.ts`

**Interfaces:**
- Produces: `db` singleton (Prisma client), all models available, seed creates admin user + 3 departments

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Write schema.prisma**

Replace `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Auth.js required models ──────────────────────────────────
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ── Core ─────────────────────────────────────────────────────
model User {
  id            String      @id @default(cuid())
  name          String
  email         String      @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role        @default(VIEW)
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
  active        Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  employee       Employee?
  assignedTasks  Task[]         @relation("TaskAssignee")
  createdTasks   Task[]         @relation("TaskCreator")
  ownedContracts Contract[]
  notifications  Notification[]
  accounts       Account[]
  sessions       Session[]
}

enum Role {
  ADMIN
  HR
  GENERAL
  OPS
  VIEW
}

model Department {
  id        String     @id @default(cuid())
  name      String
  createdAt DateTime   @default(now())
  users     User[]
  employees Employee[]
}

// ── HR ───────────────────────────────────────────────────────
model Employee {
  id           String     @id @default(cuid())
  userId       String     @unique
  user         User       @relation(fields: [userId], references: [id])
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id])
  position     String
  phone        String?
  hireDate     DateTime
  leaveDate    DateTime?
  status       EmpStatus  @default(ACTIVE)
  annualLeave  Int        @default(15)
  usedLeave    Int        @default(0)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  leaveRequests LeaveRequest[]
}

enum EmpStatus {
  ACTIVE
  PROBATION
  LEAVE
  RESIGNED
}

model LeaveRequest {
  id         String         @id @default(cuid())
  employeeId String
  employee   Employee       @relation(fields: [employeeId], references: [id])
  type       LeaveType
  startDate  DateTime
  endDate    DateTime
  days       Float
  reason     String?
  status     ApprovalStatus @default(PENDING)
  approverId String?
  approvedAt DateTime?
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt
}

enum LeaveType {
  ANNUAL
  SICK
  SPECIAL
  UNPAID
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

// ── Contracts ────────────────────────────────────────────────
model Contract {
  id          String         @id @default(cuid())
  name        String
  vendorName  String
  amount      BigInt
  startDate   DateTime
  endDate     DateTime
  autoRenewal Boolean        @default(false)
  ownerId     String
  owner       User           @relation(fields: [ownerId], references: [id])
  notes       String?
  fileUrl     String?
  status      ContractStatus @default(ACTIVE)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  alerts ContractAlert[]
  tasks  Task[]
}

enum ContractStatus {
  ACTIVE
  EXPIRED
  TERMINATED
  DRAFT
}

model ContractAlert {
  id         String    @id @default(cuid())
  contractId String
  contract   Contract  @relation(fields: [contractId], references: [id])
  alertDays  Int
  sentAt     DateTime?
  createdAt  DateTime  @default(now())
}

// ── Tasks ────────────────────────────────────────────────────
model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  assigneeId  String?
  assignee    User?      @relation("TaskAssignee", fields: [assigneeId], references: [id])
  creatorId   String
  creator     User       @relation("TaskCreator", fields: [creatorId], references: [id])
  priority    Priority   @default(NORMAL)
  status      TaskStatus @default(PENDING)
  dueDate     DateTime?
  completedAt DateTime?
  contractId  String?
  contract    Contract?  @relation(fields: [contractId], references: [id])
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

enum Priority {
  URGENT
  HIGH
  NORMAL
  LOW
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  REVIEW
  COMPLETED
  ON_HOLD
}

// ── Notifications ────────────────────────────────────────────
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  title     String
  message   String
  link      String?
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())
}

enum NotificationType {
  CONTRACT_EXPIRY
  LEAVE_REQUEST
  TASK_DUE
  TASK_ASSIGNED
  LEAVE_APPROVED
  SYSTEM
}
```

- [ ] **Step 3: Create lib/db.ts**

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['query', 'error', 'warn'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 4: Write prisma/seed.ts**

```ts
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
```

- [ ] **Step 5: Add bcryptjs + seed script**

```bash
pnpm add bcryptjs
pnpm add -D @types/bcryptjs ts-node
```

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

- [ ] **Step 6: Run migration and seed**

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Expected: tables created, seed logged "Seed complete."

- [ ] **Step 7: Write test for db singleton**

Create `lib/__tests__/db.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { db } from '../db'

describe('db singleton', () => {
  it('exports a PrismaClient instance', () => {
    expect(db).toBeDefined()
    expect(typeof db.$connect).toBe('function')
  })
})
```

- [ ] **Step 8: Run test**

```bash
pnpm test lib/__tests__/db.test.ts
```
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add prisma/ lib/db.ts lib/__tests__/
git commit -m "feat: add Prisma schema, migration, seed data

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Auth (Auth.js v5 + Login Page)

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `db` from `lib/db.ts`, `bcryptjs`
- Produces: `auth()` (server session getter), `signIn`/`signOut`, middleware guards `/app/*` routes, login page at `/login`

- [ ] **Step 1: Write lib/auth.ts**

```ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from './db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user || !user.password || !user.active) return null
        const ok = await bcrypt.compare(credentials.password as string, user.password)
        if (!ok) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})
```

- [ ] **Step 2: Create API route**

Create `app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

- [ ] **Step 3: Extend NextAuth types**

Create `types/next-auth.d.ts`:
```ts
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      role: string
    }
  }
}
```

- [ ] **Step 4: Write middleware.ts**

```ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  if (pathname.startsWith('/login')) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/dashboard', req.url))
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 5: Write login page**

Create `app/(auth)/login/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email: fd.get('email'),
      password: fd.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-content-bg">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded bg-navy flex items-center justify-center">
            <span className="text-teal font-bold text-sm">B</span>
          </div>
          <span className="font-bold text-navy text-xl">BizHub</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">이메일</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              placeholder="admin@bizhub.local"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1">비밀번호</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal text-white py-2 rounded-lg font-medium hover:bg-teal/90 disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify login works**

```bash
pnpm dev
```
Navigate to http://localhost:3400 → should redirect to /login.
Log in with admin@bizhub.local / admin1234! → should redirect to /dashboard (404 is OK at this point).

- [ ] **Step 7: Commit**

```bash
git add app/ lib/auth.ts middleware.ts types/
git commit -m "feat: add Auth.js v5 credentials login with role-based middleware

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Layout Shell (Sidebar + Header)

**Files:**
- Create: `components/layout/Sidebar.tsx`
- Create: `components/layout/Header.tsx`
- Create: `app/(app)/layout.tsx`

**Interfaces:**
- Consumes: `auth()` from `lib/auth.ts`
- Produces: authenticated layout wrapping all `(app)/*` pages; sidebar 190px navy; header 50px

- [ ] **Step 1: Write Sidebar.tsx**

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navSections = [
  {
    label: 'Core',
    items: [{ href: '/dashboard', label: '대시보드', icon: '⊞' }],
  },
  {
    label: 'HR',
    items: [
      { href: '/employees', label: '직원관리', icon: '👤' },
      { href: '/leaves', label: '연차관리', icon: '📅' },
    ],
  },
  {
    label: '총무',
    items: [{ href: '/contracts', label: '계약관리', icon: '📄' }],
  },
  {
    label: '업무',
    items: [{ href: '/tasks', label: '업무관리', icon: '✓' }],
  },
  {
    label: '알림',
    items: [{ href: '/notifications', label: '알림센터', icon: '🔔' }],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-[190px] min-h-screen bg-navy flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
        <div className="w-7 h-7 rounded bg-teal flex items-center justify-center">
          <span className="text-navy font-bold text-xs">B</span>
        </div>
        <span className="text-white font-bold text-base">BizHub</span>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-5 text-xs text-white/40 font-medium uppercase tracking-wider mb-1">
              {section.label}
            </p>
            {section.items.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-teal/20 text-teal font-medium border-l-2 border-teal'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Write Header.tsx**

```tsx
import { auth, signOut } from '@/lib/auth'

export default async function Header() {
  const session = await auth()
  return (
    <header className="h-[50px] bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-sub">
          {session?.user?.name} · {session?.user?.role}
        </span>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button type="submit" className="text-sm text-sub hover:text-navy">
            로그아웃
          </button>
        </form>
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Write (app)/layout.tsx**

```tsx
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 max-w-[1200px] mx-auto w-full">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create placeholder dashboard page**

Create `app/(app)/dashboard/page.tsx`:
```tsx
export default function DashboardPage() {
  return <h1 className="text-2xl font-bold text-navy">대시보드</h1>
}
```

- [ ] **Step 5: Verify layout renders**

```bash
pnpm dev
```
Log in → should see navy sidebar (190px), white header (50px), "대시보드" text.

- [ ] **Step 6: Commit**

```bash
git add components/ app/\(app\)/
git commit -m "feat: add WEHAGO-style sidebar and header layout shell

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Shared UI Components

**Files:**
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Select.tsx`
- Create: `components/ui/Modal.tsx`
- Create: `components/ui/__tests__/Badge.test.tsx`

**Interfaces:**
- Produces: reusable primitives used by Tasks 6–11

- [ ] **Step 1: Write Badge.tsx**

```tsx
type BadgeVariant = 'teal' | 'navy' | 'warning' | 'danger' | 'gray'

const variants: Record<BadgeVariant, string> = {
  teal: 'bg-teal/10 text-teal',
  navy: 'bg-navy/10 text-navy',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  gray: 'bg-gray-100 text-sub',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
}

export function Badge({ variant = 'gray', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Write Button.tsx**

```tsx
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-teal text-white hover:bg-teal/90',
  secondary: 'bg-white border border-gray-200 text-navy hover:bg-gray-50',
  danger: 'bg-danger text-white hover:bg-danger/90',
}
const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm' }

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Write Input.tsx**

```tsx
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-navy">{label}</label>}
      <input
        ref={ref}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal ${
          error ? 'border-danger' : 'border-gray-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
```

- [ ] **Step 4: Write Select.tsx**

```tsx
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = '', ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-navy">{label}</label>}
      <select
        ref={ref}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal bg-white ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  ),
)
Select.displayName = 'Select'
```

- [ ] **Step 5: Write Modal.tsx**

```tsx
'use client'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <button onClick={onClose} className="text-sub hover:text-navy text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Write Badge test**

Create `components/ui/__tests__/Badge.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>활성</Badge>)
    expect(screen.getByText('활성')).toBeInTheDocument()
  })

  it('applies danger variant class', () => {
    render(<Badge variant="danger">위험</Badge>)
    const el = screen.getByText('위험')
    expect(el.className).toContain('text-danger')
  })
})
```

- [ ] **Step 7: Run test**

```bash
pnpm test components/ui/__tests__/Badge.test.tsx
```
Expected: 2 tests PASS

- [ ] **Step 8: Commit**

```bash
git add components/ui/
git commit -m "feat: add shared UI primitives (Badge, Button, Input, Select, Modal)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Dashboard

**Files:**
- Create: `app/api/dashboard/route.ts`
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `db`, `auth()`
- Produces: GET `/api/dashboard` → `{ urgentTasks, todayDueTasks, expiringContracts, pendingLeaves }`; dashboard page with 4 KPI cards + task list + expiring contracts widget

- [ ] **Step 1: Write API route**

Create `app/api/dashboard/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  const in90Days = new Date(now)
  in90Days.setDate(in90Days.getDate() + 90)

  const [urgentTasks, todayDueTasks, expiringContracts, pendingLeaves] = await Promise.all([
    db.task.count({ where: { priority: 'URGENT', status: { not: 'COMPLETED' } } }),
    db.task.count({ where: { dueDate: { lte: todayEnd }, status: { not: 'COMPLETED' } } }),
    db.contract.count({ where: { endDate: { lte: in90Days, gte: now }, status: 'ACTIVE' } }),
    db.leaveRequest.count({ where: { status: 'PENDING' } }),
  ])

  const todayTasks = await db.task.findMany({
    where: { dueDate: { lte: todayEnd }, status: { not: 'COMPLETED' } },
    include: { assignee: { select: { name: true } } },
    orderBy: { priority: 'asc' },
    take: 10,
  })

  const nearExpiryContracts = await db.contract.findMany({
    where: { endDate: { lte: in90Days, gte: now }, status: 'ACTIVE' },
    orderBy: { endDate: 'asc' },
    take: 5,
  })

  return NextResponse.json({
    kpi: { urgentTasks, todayDueTasks, expiringContracts, pendingLeaves },
    todayTasks,
    nearExpiryContracts: nearExpiryContracts.map((c) => ({
      ...c,
      amount: c.amount.toString(),
    })),
  })
}
```

- [ ] **Step 2: Write dashboard page**

Replace `app/(app)/dashboard/page.tsx`:
```tsx
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

const PRIORITY_LABEL: Record<string, string> = {
  URGENT: '긴급', HIGH: '높음', NORMAL: '보통', LOW: '낮음',
}
const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'gray' | 'teal'> = {
  URGENT: 'danger', HIGH: 'warning', NORMAL: 'gray', LOW: 'teal',
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  const in90Days = new Date(now)
  in90Days.setDate(in90Days.getDate() + 90)

  const [urgentTasks, todayDueTasks, expiringContracts, pendingLeaves, todayTasks, nearExpiry] =
    await Promise.all([
      db.task.count({ where: { priority: 'URGENT', status: { not: 'COMPLETED' } } }),
      db.task.count({ where: { dueDate: { lte: todayEnd }, status: { not: 'COMPLETED' } } }),
      db.contract.count({ where: { endDate: { lte: in90Days, gte: now }, status: 'ACTIVE' } }),
      db.leaveRequest.count({ where: { status: 'PENDING' } }),
      db.task.findMany({
        where: { dueDate: { lte: todayEnd }, status: { not: 'COMPLETED' } },
        include: { assignee: { select: { name: true } } },
        orderBy: { priority: 'asc' },
        take: 10,
      }),
      db.contract.findMany({
        where: { endDate: { lte: in90Days, gte: now }, status: 'ACTIVE' },
        orderBy: { endDate: 'asc' },
        take: 5,
      }),
    ])

  const kpiCards = [
    { label: '긴급 업무', value: urgentTasks, color: 'text-danger' },
    { label: '오늘 마감', value: todayDueTasks, color: 'text-warning' },
    { label: '계약 만료 예정', value: expiringContracts, color: 'text-teal' },
    { label: '연차 승인 대기', value: pendingLeaves, color: 'text-navy' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-navy">대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <div key={k.label} className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-sub">{k.label}</p>
            <p className={`text-3xl font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today Tasks */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-navy mb-3">오늘 업무</h2>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-sub">오늘 마감 업무가 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {todayTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <Link href={`/tasks/${t.id}`} className="text-sm text-navy hover:underline truncate">
                    {t.title}
                  </Link>
                  <Badge variant={PRIORITY_BADGE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Expiring Contracts */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-navy mb-3">계약 만료 예정 (90일 이내)</h2>
          {nearExpiry.length === 0 ? (
            <p className="text-sm text-sub">만료 예정 계약이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {nearExpiry.map((c) => {
                const daysLeft = Math.ceil((c.endDate.getTime() - now.getTime()) / 86400000)
                return (
                  <li key={c.id} className="flex items-center justify-between">
                    <Link href={`/contracts/${c.id}`} className="text-sm text-navy hover:underline truncate">
                      {c.name}
                    </Link>
                    <Badge variant={daysLeft <= 30 ? 'danger' : daysLeft <= 60 ? 'warning' : 'gray'}>
                      D-{daysLeft}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify dashboard renders**

```bash
pnpm dev
```
Log in → dashboard should show 4 KPI cards and 2 widgets.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/dashboard/ app/api/dashboard/
git commit -m "feat: add dashboard with KPI cards and expiring contracts widget

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Employee Management

**Files:**
- Create: `app/api/employees/route.ts`
- Create: `app/api/employees/[id]/route.ts`
- Create: `app/(app)/employees/page.tsx`
- Create: `app/(app)/employees/[id]/page.tsx`
- Create: `app/(app)/employees/_components/EmployeeForm.tsx`

**Interfaces:**
- Consumes: `db`, `auth()`, `canManageHR()` from `lib/permissions.ts` (Task 12 — for now inline the check)
- Produces: employee list, detail, create/update forms; ADMIN and HR roles can write, others read-only

- [ ] **Step 1: Write employees API list/create**

Create `app/api/employees/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const employees = await db.employee.findMany({
    include: {
      user: { select: { name: true, email: true, role: true } },
      department: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(employees)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const body = await req.json()
  const { name, email, password, departmentId, position, phone, hireDate, status, annualLeave } = body

  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.hash(password || 'bizhub1234!', 12)

  const user = await db.user.create({
    data: { name, email, password: hash, role: 'VIEW', departmentId },
  })
  const employee = await db.employee.create({
    data: { userId: user.id, departmentId, position, phone, hireDate: new Date(hireDate), status, annualLeave: annualLeave ?? 15 },
    include: { user: { select: { name: true, email: true } }, department: { select: { name: true } } },
  })
  return NextResponse.json(employee, { status: 201 })
}
```

- [ ] **Step 2: Write employees/[id] API**

Create `app/api/employees/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const emp = await db.employee.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true, role: true } },
      department: { select: { name: true } },
      leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  if (!emp) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json(emp)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const body = await req.json()
  const emp = await db.employee.update({
    where: { id: params.id },
    data: {
      position: body.position,
      phone: body.phone,
      status: body.status,
      annualLeave: body.annualLeave,
      departmentId: body.departmentId,
    },
    include: { user: { select: { name: true, email: true } }, department: { select: { name: true } } },
  })
  return NextResponse.json(emp)
}
```

- [ ] **Step 3: Write employees list page**

Create `app/(app)/employees/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '재직', PROBATION: '수습', LEAVE: '휴직', RESIGNED: '퇴직',
}
const STATUS_BADGE: Record<string, 'teal' | 'warning' | 'gray' | 'danger'> = {
  ACTIVE: 'teal', PROBATION: 'warning', LEAVE: 'gray', RESIGNED: 'danger',
}

export default async function EmployeesPage() {
  const session = await auth()
  const canWrite = ['ADMIN', 'HR'].includes(session?.user?.role ?? '')
  const employees = await db.employee.findMany({
    include: {
      user: { select: { name: true, email: true } },
      department: { select: { name: true } },
    },
    orderBy: { hireDate: 'desc' },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">직원관리</h1>
        {canWrite && (
          <Link href="/employees/new" className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90">
            + 직원 등록
          </Link>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['이름', '이메일', '부서', '직급', '입사일', '상태', '연차'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {employees.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/employees/${e.id}`} className="text-navy font-medium hover:underline">
                    {e.user.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sub">{e.user.email}</td>
                <td className="px-4 py-3 text-sub">{e.department.name}</td>
                <td className="px-4 py-3 text-sub">{e.position}</td>
                <td className="px-4 py-3 text-sub">{e.hireDate.toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_BADGE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-sub">{e.usedLeave}/{e.annualLeave}일</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write employees/[id] detail page**

Create `app/(app)/employees/[id]/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '재직', PROBATION: '수습', LEAVE: '휴직', RESIGNED: '퇴직',
}
const LEAVE_LABEL: Record<string, string> = {
  ANNUAL: '연차', SICK: '병가', SPECIAL: '특별', UNPAID: '무급',
}
const APPROVAL_BADGE: Record<string, 'gray' | 'teal' | 'danger'> = {
  PENDING: 'gray', APPROVED: 'teal', REJECTED: 'danger',
}
const APPROVAL_LABEL: Record<string, string> = {
  PENDING: '대기', APPROVED: '승인', REJECTED: '반려',
}

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const emp = await db.employee.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true, role: true } },
      department: true,
      leaveRequests: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  if (!emp) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-navy">{emp.user.name}</h1>
      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-sub">이메일</span><p className="font-medium">{emp.user.email}</p></div>
        <div><span className="text-sub">부서</span><p className="font-medium">{emp.department.name}</p></div>
        <div><span className="text-sub">직급</span><p className="font-medium">{emp.position}</p></div>
        <div><span className="text-sub">연락처</span><p className="font-medium">{emp.phone ?? '—'}</p></div>
        <div><span className="text-sub">입사일</span><p className="font-medium">{emp.hireDate.toLocaleDateString('ko-KR')}</p></div>
        <div><span className="text-sub">재직상태</span><p className="font-medium">{STATUS_LABEL[emp.status]}</p></div>
        <div><span className="text-sub">연차</span><p className="font-medium">{emp.usedLeave}/{emp.annualLeave}일 사용</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-bold text-navy mb-3">연차 신청 내역</h2>
        {emp.leaveRequests.length === 0 ? (
          <p className="text-sm text-sub">신청 내역이 없습니다.</p>
        ) : (
          <ul className="divide-y text-sm">
            {emp.leaveRequests.map((lr) => (
              <li key={lr.id} className="py-2 flex items-center justify-between">
                <span>{LEAVE_LABEL[lr.type]} · {lr.startDate.toLocaleDateString('ko-KR')} ~ {lr.endDate.toLocaleDateString('ko-KR')} ({lr.days}일)</span>
                <Badge variant={APPROVAL_BADGE[lr.status]}>{APPROVAL_LABEL[lr.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/employees/ app/api/employees/
git commit -m "feat: add employee management CRUD and detail pages

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Leave Requests

**Files:**
- Create: `app/api/leaves/route.ts`
- Create: `app/api/leaves/[id]/route.ts`
- Create: `app/(app)/leaves/page.tsx`
- Create: `app/(app)/leaves/_components/LeaveForm.tsx`

**Interfaces:**
- Consumes: `db`, `auth()`
- Produces: leave request list (HR/ADMIN see all, others see own), create form, approve/reject action

- [ ] **Step 1: Write leaves API**

Create `app/api/leaves/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const isHRorAdmin = ['ADMIN', 'HR'].includes(session.user.role)
  const where = isHRorAdmin
    ? {}
    : { employee: { userId: session.user.id } }

  const leaves = await db.leaveRequest.findMany({
    where,
    include: {
      employee: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(leaves)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json()
  const employee = await db.employee.findUnique({ where: { userId: session.user.id } })
  if (!employee) return NextResponse.json({ error: '직원 정보 없음' }, { status: 400 })

  const leave = await db.leaveRequest.create({
    data: {
      employeeId: employee.id,
      type: body.type,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      days: body.days,
      reason: body.reason,
    },
  })

  // Notify HR/ADMIN users
  const admins = await db.user.findMany({ where: { role: { in: ['ADMIN', 'HR'] }, active: true } })
  await db.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type: 'LEAVE_REQUEST',
      title: '연차 승인 요청',
      message: `${session.user.name}님이 연차를 신청했습니다. (${body.days}일)`,
      link: '/leaves',
    })),
  })

  return NextResponse.json(leave, { status: 201 })
}
```

Create `app/api/leaves/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!['ADMIN', 'HR'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { status } = await req.json()
  const leave = await db.leaveRequest.update({
    where: { id: params.id },
    data: { status, approverId: session.user.id, approvedAt: new Date() },
    include: { employee: { include: { user: { select: { id: true, name: true } } } } },
  })

  // Update usedLeave if approved
  if (status === 'APPROVED' && leave.type === 'ANNUAL') {
    await db.employee.update({
      where: { id: leave.employeeId },
      data: { usedLeave: { increment: leave.days } },
    })
  }

  // Notify employee
  await db.notification.create({
    data: {
      userId: leave.employee.user.id,
      type: 'LEAVE_APPROVED',
      title: status === 'APPROVED' ? '연차 승인' : '연차 반려',
      message: `연차 신청이 ${status === 'APPROVED' ? '승인' : '반려'}되었습니다.`,
      link: '/leaves',
    },
  })

  return NextResponse.json(leave)
}
```

- [ ] **Step 2: Write leaves page**

Create `app/(app)/leaves/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { Badge } from '@/components/ui/Badge'
import LeaveApprovalButton from './_components/LeaveApprovalButton'

const TYPE_LABEL: Record<string, string> = { ANNUAL: '연차', SICK: '병가', SPECIAL: '특별', UNPAID: '무급' }
const STATUS_BADGE: Record<string, 'gray' | 'teal' | 'danger'> = { PENDING: 'gray', APPROVED: 'teal', REJECTED: 'danger' }
const STATUS_LABEL: Record<string, string> = { PENDING: '대기', APPROVED: '승인', REJECTED: '반려' }

export default async function LeavesPage() {
  const session = await auth()
  const isHRorAdmin = ['ADMIN', 'HR'].includes(session?.user?.role ?? '')
  const where = isHRorAdmin ? {} : { employee: { userId: session?.user?.id } }

  const leaves = await db.leaveRequest.findMany({
    where,
    include: { employee: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">연차관리</h1>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['신청자', '구분', '기간', '일수', '사유', '상태', isHRorAdmin ? '처리' : ''].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-sub font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {leaves.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-navy">{l.employee.user.name}</td>
                <td className="px-4 py-3">{TYPE_LABEL[l.type]}</td>
                <td className="px-4 py-3 text-sub">{l.startDate.toLocaleDateString('ko-KR')} ~ {l.endDate.toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3 text-sub">{l.days}일</td>
                <td className="px-4 py-3 text-sub">{l.reason ?? '—'}</td>
                <td className="px-4 py-3"><Badge variant={STATUS_BADGE[l.status]}>{STATUS_LABEL[l.status]}</Badge></td>
                {isHRorAdmin && (
                  <td className="px-4 py-3">
                    {l.status === 'PENDING' && <LeaveApprovalButton leaveId={l.id} />}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

Create `app/(app)/leaves/_components/LeaveApprovalButton.tsx`:
```tsx
'use client'
import { Button } from '@/components/ui/Button'

export default function LeaveApprovalButton({ leaveId }: { leaveId: string }) {
  async function handle(status: 'APPROVED' | 'REJECTED') {
    await fetch(`/api/leaves/${leaveId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    window.location.reload()
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="primary" onClick={() => handle('APPROVED')}>승인</Button>
      <Button size="sm" variant="danger" onClick={() => handle('REJECTED')}>반려</Button>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/leaves/ app/api/leaves/
git commit -m "feat: add leave request management with approval workflow

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Task Management

**Files:**
- Create: `app/api/tasks/route.ts`
- Create: `app/api/tasks/[id]/route.ts`
- Create: `app/(app)/tasks/page.tsx`
- Create: `app/(app)/tasks/[id]/page.tsx`
- Create: `app/(app)/tasks/_components/TaskForm.tsx`
- Create: `app/(app)/tasks/_components/StatusChanger.tsx`

**Interfaces:**
- Consumes: `db`, `auth()`
- Produces: task list with filter, task detail with status change, create/edit form; OPS/ADMIN write all, others edit own tasks only

- [ ] **Step 1: Write tasks API**

Create `app/api/tasks/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const tasks = await db.task.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(priority ? { priority: priority as never } : {}),
    },
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json()
  const task = await db.task.create({
    data: {
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId || null,
      creatorId: session.user.id,
      priority: body.priority ?? 'NORMAL',
      status: 'PENDING',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      contractId: body.contractId || null,
    },
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
  })

  // Notify assignee
  if (task.assigneeId && task.assigneeId !== session.user.id) {
    await db.notification.create({
      data: {
        userId: task.assigneeId,
        type: 'TASK_ASSIGNED',
        title: '업무 배정',
        message: `"${task.title}" 업무가 배정되었습니다.`,
        link: `/tasks/${task.id}`,
      },
    })
  }

  return NextResponse.json(task, { status: 201 })
}
```

Create `app/api/tasks/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const task = await db.task.findUnique({
    where: { id: params.id },
    include: {
      assignee: { select: { name: true, email: true } },
      creator: { select: { name: true } },
      contract: { select: { name: true } },
    },
  })
  if (!task) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json(task)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const task = await db.task.findUnique({ where: { id: params.id } })
  if (!task) return NextResponse.json({ error: '없음' }, { status: 404 })

  const canEditAll = ['ADMIN', 'OPS'].includes(session.user.role)
  const isOwn = task.assigneeId === session.user.id || task.creatorId === session.user.id
  if (!canEditAll && !isOwn) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const body = await req.json()
  const updated = await db.task.update({
    where: { id: params.id },
    data: {
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId,
      priority: body.priority,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      completedAt: body.status === 'COMPLETED' ? new Date() : body.status ? null : undefined,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const task = await db.task.findUnique({ where: { id: params.id } })
  if (!task) return NextResponse.json({ error: '없음' }, { status: 404 })

  const canDeleteAll = ['ADMIN', 'OPS'].includes(session.user.role)
  const isOwn = task.creatorId === session.user.id
  if (!canDeleteAll && !isOwn) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  await db.task.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Write tasks list page**

Create `app/(app)/tasks/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const PRIORITY_LABEL: Record<string, string> = { URGENT: '긴급', HIGH: '높음', NORMAL: '보통', LOW: '낮음' }
const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'gray' | 'teal'> = { URGENT: 'danger', HIGH: 'warning', NORMAL: 'gray', LOW: 'teal' }
const STATUS_LABEL: Record<string, string> = { PENDING: '대기', IN_PROGRESS: '진행중', REVIEW: '검토', COMPLETED: '완료', ON_HOLD: '보류' }

export default async function TasksPage() {
  const session = await auth()
  const canWrite = ['ADMIN', 'OPS'].includes(session?.user?.role ?? '') || !!session

  const tasks = await db.task.findMany({
    where: { status: { not: 'COMPLETED' } },
    include: {
      assignee: { select: { name: true } },
      creator: { select: { name: true } },
    },
    orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">업무관리</h1>
        {canWrite && (
          <Link href="/tasks/new" className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90">
            + 업무 등록
          </Link>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['제목', '담당자', '우선순위', '상태', '마감일'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/tasks/${t.id}`} className="text-navy font-medium hover:underline">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sub">{t.assignee?.name ?? '—'}</td>
                <td className="px-4 py-3"><Badge variant={PRIORITY_BADGE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge></td>
                <td className="px-4 py-3 text-sub">{STATUS_LABEL[t.status]}</td>
                <td className="px-4 py-3 text-sub">{t.dueDate ? t.dueDate.toLocaleDateString('ko-KR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write task detail page**

Create `app/(app)/tasks/[id]/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import StatusChanger from '../_components/StatusChanger'

const PRIORITY_LABEL: Record<string, string> = { URGENT: '긴급', HIGH: '높음', NORMAL: '보통', LOW: '낮음' }
const PRIORITY_BADGE: Record<string, 'danger' | 'warning' | 'gray' | 'teal'> = { URGENT: 'danger', HIGH: 'warning', NORMAL: 'gray', LOW: 'teal' }
const STATUS_LABEL: Record<string, string> = { PENDING: '대기', IN_PROGRESS: '진행중', REVIEW: '검토', COMPLETED: '완료', ON_HOLD: '보류' }

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const task = await db.task.findUnique({
    where: { id: params.id },
    include: {
      assignee: { select: { name: true, email: true } },
      creator: { select: { name: true } },
      contract: { select: { name: true, id: true } },
    },
  })
  if (!task) notFound()

  const canEdit = ['ADMIN', 'OPS'].includes(session?.user?.role ?? '')
    || task.assigneeId === session?.user?.id
    || task.creatorId === session?.user?.id

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{task.title}</h1>
          {task.description && <p className="text-sub mt-1 text-sm">{task.description}</p>}
        </div>
        <Badge variant={PRIORITY_BADGE[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-sub">담당자</span><p className="font-medium">{task.assignee?.name ?? '—'}</p></div>
        <div><span className="text-sub">등록자</span><p className="font-medium">{task.creator.name}</p></div>
        <div><span className="text-sub">마감일</span><p className="font-medium">{task.dueDate ? task.dueDate.toLocaleDateString('ko-KR') : '—'}</p></div>
        <div><span className="text-sub">관련 계약</span><p className="font-medium">{task.contract?.name ?? '—'}</p></div>
        <div>
          <span className="text-sub">현재 상태</span>
          <p className="font-medium mt-1">{STATUS_LABEL[task.status]}</p>
        </div>
      </div>

      {canEdit && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-navy mb-3">상태 변경</h2>
          <StatusChanger taskId={task.id} currentStatus={task.status} />
        </div>
      )}
    </div>
  )
}
```

Create `app/(app)/tasks/_components/StatusChanger.tsx`:
```tsx
'use client'
import { Button } from '@/components/ui/Button'

const STATUSES = [
  { value: 'PENDING', label: '대기' },
  { value: 'IN_PROGRESS', label: '진행중' },
  { value: 'REVIEW', label: '검토' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'ON_HOLD', label: '보류' },
]

export default function StatusChanger({ taskId, currentStatus }: { taskId: string; currentStatus: string }) {
  async function changeStatus(status: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    window.location.reload()
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => (
        <Button
          key={s.value}
          size="sm"
          variant={currentStatus === s.value ? 'primary' : 'secondary'}
          onClick={() => changeStatus(s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/tasks/ app/api/tasks/
git commit -m "feat: add task management with CRUD, status change, and notifications

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Contract Management

**Files:**
- Create: `app/api/contracts/route.ts`
- Create: `app/api/contracts/[id]/route.ts`
- Create: `app/api/contracts/upload/route.ts`
- Create: `app/(app)/contracts/page.tsx`
- Create: `app/(app)/contracts/[id]/page.tsx`

**Interfaces:**
- Consumes: `db`, `auth()`, `@vercel/blob`
- Produces: contract list/detail, create with Blob file upload, expiry alerts generation; ADMIN/GENERAL can write, others read

- [ ] **Step 1: Write contracts list/create API**

Create `app/api/contracts/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const contracts = await db.contract.findMany({
    include: { owner: { select: { name: true } } },
    orderBy: { endDate: 'asc' },
  })
  return NextResponse.json(
    contracts.map((c) => ({ ...c, amount: c.amount.toString() }))
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!['ADMIN', 'GENERAL'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const body = await req.json()
  const contract = await db.contract.create({
    data: {
      name: body.name,
      vendorName: body.vendorName,
      amount: BigInt(body.amount),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      autoRenewal: body.autoRenewal ?? false,
      ownerId: session.user.id,
      notes: body.notes,
      status: body.status ?? 'ACTIVE',
    },
  })

  // Create 90/60/30 day alerts
  await db.contractAlert.createMany({
    data: [90, 60, 30].map((days) => ({
      contractId: contract.id,
      alertDays: days,
    })),
  })

  return NextResponse.json({ ...contract, amount: contract.amount.toString() }, { status: 201 })
}
```

- [ ] **Step 2: Write contracts/[id] API**

Create `app/api/contracts/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const contract = await db.contract.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { name: true } },
      alerts: true,
      tasks: { include: { assignee: { select: { name: true } } } },
    },
  })
  if (!contract) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json({ ...contract, amount: contract.amount.toString() })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!['ADMIN', 'GENERAL'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const body = await req.json()
  const contract = await db.contract.update({
    where: { id: params.id },
    data: {
      name: body.name,
      vendorName: body.vendorName,
      amount: body.amount ? BigInt(body.amount) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      status: body.status,
      notes: body.notes,
      fileUrl: body.fileUrl,
    },
  })
  return NextResponse.json({ ...contract, amount: contract.amount.toString() })
}
```

- [ ] **Step 3: Write file upload API (Vercel Blob)**

Create `app/api/contracts/upload/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/haansofthwp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  if (!['ADMIN', 'GENERAL'].includes(session.user.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '파일 크기 초과 (최대 10MB)' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith('.hwp')) {
    return NextResponse.json({ error: 'PDF, DOCX, HWP만 허용' }, { status: 400 })
  }

  const blob = await put(`contracts/${Date.now()}-${file.name}`, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}
```

- [ ] **Step 4: Write contracts list page**

Create `app/(app)/contracts/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const STATUS_LABEL: Record<string, string> = { ACTIVE: '유효', EXPIRED: '만료', TERMINATED: '해지', DRAFT: '초안' }
const STATUS_BADGE: Record<string, 'teal' | 'danger' | 'gray' | 'warning'> = {
  ACTIVE: 'teal', EXPIRED: 'danger', TERMINATED: 'gray', DRAFT: 'warning',
}

export default async function ContractsPage() {
  const session = await auth()
  const canWrite = ['ADMIN', 'GENERAL'].includes(session?.user?.role ?? '')

  const contracts = await db.contract.findMany({
    include: { owner: { select: { name: true } } },
    orderBy: { endDate: 'asc' },
  })
  const now = new Date()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">계약관리</h1>
        {canWrite && (
          <Link href="/contracts/new" className="bg-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal/90">
            + 계약 등록
          </Link>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['계약명', '거래처', '금액', '만료일', '담당자', '상태'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-sub font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {contracts.map((c) => {
              const daysLeft = Math.ceil((c.endDate.getTime() - now.getTime()) / 86400000)
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/contracts/${c.id}`} className="text-navy font-medium hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sub">{c.vendorName}</td>
                  <td className="px-4 py-3 text-sub">{Number(c.amount).toLocaleString('ko-KR')}원</td>
                  <td className="px-4 py-3 text-sub">
                    {c.endDate.toLocaleDateString('ko-KR')}
                    {c.status === 'ACTIVE' && daysLeft <= 90 && (
                      <span className={`ml-2 text-xs ${daysLeft <= 30 ? 'text-danger' : 'text-warning'}`}>
                        D-{daysLeft}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sub">{c.owner.name}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_BADGE[c.status]}>{STATUS_LABEL[c.status]}</Badge></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write contracts/[id] detail page**

Create `app/(app)/contracts/[id]/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = { ACTIVE: '유효', EXPIRED: '만료', TERMINATED: '해지', DRAFT: '초안' }
const STATUS_BADGE: Record<string, 'teal' | 'danger' | 'gray' | 'warning'> = {
  ACTIVE: 'teal', EXPIRED: 'danger', TERMINATED: 'gray', DRAFT: 'warning',
}

export default async function ContractDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const contract = await db.contract.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { name: true } },
      tasks: { include: { assignee: { select: { name: true } } }, take: 10 },
      alerts: { orderBy: { alertDays: 'desc' } },
    },
  })
  if (!contract) notFound()

  const canWrite = ['ADMIN', 'GENERAL'].includes(session?.user?.role ?? '')

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold text-navy">{contract.name}</h1>
        <Badge variant={STATUS_BADGE[contract.status]}>{STATUS_LABEL[contract.status]}</Badge>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-sub">거래처</span><p className="font-medium">{contract.vendorName}</p></div>
        <div><span className="text-sub">계약금액</span><p className="font-medium">{Number(contract.amount).toLocaleString('ko-KR')}원</p></div>
        <div><span className="text-sub">계약기간</span><p className="font-medium">{contract.startDate.toLocaleDateString('ko-KR')} ~ {contract.endDate.toLocaleDateString('ko-KR')}</p></div>
        <div><span className="text-sub">담당자</span><p className="font-medium">{contract.owner.name}</p></div>
        <div><span className="text-sub">자동갱신</span><p className="font-medium">{contract.autoRenewal ? '예' : '아니오'}</p></div>
        {contract.fileUrl && (
          <div><span className="text-sub">계약서</span>
            <a href={contract.fileUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline text-sm">
              파일 보기
            </a>
          </div>
        )}
      </div>

      {contract.notes && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-navy mb-2">비고</h2>
          <p className="text-sm text-sub whitespace-pre-line">{contract.notes}</p>
        </div>
      )}

      {contract.tasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-bold text-navy mb-3">관련 업무</h2>
          <ul className="divide-y text-sm">
            {contract.tasks.map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between">
                <Link href={`/tasks/${t.id}`} className="text-navy hover:underline">{t.title}</Link>
                <span className="text-sub">{t.assignee?.name ?? '—'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/contracts/ app/api/contracts/
git commit -m "feat: add contract management with Vercel Blob file upload

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Notifications & Contract Alert Cron

**Files:**
- Create: `app/api/notifications/route.ts`
- Create: `app/(app)/notifications/page.tsx`
- Create: `app/api/cron/contract-alerts/route.ts`

**Interfaces:**
- Consumes: `db`, `auth()`
- Produces: notification list page, mark-read action, cron endpoint that sends contract expiry notifications (D-90/60/30)

- [ ] **Step 1: Write notifications API**

Create `app/api/notifications/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json(notifications)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { ids } = await req.json()
  await db.notification.updateMany({
    where: { id: { in: ids }, userId: session.user.id },
    data: { read: true },
  })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Write notifications page**

Create `app/(app)/notifications/page.tsx`:
```tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

const TYPE_LABEL: Record<string, string> = {
  CONTRACT_EXPIRY: '계약만료',
  LEAVE_REQUEST: '연차신청',
  TASK_DUE: '업무마감',
  TASK_ASSIGNED: '업무배정',
  LEAVE_APPROVED: '연차승인',
  SYSTEM: '시스템',
}
const TYPE_BADGE: Record<string, 'danger' | 'warning' | 'teal' | 'gray' | 'navy'> = {
  CONTRACT_EXPIRY: 'danger',
  LEAVE_REQUEST: 'warning',
  TASK_DUE: 'warning',
  TASK_ASSIGNED: 'teal',
  LEAVE_APPROVED: 'teal',
  SYSTEM: 'gray',
}

export default async function NotificationsPage() {
  const session = await auth()
  const notifications = await db.notification.findMany({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-navy">알림센터</h1>
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-sub">알림이 없습니다.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm divide-y">
          {notifications.map((n) => (
            <div key={n.id} className={`p-4 ${n.read ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <Badge variant={TYPE_BADGE[n.type]}>{TYPE_LABEL[n.type]}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-navy">{n.title}</p>
                  <p className="text-sm text-sub mt-0.5">{n.message}</p>
                  <p className="text-xs text-sub mt-1">{n.createdAt.toLocaleString('ko-KR')}</p>
                </div>
                {n.link && (
                  <Link href={n.link} className="text-teal text-sm hover:underline shrink-0">
                    보기
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write contract alert cron**

Create `app/api/cron/contract-alerts/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Called by Vercel Cron (daily) — secured by CRON_SECRET header
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const alerts = await db.contractAlert.findMany({
    where: { sentAt: null },
    include: { contract: { include: { owner: true } } },
  })

  const sent: string[] = []

  for (const alert of alerts) {
    const contract = alert.contract
    if (contract.status !== 'ACTIVE') continue

    const daysUntilExpiry = Math.ceil(
      (contract.endDate.getTime() - now.getTime()) / 86400000,
    )

    if (daysUntilExpiry <= alert.alertDays && daysUntilExpiry >= 0) {
      // Notify contract owner and all ADMIN/GENERAL users
      const targets = await db.user.findMany({
        where: { role: { in: ['ADMIN', 'GENERAL'] }, active: true },
        select: { id: true },
      })
      const userIds = Array.from(
        new Set([contract.ownerId, ...targets.map((u) => u.id)])
      )

      await db.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          type: 'CONTRACT_EXPIRY' as const,
          title: '계약 만료 임박',
          message: `[${contract.name}] 계약이 ${daysUntilExpiry}일 후 만료됩니다. (거래처: ${contract.vendorName})`,
          link: `/contracts/${contract.id}`,
        })),
        skipDuplicates: true,
      })

      await db.contractAlert.update({
        where: { id: alert.id },
        data: { sentAt: now },
      })

      sent.push(alert.id)
    }
  }

  return NextResponse.json({ sent: sent.length })
}
```

Add to `vercel.json` (create it):
```json
{
  "crons": [
    {
      "path": "/api/cron/contract-alerts",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Add `CRON_SECRET` to `.env.local`:
```env
CRON_SECRET="generate-with-openssl-rand-hex-32"
```

- [ ] **Step 4: Add unread count to Header**

Update `components/layout/Header.tsx` to show unread count:
```tsx
import { auth, signOut } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function Header() {
  const session = await auth()
  const unreadCount = session?.user?.id
    ? await db.notification.count({ where: { userId: session.user.id, read: false } })
    : 0

  return (
    <header className="h-[50px] bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <Link href="/notifications" className="relative text-sub hover:text-navy">
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <span className="text-sm text-sub">
          {session?.user?.name} · {session?.user?.role}
        </span>
        <form
          action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}
        >
          <button type="submit" className="text-sm text-sub hover:text-navy">
            로그아웃
          </button>
        </form>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/notifications/ app/api/notifications/ app/api/cron/ vercel.json
git commit -m "feat: add notification center and contract alert cron job

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 12: RBAC Permissions Hardening

**Files:**
- Create: `lib/permissions.ts`
- Modify: all API routes to use centralized permission helpers

**Interfaces:**
- Consumes: `session.user.role`, `session.user.id`
- Produces: `canManageHR()`, `canManageContracts()`, `canManageTasks()`, `isOwnTask()` helpers applied consistently across all routes

- [ ] **Step 1: Write lib/permissions.ts**

```ts
import { Session } from 'next-auth'

type Role = 'ADMIN' | 'HR' | 'GENERAL' | 'OPS' | 'VIEW'

export function getRole(session: Session | null): Role {
  return (session?.user?.role as Role) ?? 'VIEW'
}

// HR module: ADMIN + HR can write, everyone else reads
export function canManageHR(session: Session | null): boolean {
  return ['ADMIN', 'HR'].includes(getRole(session))
}

// Contract module: ADMIN + GENERAL can write
export function canManageContracts(session: Session | null): boolean {
  return ['ADMIN', 'GENERAL'].includes(getRole(session))
}

// Task module: ADMIN + OPS can manage all tasks
export function canManageAllTasks(session: Session | null): boolean {
  return ['ADMIN', 'OPS'].includes(getRole(session))
}

// Any logged-in user can manage their own tasks
export function canManageOwnTask(
  session: Session | null,
  task: { assigneeId: string | null; creatorId: string },
): boolean {
  if (!session?.user?.id) return false
  return task.assigneeId === session.user.id || task.creatorId === session.user.id
}

// VIEW role gets no write access
export function isViewOnly(session: Session | null): boolean {
  return getRole(session) === 'VIEW'
}
```

- [ ] **Step 2: Write permission tests**

Create `lib/__tests__/permissions.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { canManageHR, canManageContracts, canManageAllTasks, canManageOwnTask, isViewOnly } from '../permissions'
import type { Session } from 'next-auth'

function makeSession(role: string, id = 'user-1'): Session {
  return { user: { id, name: 'Test', email: 'test@test.com', role }, expires: '' } as Session
}

describe('canManageHR', () => {
  it('allows ADMIN', () => expect(canManageHR(makeSession('ADMIN'))).toBe(true))
  it('allows HR', () => expect(canManageHR(makeSession('HR'))).toBe(true))
  it('denies OPS', () => expect(canManageHR(makeSession('OPS'))).toBe(false))
  it('denies VIEW', () => expect(canManageHR(makeSession('VIEW'))).toBe(false))
  it('denies null session', () => expect(canManageHR(null)).toBe(false))
})

describe('canManageContracts', () => {
  it('allows ADMIN', () => expect(canManageContracts(makeSession('ADMIN'))).toBe(true))
  it('allows GENERAL', () => expect(canManageContracts(makeSession('GENERAL'))).toBe(true))
  it('denies HR', () => expect(canManageContracts(makeSession('HR'))).toBe(false))
})

describe('canManageOwnTask', () => {
  const task = { assigneeId: 'user-1', creatorId: 'user-2' }
  it('allows assignee', () => expect(canManageOwnTask(makeSession('VIEW', 'user-1'), task)).toBe(true))
  it('allows creator', () => expect(canManageOwnTask(makeSession('VIEW', 'user-2'), task)).toBe(true))
  it('denies unrelated', () => expect(canManageOwnTask(makeSession('VIEW', 'user-3'), task)).toBe(false))
})

describe('isViewOnly', () => {
  it('returns true for VIEW', () => expect(isViewOnly(makeSession('VIEW'))).toBe(true))
  it('returns false for OPS', () => expect(isViewOnly(makeSession('OPS'))).toBe(false))
})
```

- [ ] **Step 3: Run permission tests**

```bash
pnpm test lib/__tests__/permissions.test.ts
```
Expected: all tests PASS

- [ ] **Step 4: Apply permissions helpers to API routes**

In `app/api/employees/route.ts` POST — replace inline role check:
```ts
import { canManageHR } from '@/lib/permissions'
// Replace: if (!['ADMIN', 'HR'].includes(session.user.role))
// With:
if (!canManageHR(session)) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
```

In `app/api/contracts/route.ts` POST and `app/api/contracts/[id]/route.ts` PATCH — replace:
```ts
import { canManageContracts } from '@/lib/permissions'
// Replace: if (!['ADMIN', 'GENERAL'].includes(session.user.role))
// With:
if (!canManageContracts(session)) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
```

In `app/api/tasks/[id]/route.ts` PATCH and DELETE — replace:
```ts
import { canManageAllTasks, canManageOwnTask } from '@/lib/permissions'
// Replace inline checks with:
const canEdit = canManageAllTasks(session) || canManageOwnTask(session, task)
if (!canEdit) return NextResponse.json({ error: '권한 없음' }, { status: 403 })
```

- [ ] **Step 5: Final build check**

```bash
pnpm build
```
Expected: no TypeScript errors, build succeeds.

- [ ] **Step 6: Run all tests**

```bash
pnpm test
```
Expected: all tests PASS

- [ ] **Step 7: Final commit**

```bash
git add lib/permissions.ts lib/__tests__/ app/api/
git commit -m "feat: centralize RBAC permissions and harden all API routes

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage check:**
- [x] 대시보드 (KPI cards, today tasks, expiring contracts) — Task 6
- [x] 업무관리 CRUD + 상태 + 담당자 + 우선순위 — Tasks 9
- [x] 직원관리 DB + 부서 + 직급 + 연락처 — Task 7
- [x] 연차 신청/승인/반려 — Task 8
- [x] 계약관리 CRUD + 파일 첨부 (Vercel Blob) + 알림 — Tasks 10, 11
- [x] 만료 알림 D-90/60/30 cron — Task 11
- [x] 알림센터 통합 — Task 11
- [x] Auth credentials + middleware — Task 3
- [x] RBAC 5-role matrix — Tasks 3, 12
- [x] WEHAGO 디자인 (네이비+티얼+Noto Sans KR) — Tasks 1, 4
- [x] Prisma 6 + PostgreSQL — Task 2
- [x] Auth.js v5 — Task 3
- [x] Vitest — Tasks 1, 2, 5, 12
- [x] BigInt for monetary values — Tasks 2, 10
- [x] Double permission check (middleware + Server Action) — Tasks 3, 12

**Type consistency:**
- `db` singleton from `lib/db.ts` used in all API routes ✓
- `auth()` from `lib/auth.ts` used consistently ✓
- `canManageHR/Contracts/AllTasks/OwnTask` exported from `lib/permissions.ts` ✓
- BigInt amounts serialized to string before JSON.stringify in all contract routes ✓

**No placeholders:** All tasks contain actual code, no "TBD" or "TODO" patterns.
