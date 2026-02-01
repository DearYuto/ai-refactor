# AGENTS.md (KOR)

## 규칙 출처

- `.cursor/rules`, `.cursorrules`, `.github/copilot-instructions.md` 없음
- 이 문서가 저장소 규칙의 기준

## 레포 개요

- Bun + Turborepo 모노레포
- Frontend: `apps/web` (Next.js App Router)
- Backend: `apps/api` (NestJS)
- Shared types: `packages/types`

## 루트 명령어

- 설치: `bun install`
- 개발: `bun run dev`
- 빌드: `bun run build`
- 린트: `bun run lint`
- 포맷: `bun run format`

## 프론트 (`apps/web`)

- dev: `bun run dev`
- build: `bun run build`
- start: `bun run start`
- lint: `bun run lint`
- App Router는 `apps/web/app`
- Client 컴포넌트는 `"use client"` 필요
- API base: `apps/web/lib/config.ts`
- 기본 포트: http://localhost:3000

## 백엔드 (`apps/api`)

- dev: `bun run start:dev`
- build: `bun run build`
- lint: `bun run lint`
- test: `bun run test`
- test:watch: `bun run test:watch`
- test:cov: `bun run test:cov`
- test:e2e: `bun run test:e2e`

### 단일 테스트

- 이름: `bun run test -- -t "test name"`
- 경로: `bun run test -- --runTestsByPath src/app.controller.spec.ts`
- e2e: `bun run test:e2e -- -t "test name"`

### 런타임 기본값

- API 포트: `process.env.PORT ?? 8000`
- CORS: http://localhost:3000 허용
- JWT secret: `process.env.JWT_SECRET ?? "dev-secret"`

## Shared Types

- 타입은 작고 직렬화 가능해야 함
- `packages/types/index.ts`에 export 추가
- 새 패키지 추가 시 web/api 모두 의존성 업데이트

## 코드 스타일 가이드

### General

- TypeScript 사용
- 공개 함수/exports는 명시적 타입 권장
- `any` 최소화
- `@ts-ignore`, `@ts-expect-error` 금지(정당화 필요)
- async/await 사용, floating promise 금지

### SOLID/아키텍처 원칙

- 단일책임원칙 준수
- 상속보다 합성
- 의존성 방향 유지 (types -> services -> controllers)
- 재사용은 경계 기반으로 (전역 유틸 남발 금지)
- DX/가독성/예측 가능성 우선
- 도메인 응집도 우선
- 과도한 추상화/오버엔지니어링 금지

### 공식 문서 기준 베스트 프랙티스

- Next.js/React/NestJS 공식 문서 기준 준수
- React useEffect: 레이스 컨디션 방지, side-effect 중복 방지, cleanup 철저
- 파생 상태는 effect 대신 render/memo로 계산

### Formatting

- Prettier 사용 (`bun run format`)
- ESLint가 기준

### Imports

- 외부 -> 내부 -> 상대 순서
- unused import 제거

### Error Handling

- Backend: NestJS `HttpException` 사용
- Frontend: 로딩/에러 상태 처리

## Backend 아키텍처

- module/controller/service 구조
- 컨트롤러는 얇게, 로직은 서비스로
- DTO는 `apps/api/src/<module>/dto`
- 인메모리 스토어는 서비스에만

## Domain-Centric 구조 규칙

- 도메인 기준으로 구성 (auth, wallet, market, orders 등)
- 도메인 내부에 controller/service/dto/types/tests 응집
- 공용 UI/유틸은 아래 위치 고정:
  - `apps/web/components/*`
  - `apps/web/lib/*`
- 도메인 전용 컴포넌트/유틸은 도메인 폴더 안에 유지
- components/utils에 무분별하게 쌓지 말 것

## Frontend 규칙

- Tailwind 유틸리티 기반
- 접근성 있는 구조(semantic)
- 작은 섹션/컴포넌트 단위 구성
- 상태 관리: `zustand` (client), `@tanstack/react-query` (server)
- i18n: `next-intl`
- UI: `@headlessui/react` (헤드리스 UI)

## 커밋 금지 파일

- `.omc/`, `.opencode/`
- `.next/`, `dist/`, `.turbo/`, `node_modules/`

## 현재 API 목록

- `GET /health`
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `GET /wallet/balance`
- `GET /market/ticker`
- `GET /market/orderbook`

## 검증 워크플로우

1. `bun run lint`
2. `bun run build`
3. `curl http://localhost:8000/health`
4. `curl http://localhost:8000/market/ticker`
5. http://localhost:3000 확인

## 에이전트 주의사항

- 변경은 최소/집중
- 큰 커밋보다 작은 커밋
- 신규 의존성은 명확한 이유가 있을 때만
- API 계약/보안에 영향 있으면 반드시 확인
