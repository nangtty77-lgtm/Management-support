# BizHub Phase 1 — 설계 문서

**작성일:** 2026-09-16  
**상태:** 승인됨  
**범위:** Phase 1 MVP (대시보드 · 업무관리 · 직원관리 · 계약관리)

---

## 1. 프로젝트 개요

### 목적

회사 내 회계·인사·총무·영업지원·계약·문서·일정·업무자료가 각각 다른 파일, 폴더, 메일에 분산되어 발생하는 비효율을 개선한다. 단순 ERP가 아니라 자료 통합 → 업무관리 → 일정관리 → 검색 → 알림 → 자동화 → AI 분석까지 연결하는 경영지원 통합 플랫폼을 구축한다.

### 기존 시스템과의 관계

- `sales-work-os` (포트 3300): 영업팀 전용 SPA — 유지, 병행 운영
- `bizhub` (포트 3400): 전사 경영지원 플랫폼 — 신규 프로젝트

두 시스템은 독립 운영. 향후 API 연동 여지는 남겨두되 Phase 1에서는 구현하지 않는다.

### 대상 사용자

- 5~20명 규모 내부 직원
- 클라우드(Vercel) 배포, 어디서든 접속 가능

---

## 2. 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| Framework | Next.js 15 (App Router) | sales-work-os와 동일 패턴 |
| Language | TypeScript | strict mode |
| ORM | Prisma 6 | |
| Database | PostgreSQL | Neon (serverless) 사용 |
| Auth | Auth.js v5 (NextAuth) | Google OAuth + 이메일/패스워드 |
| Styling | Tailwind CSS v4 | |
| UI Font | Noto Sans KR | Google Fonts CDN |
| 색상 | 네이비 `#0D1E40` + 티얼 `#00BFA5` | 위하고 스타일 참고 |
| 배포 | Vercel | |
| AI (Phase 2) | Claude API + pgvector | 지금은 설계만 반영 |

**프로젝트 경로:** `C:\클로드\bizhub`  
**포트:** `3400`

---

## 3. Phase 1 기능 범위

### 포함 (Phase 1)

| 모듈 | 기능 |
|---|---|
| 대시보드 | KPI 카드(긴급업무/오늘마감/계약만료/승인대기), 오늘 업무 목록, 계약 만료 예정 위젯 |
| 업무관리 | 업무 등록/수정/삭제, 상태(대기→진행중→완료), 담당자 배정, 우선순위(긴급/높음/보통/낮음), 마감일, 부서/팀 필터 |
| 직원관리 | 직원 DB(기본정보/부서/직급/연락처/입사일), 연차 신청, 연차 승인/반려, 재직상태 관리 |
| 계약관리 | 계약 등록(거래처/금액/기간/담당자), 계약서 파일 첨부, 만료 알림(D-90/D-60/D-30), 계약 목록 필터/검색 |
| 알림센터 | 시스템 알림 통합(계약 만료, 연차 승인요청, 업무 마감임박) |
| 인증/권한 | 로그인, 역할 기반 접근 제어 |

### 제외 (Phase 2+)

- 회계/매출/세금계산서
- 급여/평가/교육 관리
- 자산관리
- AI 검색/문서 RAG
- Google Calendar 연동
- 결재 워크플로우 자동화
- 경영 보고서 자동 생성

---

## 4. 데이터베이스 스키마

### 4.1 조직/인증

```prisma
model User {
  id            String      @id @default(cuid())
  name          String
  email         String      @unique
  emailVerified DateTime?
  image         String?
  role          Role        @default(VIEW)
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
  active        Boolean     @default(true)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  employee      Employee?
  assignedTasks Task[]       @relation("TaskAssignee")
  createdTasks  Task[]       @relation("TaskCreator")
  ownedContracts Contract[]
  notifications Notification[]
  accounts      Account[]
  sessions      Session[]
}

enum Role {
  ADMIN    // 전체 권한
  HR       // 인사 모듈 전체, 나머지 읽기
  GENERAL  // 총무/계약 전체, 나머지 읽기
  OPS      // 업무 전체, 나머지 읽기
  VIEW     // 읽기 전용
}

model Department {
  id        String     @id @default(cuid())
  name      String
  createdAt DateTime   @default(now())
  users     User[]
  employees Employee[]
}
```

### 4.2 직원 관리

```prisma
model Employee {
  id           String    @id @default(cuid())
  userId       String    @unique
  user         User      @relation(fields: [userId], references: [id])
  departmentId String
  department   Department @relation(fields: [departmentId], references: [id])
  position     String    // 직급 (사원/대리/과장/차장/부장)
  phone        String?
  hireDate     DateTime
  leaveDate    DateTime?
  status       EmpStatus @default(ACTIVE)
  annualLeave  Int       @default(15) // 연간 연차 총일수
  usedLeave    Int       @default(0)  // 사용 연차
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  leaveRequests LeaveRequest[]
}

enum EmpStatus {
  ACTIVE    // 재직
  PROBATION // 수습
  LEAVE     // 휴직
  RESIGNED  // 퇴직
}

model LeaveRequest {
  id          String      @id @default(cuid())
  employeeId  String
  employee    Employee    @relation(fields: [employeeId], references: [id])
  type        LeaveType
  startDate   DateTime
  endDate     DateTime
  days        Float       // 실제 사용 일수
  reason      String?
  status      ApprovalStatus @default(PENDING)
  approverId  String?
  approvedAt  DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum LeaveType {
  ANNUAL     // 연차
  SICK       // 병가
  SPECIAL    // 특별휴가
  UNPAID     // 무급휴가
}

enum ApprovalStatus {
  PENDING    // 대기
  APPROVED   // 승인
  REJECTED   // 반려
}
```

### 4.3 계약 관리

```prisma
model Contract {
  id           String    @id @default(cuid())
  name         String    // 계약명
  vendorName   String    // 거래처명
  amount       BigInt    // 계약금액 (원 정수)
  startDate    DateTime
  endDate      DateTime
  autoRenewal  Boolean   @default(false)
  ownerId      String
  owner        User      @relation(fields: [ownerId], references: [id])
  notes        String?
  fileUrl      String?   // 계약서 파일 URL (Vercel Blob 저장)
  status       ContractStatus @default(ACTIVE)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  alerts       ContractAlert[]
  tasks        Task[]
}

enum ContractStatus {
  ACTIVE     // 유효
  EXPIRED    // 만료
  TERMINATED // 해지
  DRAFT      // 초안
}

model ContractAlert {
  id          String    @id @default(cuid())
  contractId  String
  contract    Contract  @relation(fields: [contractId], references: [id])
  alertDays   Int       // 만료 며칠 전 (90, 60, 30)
  sentAt      DateTime? // 발송 완료 시각
  createdAt   DateTime  @default(now())
}
```

### 4.4 업무 관리

```prisma
model Task {
  id           String    @id @default(cuid())
  title        String
  description  String?
  assigneeId   String?
  assignee     User?     @relation("TaskAssignee", fields: [assigneeId], references: [id])
  creatorId    String
  creator      User      @relation("TaskCreator", fields: [creatorId], references: [id])
  priority     Priority  @default(NORMAL)
  status       TaskStatus @default(PENDING)
  dueDate      DateTime?
  completedAt  DateTime?
  contractId   String?   // 관련 계약 (선택)
  contract     Contract? @relation(fields: [contractId], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum Priority {
  URGENT  // 긴급
  HIGH    // 높음
  NORMAL  // 보통
  LOW     // 낮음
}

enum TaskStatus {
  PENDING      // 대기
  IN_PROGRESS  // 진행중
  REVIEW       // 검토
  COMPLETED    // 완료
  ON_HOLD      // 보류
}
```

### 4.5 알림

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  title     String
  message   String
  link      String?          // 클릭 시 이동할 경로
  read      Boolean          @default(false)
  createdAt DateTime         @default(now())
}

enum NotificationType {
  CONTRACT_EXPIRY   // 계약 만료 임박
  LEAVE_REQUEST     // 연차 신청
  TASK_DUE          // 업무 마감 임박
  TASK_ASSIGNED     // 업무 배정
  LEAVE_APPROVED    // 연차 승인/반려
  SYSTEM            // 시스템 메시지
}
```

---

## 5. 라우트 구조 (Next.js App Router)

```
app/
├── (auth)/
│   └── login/              # 로그인 페이지
├── (app)/
│   ├── layout.tsx           # 사이드바 + 헤더 공통 레이아웃
│   ├── dashboard/           # 대시보드
│   ├── tasks/               # 업무관리
│   │   ├── page.tsx         # 목록
│   │   └── [id]/page.tsx    # 상세
│   ├── employees/           # 직원관리
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── leaves/              # 연차관리
│   │   └── page.tsx
│   ├── contracts/           # 계약관리
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── notifications/       # 알림센터
└── api/
    ├── auth/[...nextauth]/
    ├── tasks/
    ├── employees/
    ├── leaves/
    ├── contracts/
    └── notifications/
```

---

## 6. 권한 매트릭스

| 역할 | 대시보드 | 업무관리 | 직원관리 | 계약관리 | 알림 |
|---|---|---|---|---|---|
| ADMIN | 전체 | 전체 | 전체 | 전체 | 전체 |
| HR | 읽기 | 본인 업무¹ | **전체** | 읽기 | 본인 |
| GENERAL | 읽기 | 본인 업무¹ | 읽기 | **전체** | 본인 |
| OPS | 읽기 | **전체** | 읽기 | 읽기 | 본인 |
| VIEW | 읽기 | 읽기 | — | — | 본인 |

¹ "본인 업무" = `assigneeId === currentUser.id` 또는 `creatorId === currentUser.id`인 업무만 수정/삭제 가능. 전체 목록 읽기는 허용.

파일 저장: 계약서 첨부파일은 **Vercel Blob** 사용. Phase 1에서 파일당 최대 10MB, 허용 형식 PDF·DOCX·HWP.

권한 체크는 Next.js 미들웨어 + Server Action 레벨에서 이중으로 적용한다.

---

## 7. UI/UX 디자인 시스템

### 색상

| 역할 | 값 |
|---|---|
| 사이드바 배경 | `#0D1E40` (다크 네이비) |
| 포인트 (티얼) | `#00BFA5` |
| 콘텐츠 배경 | `#EFF3F9` |
| 카드 배경 | `#FFFFFF` |
| 헤딩 텍스트 | `#0D1E40` |
| 서브 텍스트 | `#64748B` |
| 위험 | `#EF4444` |
| 경고 | `#F59E0B` |
| 성공 | `#00BFA5` |

### 레이아웃

- 사이드바 너비: 190px, 고정
- 헤더 높이: 50px, 고정
- 콘텐츠 최대 너비: 1200px
- 모듈별 섹션 그룹: Core / HR / 총무 / 업무 / 문서

### 폰트

- 본문: `Noto Sans KR` (400, 500, 700)
- 숫자 KPI: 700 weight, 24-28px
- 참고 스타일: 더존 위하고(www.douzone.site/wehago)

---

## 8. 배포 전략

```
개발 환경:
  - localhost:3400
  - DATABASE_URL: Neon PostgreSQL (dev branch)

운영 환경:
  - Vercel (자동 배포, main 브랜치)
  - DATABASE_URL: Neon PostgreSQL (main branch)
  - NEXTAUTH_URL: Vercel 도메인

환경 변수:
  DATABASE_URL
  NEXTAUTH_SECRET
  NEXTAUTH_URL
  GOOGLE_CLIENT_ID (선택, OAuth 사용 시)
  GOOGLE_CLIENT_SECRET (선택)
```

---

## 9. Phase 2 준비 사항 (지금은 구현 안 함)

Phase 1 설계 시 다음을 고려해 AI-ready 구조로 만든다:

- `Document` 테이블 예약 (파일 메타데이터 + 텍스트 청크 + 임베딩 벡터)
- `AuditLog` 테이블 예약 (모든 변경 이력, AI 학습 데이터 원천)
- PostgreSQL `pgvector` 확장 활성화만 해두기 (실제 사용은 Phase 2)
- Claude API 키 환경변수 자리 예약 (`ANTHROPIC_API_KEY`)

---

## 10. 개발 우선순위

```
Week 1: 프로젝트 초기화 + Auth + 사이드바 레이아웃
Week 2: 대시보드 + 직원관리 기본
Week 3: 업무관리 (CRUD + 상태관리)
Week 4: 계약관리 + 알림 시스템
Week 5: 연차 신청/승인 + 권한 점검
Week 6: UI 다듬기 + Vercel 배포 + 테스트
```
