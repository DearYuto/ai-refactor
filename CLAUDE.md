# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Cryptocurrency Exchange Platform** - A full-stack monorepo implementing a real-time trading system with order matching, wallet management, and WebSocket notifications.

**Tech Stack:**
- **Backend:** NestJS + Prisma + PostgreSQL + WebSocket (Socket.IO)
- **Frontend:** Next.js 16 (App Router) + React 19 + TanStack Query + Zustand
- **Monorepo:** Turborepo + Bun workspaces

---

## Development Commands

### Root-Level (Monorepo)

```bash
# Install dependencies
bun install

# Run all apps in development mode
bun dev

# Build all apps
bun build

# Lint all apps
bun lint

# Format code
bun format
```

### Backend (apps/api)

```bash
cd apps/api

# Development
bun run start:dev          # Watch mode with hot reload
bun run start:debug        # Debug mode

# Build & Production
bun run build
bun run start:prod

# Testing
bun run test               # Run all tests
bun run test:watch         # Watch mode
bun run test:cov           # With coverage
bun run test:e2e           # End-to-end tests

# Database
npx prisma generate        # Generate Prisma client
npx prisma migrate dev     # Create & run migration
npx prisma studio          # Open Prisma Studio GUI
```

### Frontend (apps/web)

```bash
cd apps/web

# Development
bun run dev

# Build & Production
bun run build
bun run start

# Testing
bun run test:visual        # Playwright E2E tests

# API Client Generation (from OpenAPI)
bun run orval              # Generate API client from Swagger
```

---

## Architecture

### Monorepo Structure

```
apps/
  api/          → NestJS backend server
  web/          → Next.js frontend application

packages/
  database/     → Prisma schema & client (shared)
  types/        → TypeScript type definitions (shared)
  utils/        → Utility functions (shared)
  config/       → ESLint, Prettier, TSConfig (shared)
```

### Backend Architecture (NestJS)

**Core Domain Modules:**
- `auth/` - 인증/인가 (JWT, 2FA, 이메일 인증)
- `wallet/` - 지갑 잔액 관리
- `orders/` - 주문 생성/조회/취소
- `matching/` - 실시간 주문 매칭 엔진
- `trades/` - 체결 내역 관리
- `deposits/` - 입금 처리
- `withdrawals/` - 출금 처리 (2FA 검증)
- `notifications/` - WebSocket 실시간 알림
- `market/` - 시장 데이터 (오더북, 최근 거래)

**Common Modules:**
- `common/logger/` - Winston 기반 로깅
- `common/encryption/` - AES-256-GCM 암호화
- `common/email/` - Nodemailer 이메일 발송
- `common/filters/` - 전역 예외 필터

**Key Patterns:**
- **Order Matching Engine:** `matching/matching.service.ts` - 가격-시간 우선 매칭 알고리즘
- **Transaction Safety:** Prisma 트랜잭션으로 잔액 변경 보장
- **2FA:** Speakeasy TOTP + 백업 코드
- **Rate Limiting:** `@nestjs/throttler` (60초당 100 요청)

### Frontend Architecture (Next.js)

**App Router Structure:**
```
app/
  [locale]/                    # 다국어 라우팅
    (home)/                   # 홈 대시보드
    (market)/                 # 거래 화면
      market/                 # 실시간 차트 + 주문
    settings/security/        # 2FA 설정
    wallet/                   # 입출금 관리
    trades/                   # 거래 내역
```

**State Management:**
- **Server State:** TanStack Query (API 데이터 캐싱)
- **Client State:** Zustand (전역 상태)
- **Real-time:** Socket.IO Client (WebSocket 연결)

**Key Patterns:**
- **API Client:** `lib/api/` - Orval로 OpenAPI에서 자동 생성
- **Query Keys:** `lib/api/*QueryKey.ts` - TanStack Query 키 관리
- **WebSocket:** `components/notifications-dropdown.tsx` - 실시간 알림 수신

### Database Schema (Prisma)

**Core Models:**
- `User` - 사용자 (이메일, 2FA, 권한)
- `Order` - 주문 (매수/매도, 지정가/시장가)
- `Trade` - 체결 (매수 주문 + 매도 주문)
- `WalletBalance` - 잔액 (available + locked)
- `Transaction` - 잔액 변동 이력
- `Deposit` / `Withdrawal` - 입출금
- `Notification` - 알림 (주문 체결, 입금 확인 등)

**Critical Indexes:**
- `@@index([userId, status])` on Order
- `@@index([source, status, side])` on Order (매칭 성능)
- `@@unique([userId, asset])` on WalletBalance (무결성)

---

## Critical Workflows

### 1. Order Matching Flow

```
1. User creates order → orders.service.ts
2. Order saved to DB → Prisma transaction
3. Matching engine triggered → matching.service.ts
   - FIFO matching for market orders
   - Price-time priority for limit orders
4. Trade created → trades.service.ts
5. Balances updated → wallet.service.ts (atomic)
6. Notifications sent → notifications.gateway.ts (WebSocket)
```

### 2. Withdrawal Security Flow

```
1. User requests withdrawal → withdrawals.controller.ts
2. 2FA code validation → two-factor.service.ts
3. Balance check & lock → wallet.service.ts
4. Admin approval (future) → status: 'approved'
5. Blockchain transaction → txHash recorded
6. Balance deducted → Transaction log
```

### 3. Real-time Updates (WebSocket)

```
Backend:
- notifications.gateway.ts → Socket.IO server
- Emits: 'orderFilled', 'depositConfirmed', 'newNotification'

Frontend:
- notifications-dropdown.tsx → Socket.IO client
- Listens for events → Updates UI + React Query cache
```

---

## Testing Strategy

### Backend Tests

```typescript
// Service unit tests (*.spec.ts)
describe('AuthService', () => {
  // Mock PrismaService, JwtService
  // Test business logic in isolation
});

// E2E tests (test/*.e2e-spec.ts)
describe('Auth E2E', () => {
  // Full HTTP request/response testing
});
```

### Frontend Tests

```typescript
// Component tests (*.test.tsx)
import { render, screen } from '@testing-library/react';

// E2E tests (Playwright)
test('Place market order', async ({ page }) => {
  // Real browser interaction testing
});
```

---

## Environment Variables

**Backend (apps/api/.env):**
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
ENCRYPTION_KEY=...          # 64-char hex (32 bytes)
EMAIL_HOST=...
EMAIL_USER=...
EMAIL_PASS=...
```

**Frontend (apps/web/.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## Code Style & Conventions

**네이밍:**
- 파일: `user.service.ts`, `Button.tsx`, `create-order.dto.ts`
- 클래스: `PascalCase`
- 함수/변수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`
- Boolean: `isLoading`, `hasError`
- 이벤트 핸들러: `handleClick`

**TypeScript:**
- ❌ `any` 금지 → `unknown` + Type Guard 사용
- ✅ Strict null checks
- ✅ Interface 접두사 `I` (예: `IUser`)

**Security:**
- ✅ DTO validation (class-validator)
- ✅ Prisma ORM (SQL Injection 방지)
- ✅ Password hashing (bcryptjs)
- ✅ 2FA (Speakeasy TOTP)
- ✅ Encryption (AES-256-GCM)
- ❌ 환경 변수 하드코딩 금지

**자세한 스타일 가이드:**
- Frontend: `.claude/rules/frontend/code_style.md`
- Backend: `.claude/rules/backend/code_style.md`

---

## Task Master Integration

이 프로젝트는 Task Master AI를 사용합니다. 상세한 워크플로우는 `.taskmaster/CLAUDE.md`를 참조하세요.

**주요 명령어:**
```bash
task-master next              # 다음 작업 조회
task-master show <id>         # 작업 상세 보기
task-master set-status --id=<id> --status=done
```

---

## Common Pitfalls

1. **Prisma Client 재생성:** `schema.prisma` 변경 시 `npx prisma generate` 필수
2. **Monorepo 캐시:** Turborepo 캐시 이슈 시 `rm -rf .turbo` 후 재빌드
3. **WebSocket 연결:** API 서버 실행 후 프론트엔드 접속 (포트 3001 필수)
4. **2FA 테스트:** Speakeasy 라이브러리로 TOTP 코드 생성 (30초 유효)
5. **Decimal 타입:** Prisma `Decimal` → JS `string`으로 변환 필요
6. **Order Matching:** 동시성 이슈 방지 위해 `@nestjs/schedule` 사용 (단일 스레드)

---

## Additional Resources

- **API Documentation:** http://localhost:3001/api (Swagger)
- **Database GUI:** `npx prisma studio`
- **Frontend Storybook:** (미구현)
