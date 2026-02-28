# 암호화폐 거래소 개발 로드맵

## 📊 현재 상태 요약

### ✅ 구현 완료

**데이터베이스 (Prisma):**
- ✅ User, Order, WalletBalance 모델 정의 완료
- ✅ 기본 관계 설정 (User ↔ Orders, User ↔ Balances)

**백엔드 API (NestJS):**
- ✅ 인증 모듈 (AuthService, JwtAuthGuard)
  - 회원가입/로그인 기능
  - 기본 지갑 초기화
- ✅ 지갑 모듈 (WalletService)
  - 잔고 조회
  - 자산 스왑 (시장가 주문용)
  - 잔고 락/언락 (지정가 주문용)
- ✅ 주문 모듈 (OrdersService, OrdersController)
  - 시장가 주문 체결
  - 지정가 주문 생성 (즉시 체결 로직 포함)
  - 주문 취소
  - 주문 목록 조회
- ✅ 시장 데이터 모듈 (MarketService)
  - 하드코딩된 Ticker/Orderbook 제공

**프론트엔드 (Next.js):**
- ✅ 거래 페이지 레이아웃 (`/market`)
- ✅ 실시간 시세 표시 (LivePriceSection, TickerSection)
- ✅ 오더북 UI (OrderbookSection)
  - 클릭 시 가격 자동 입력
- ✅ 주문 진입 UI (OrderEntrySection)
  - 시장가/지정가 주문 폼
  - Buy/Sell 토글
  - 잔고 표시 및 비율 버튼
  - Open Orders / History 탭
- ✅ 지갑 잔고 표시 (WalletBalanceSection)
- ✅ React Query를 통한 상태 관리

### ⚠️ 부분 구현

**백엔드:**
- ⚠️ 실시간 WebSocket (market.gateway.ts 존재, 완전한 통합 미확인)
- ⚠️ 지정가 주문 매칭 엔진 (즉시 체결만 가능, 대기 주문 매칭 없음)

**프론트엔드:**
- ⚠️ WebSocket 연결 (useMarketSocket 존재하나 폴링 백업 사용 중)
- ⚠️ 차트 컴포넌트 (BtcChartSection 존재하나 상세 미확인)

### ❌ 미구현

**백엔드:**
- ❌ 실시간 주문 매칭 엔진 (대기 중인 지정가 주문 자동 체결)
- ❌ 거래 수수료 시스템
- ❌ 거래 내역 기록 (Trade 테이블)
- ❌ 관리자 기능 (사용자 관리, 통계)
- ❌ KYC/AML 검증
- ❌ 출금/입금 시스템
- ❌ API Rate Limiting
- ❌ 로깅 및 모니터링 시스템
- ❌ 외부 거래소 API 연동 (실제 시세)
- ❌ 백업 및 재해 복구 시스템

**프론트엔드:**
- ❌ 고급 차트 (TradingView 연동)
- ❌ 주문 체결 알림
- ❌ 포트폴리오 분석 페이지
- ❌ 거래 내역 상세 페이지
- ❌ 다국어 지원 완성
- ❌ 다크/라이트 테마 전환
- ❌ 모바일 최적화

**데이터베이스:**
- ❌ Trade 모델 (체결 내역)
- ❌ Fee 설정 모델
- ❌ Deposit/Withdrawal 모델
- ❌ Transaction 로그 모델

**DevOps:**
- ❌ CI/CD 파이프라인
- ❌ Docker 컨테이너화
- ❌ Production 환경 설정

---

## Phase 1: 핵심 거래 시스템 완성 (예상 기간: 3-4주)

### 🎯 목표
사용자가 **실제로 거래할 수 있는 최소 기능**을 완성합니다.
- 지정가 주문이 자동으로 매칭되는 매칭 엔진 구현
- 거래 수수료 적용
- 거래 내역 기록 및 조회

### 백엔드 체크리스트

#### 1. 데이터베이스 확장
- [ ] **Trade 모델 추가** (파일: `packages/database/prisma/schema.prisma`)
  - 필드: id, buyOrderId, sellOrderId, price, size, buyerFee, sellerFee, timestamp
  - 관계: Order와 Many-to-One
- [ ] **Fee 설정 모델 추가** (파일: `packages/database/prisma/schema.prisma`)
  - 필드: id, asset, makerFee, takerFee
- [ ] **Migration 실행**

#### 2. 거래 수수료 시스템
- [ ] **FeeService 구현** (파일: `apps/api/src/fee/fee.service.ts`)
  - 메서드: `calculateFee(orderType, size, price)`
  - Maker/Taker 구분 (지정가=Maker, 시장가=Taker)
- [ ] **기본 수수료율 설정** (상수: 0.1% Maker, 0.2% Taker)
- [ ] **OrdersService에 수수료 로직 통합**
  - 시장가 주문 시 수수료 차감
  - 지정가 주문 체결 시 수수료 차감

#### 3. 주문 매칭 엔진
- [ ] **MatchingEngineService 구현** (파일: `apps/api/src/matching/matching.service.ts`)
  - 메서드: `matchOrders(marketSource: string)`
  - 로직: 대기 중인 buy/sell 주문 중 가격이 겹치는 것 자동 매칭
- [ ] **백그라운드 작업 설정** (크론/이벤트 기반)
  - 1초마다 매칭 엔진 실행
- [ ] **Trade 레코드 생성**
  - 매칭 성공 시 Trade 테이블에 기록
  - 양쪽 주문 상태 'filled'로 업데이트
- [ ] **부분 체결 로직** (선택사항)
  - 주문 일부만 체결되는 경우 처리

#### 4. 거래 내역 API
- [ ] **TradesController 구현** (파일: `apps/api/src/trades/trades.controller.ts`)
  - GET `/trades` - 최근 거래 내역 (public)
  - GET `/trades/my` - 내 거래 내역 (JWT 필요)
- [ ] **TradesService 구현** (파일: `apps/api/src/trades/trades.service.ts`)
  - 메서드: `getRecentTrades(source, limit)`
  - 메서드: `getMyTrades(userId, source)`

### 프론트엔드 체크리스트

#### 1. 거래 내역 표시
- [ ] **TradeTapeSection 개선** (파일: `apps/web/app/[locale]/(market)/market/components/trade-tape-section.tsx`)
  - 백엔드 `/trades` API 호출
  - 실시간 업데이트 (WebSocket 또는 폴링)
- [ ] **내 거래 내역 페이지** (파일: `apps/web/app/[locale]/trades/page.tsx`)
  - 테이블 형식으로 표시
  - 필터링 (날짜, 자산)

#### 2. 수수료 표시
- [ ] **OrderEntrySection에 예상 수수료 표시** (파일: `apps/web/app/[locale]/(market)/market/components/order-entry-section.tsx`)
  - "Est. Fee: 0.001 BTC" 형식
- [ ] **거래 완료 후 실제 수수료 표시**
  - 알림 또는 주문 내역에 수수료 표시

#### 3. API 타입 동기화
- [ ] **Trade 타입 정의** (파일: `apps/web/lib/api/trades.api.ts`)
  - TradeRecord 인터페이스
- [ ] **수수료 필드 추가** (파일: `apps/web/lib/api/orders.api.ts`)
  - OrderRecord에 `fee` 필드 추가

### 우선순위
- 🔴 **높음**: 매칭 엔진, Trade 모델, 수수료 시스템
- 🟡 **중간**: 거래 내역 API, 프론트엔드 거래 내역 표시
- 🟢 **낮음**: 부분 체결 로직, 고급 필터링

### 의존성
- "매칭 엔진 구현"은 "Trade 모델 추가" 완료 후 시작
- "프론트엔드 거래 내역 표시"는 "거래 내역 API" 완료 후 시작

---

## Phase 2: 보안 및 안정성 강화 (예상 기간: 2-3주)

### 🎯 목표
거래소의 **보안과 안정성**을 확보합니다.
- API Rate Limiting
- 로깅 및 모니터링
- 에러 핸들링 개선
- 데이터 검증 강화

### 백엔드 체크리스트

#### 1. Rate Limiting
- [ ] **@nestjs/throttler 설정** (파일: `apps/api/src/app.module.ts`)
  - 전역 설정: 60초당 100 요청
- [ ] **민감한 엔드포인트 강화**
  - `/auth/login`: 60초당 5회
  - `/auth/signup`: 60초당 3회
  - `/orders`: 60초당 20회

#### 2. 로깅 시스템
- [ ] **Winston 또는 Pino 설정** (파일: `apps/api/src/common/logger/logger.service.ts`)
  - 로그 레벨: DEBUG, INFO, WARN, ERROR
  - 파일 로그 저장: `logs/app.log`
- [ ] **주요 이벤트 로깅**
  - 모든 주문 생성/취소
  - 거래 체결
  - 로그인/로그아웃
  - API 에러

#### 3. 트랜잭션 로그
- [ ] **Transaction 모델 추가** (파일: `packages/database/prisma/schema.prisma`)
  - 필드: id, userId, type, amount, asset, balanceBefore, balanceAfter, timestamp
- [ ] **WalletService에 트랜잭션 로그 추가**
  - 모든 잔고 변경 시 로그 기록

#### 4. 에러 핸들링 개선
- [ ] **전역 Exception Filter** (파일: `apps/api/src/common/filters/global-exception.filter.ts`)
  - 일관된 에러 응답 형식
  - 에러 코드 체계화
- [ ] **커스텀 Exception 클래스**
  - InsufficientBalanceException
  - InvalidOrderException
  - RateLimitExceededException

#### 5. 입력 검증 강화
- [ ] **DTO Validation Pipes 강화**
  - CreateOrderDto: size/price 범위 검증 (최소/최대값)
  - 소수점 자리수 제한
- [ ] **비즈니스 로직 검증**
  - 주문 size 최소값 (예: 0.0001 BTC)
  - 가격 범위 제한 (현재가 ±30% 이내)

### 프론트엔드 체크리스트

#### 1. 에러 핸들링 개선
- [ ] **ErrorBoundary 컴포넌트** (파일: `apps/web/components/error-boundary.tsx`)
  - 전역 에러 처리
- [ ] **사용자 친화적 에러 메시지**
  - API 에러 코드별 한국어 메시지 매핑
- [ ] **Retry 로직**
  - React Query에 자동 재시도 설정 (네트워크 에러만)

#### 2. 로딩 상태 개선
- [ ] **Skeleton UI 추가**
  - 주문 목록 로딩 시
  - 잔고 로딩 시

### 우선순위
- 🔴 **높음**: Rate Limiting, 트랜잭션 로그, 입력 검증 강화
- 🟡 **중간**: 로깅 시스템, 전역 Exception Filter
- 🟢 **낮음**: Skeleton UI

### 의존성
- "트랜잭션 로그"는 "Transaction 모델 추가" 완료 후 시작
- "프론트엔드 에러 핸들링"은 "백엔드 에러 응답 형식 통일" 완료 후 시작

---

## Phase 3: 사용자 경험 향상 (예상 기간: 3주)

### 🎯 목표
사용자가 **편리하게 거래할 수 있는 기능**을 추가합니다.
- 실시간 알림 시스템
- 고급 차트 (TradingView)
- 포트폴리오 분석
- 모바일 최적화

### 백엔드 체크리스트

#### 1. 알림 시스템
- [ ] **Notification 모델 추가** (파일: `packages/database/prisma/schema.prisma`)
  - 필드: id, userId, type, message, isRead, timestamp
- [ ] **NotificationService 구현** (파일: `apps/api/src/notification/notification.service.ts`)
  - 메서드: `createNotification(userId, type, message)`
  - 메서드: `getNotifications(userId, isRead?)`
  - 메서드: `markAsRead(notificationId)`
- [ ] **이벤트 기반 알림 생성**
  - 주문 체결 시
  - 주문 취소 시
  - 지정가 주문 부분 체결 시

#### 2. WebSocket 개선
- [ ] **market.gateway.ts 완성** (파일: `apps/api/src/market/market.gateway.ts`)
  - 실시간 시세 브로드캐스트
  - 오더북 업데이트 브로드캐스트
  - 사용자별 주문 체결 알림
- [ ] **인증된 WebSocket 연결**
  - JWT 기반 WebSocket 인증

#### 3. 통계 API
- [ ] **StatsController 구현** (파일: `apps/api/src/stats/stats.controller.ts`)
  - GET `/stats/portfolio` - 포트폴리오 가치, 수익률
  - GET `/stats/volume` - 24시간 거래량
- [ ] **StatsService 구현** (파일: `apps/api/src/stats/stats.service.ts`)
  - Prisma Aggregation 활용

### 프론트엔드 체크리스트

#### 1. 고급 차트
- [ ] **TradingView 위젯 연동** (파일: `apps/web/app/[locale]/(market)/market/components/trading-view-chart.tsx`)
  - 라이브러리: `react-tradingview-widget` 또는 직접 구현
  - 캔들스틱, 거래량, 지표 표시
- [ ] **차트 기간 선택**
  - 1분, 5분, 15분, 1시간, 1일

#### 2. 실시간 알림
- [ ] **알림 컴포넌트** (파일: `apps/web/components/notification-toast.tsx`)
  - 라이브러리: `react-hot-toast` 또는 `sonner`
- [ ] **WebSocket 알림 수신**
  - 주문 체결 시 토스트 표시
- [ ] **알림 목록 페이지** (파일: `apps/web/app/[locale]/notifications/page.tsx`)
  - 읽음/안 읽음 표시

#### 3. 포트폴리오 페이지
- [ ] **포트폴리오 대시보드** (파일: `apps/web/app/[locale]/portfolio/page.tsx`)
  - 총 자산 가치 (현재가 기준)
  - 자산별 비율 (파이 차트)
  - 24시간 수익률
- [ ] **차트 라이브러리 연동**
  - 라이브러리: `recharts` 또는 `chart.js`

#### 4. 모바일 최적화
- [ ] **반응형 레이아웃 개선**
  - 모바일에서 오더북 접기/펼치기
  - 주문 진입 폼 간소화
- [ ] **터치 제스처 지원**
  - 스와이프로 탭 전환

### 우선순위
- 🔴 **높음**: WebSocket 개선, 실시간 알림, 고급 차트
- 🟡 **중간**: 포트폴리오 페이지, 통계 API
- 🟢 **낮음**: 모바일 최적화

### 의존성
- "실시간 알림 (FE)"은 "WebSocket 개선" 완료 후 시작
- "포트폴리오 페이지"는 "통계 API" 완료 후 시작

---

## Phase 4: 관리 및 운영 기능 (예상 기간: 2주)

### 🎯 목표
거래소를 **운영하고 관리하는 기능**을 추가합니다.
- 관리자 페이지
- 사용자 관리
- 시스템 모니터링
- 외부 거래소 연동 (실제 시세)

### 백엔드 체크리스트

#### 1. 관리자 권한
- [ ] **User 모델 확장** (파일: `packages/database/prisma/schema.prisma`)
  - 필드: role (enum: 'USER', 'ADMIN')
- [ ] **Admin Guard** (파일: `apps/api/src/auth/admin.guard.ts`)
  - JWT에서 role 확인
- [ ] **AdminController** (파일: `apps/api/src/admin/admin.controller.ts`)
  - GET `/admin/users` - 사용자 목록
  - GET `/admin/stats` - 시스템 통계
  - POST `/admin/users/:id/suspend` - 사용자 정지

#### 2. 외부 거래소 API 연동
- [ ] **BinanceApiService** (파일: `apps/api/src/integrations/binance.service.ts`)
  - 실시간 시세 가져오기
  - WebSocket 스트림 연결
- [ ] **UpbitApiService** (파일: `apps/api/src/integrations/upbit.service.ts`)
  - 실시간 시세 가져오기
  - WebSocket 스트림 연결
- [ ] **MarketService 수정**
  - 하드코딩된 데이터 제거
  - 외부 API에서 실제 데이터 가져오기

#### 3. 시스템 모니터링
- [ ] **HealthController** (파일: `apps/api/src/health/health.controller.ts`)
  - GET `/health` - 서버 상태
  - GET `/health/db` - DB 연결 상태
- [ ] **Metrics 수집**
  - Prometheus 연동 고려
  - API 요청 수, 응답 시간 기록

### 프론트엔드 체크리스트

#### 1. 관리자 페이지
- [ ] **관리자 대시보드** (파일: `apps/web/app/[locale]/admin/page.tsx`)
  - 총 사용자 수
  - 24시간 거래량
  - 수수료 수익
- [ ] **사용자 관리 페이지** (파일: `apps/web/app/[locale]/admin/users/page.tsx`)
  - 사용자 목록 (페이지네이션)
  - 검색 기능
  - 정지/해제 버튼

#### 2. 시스템 상태 표시
- [ ] **상태 인디케이터** (파일: `apps/web/components/status-indicator.tsx`)
  - 헤더에 서버 상태 표시 (정상/오류)

### 우선순위
- 🔴 **높음**: 외부 거래소 API 연동, 관리자 권한
- 🟡 **중간**: 관리자 대시보드
- 🟢 **낮음**: 시스템 모니터링, 사용자 관리 페이지

### 의존성
- "관리자 페이지"는 "AdminController 구현" 완료 후 시작
- "외부 API 연동"은 독립적으로 진행 가능

---

## Phase 5: 배포 및 스케일링 (예상 기간: 2-3주)

### 🎯 목표
거래소를 **프로덕션 환경에 배포**하고 **확장 가능하게** 만듭니다.
- Docker 컨테이너화
- CI/CD 파이프라인
- 성능 최적화
- 백업 시스템

### 백엔드 체크리스트

#### 1. Docker 설정
- [ ] **Dockerfile 작성** (파일: `apps/api/Dockerfile`)
  - Multi-stage build (빌드 + 프로덕션)
- [ ] **docker-compose.yml** (파일: `docker-compose.yml`)
  - API 서버
  - PostgreSQL
  - Redis (세션/캐싱)

#### 2. 환경 설정
- [ ] **.env 파일 분리**
  - `.env.development`
  - `.env.production`
- [ ] **Secrets 관리**
  - AWS Secrets Manager 또는 환경 변수

#### 3. 성능 최적화
- [ ] **Redis 캐싱**
  - 시세 데이터 캐싱 (5초 TTL)
  - 오더북 캐싱
- [ ] **DB 인덱스 추가**
  - Order: userId, status, createdAt
  - WalletBalance: userId, asset
  - Trade: timestamp

#### 4. 백업 시스템
- [ ] **DB 자동 백업 스크립트**
  - 매일 새벽 3시 백업
  - S3 또는 로컬 스토리지 저장
- [ ] **복구 프로세스 문서화**

### 프론트엔드 체크리스트

#### 1. 프로덕션 빌드 최적화
- [ ] **Code Splitting**
  - Next.js Dynamic Import 활용
- [ ] **이미지 최적화**
  - Next.js Image 컴포넌트 사용
- [ ] **번들 크기 분석**
  - `@next/bundle-analyzer` 사용

#### 2. SEO 및 메타 데이터
- [ ] **Meta 태그 설정** (파일: `apps/web/app/layout.tsx`)
  - title, description, og:image
- [ ] **sitemap.xml 생성**

#### 3. 성능 모니터링
- [ ] **Web Vitals 측정**
  - Core Web Vitals (LCP, FID, CLS)
- [ ] **Error Tracking**
  - Sentry 연동

### DevOps 체크리스트

#### 1. CI/CD 파이프라인
- [ ] **GitHub Actions 워크플로우** (파일: `.github/workflows/deploy.yml`)
  - 테스트 실행
  - 빌드
  - 프로덕션 배포
- [ ] **자동 배포 설정**
  - main 브랜치 merge 시 자동 배포

#### 2. 인프라 설정
- [ ] **클라우드 선택**
  - AWS, GCP, 또는 Azure
- [ ] **Load Balancer 설정**
  - 트래픽 분산
- [ ] **Auto Scaling 설정**
  - CPU 사용률 기준 스케일링

#### 3. 모니터링 및 알림
- [ ] **로그 집계**
  - ELK Stack 또는 CloudWatch
- [ ] **알림 설정**
  - 서버 다운 시 Slack/이메일 알림

### 우선순위
- 🔴 **높음**: Docker 설정, 환경 설정, DB 인덱스
- 🟡 **중간**: CI/CD 파이프라인, Redis 캐싱
- 🟢 **낮음**: Auto Scaling, SEO, Web Vitals

### 의존성
- "프로덕션 배포"는 모든 Phase 1-4 완료 후 시작
- "CI/CD 파이프라인"은 "Docker 설정" 완료 후 시작

---

## 🎯 전체 우선순위 요약

### 최우선 (Phase 1)
1. 주문 매칭 엔진 구현
2. 거래 수수료 시스템
3. Trade 모델 및 거래 내역 API

### 2순위 (Phase 2)
1. API Rate Limiting
2. 트랜잭션 로그 시스템
3. 입력 검증 강화

### 3순위 (Phase 3)
1. WebSocket 실시간 통신 완성
2. 알림 시스템
3. 고급 차트 (TradingView)

### 4순위 (Phase 4)
1. 외부 거래소 API 연동 (실제 시세)
2. 관리자 기능

### 5순위 (Phase 5)
1. Docker 컨테이너화
2. CI/CD 파이프라인
3. 프로덕션 배포

---

## 📌 참고사항

### 개발 시 주의사항
- **매 Phase 완료 시 통합 테스트 수행**
- **Git 브랜치 전략**: feature → develop → main
- **코드 리뷰 필수**: 모든 PR은 최소 1명 승인 필요
- **API 버저닝**: `/api/v1/...` 형식 사용 고려

### 기술 스택 권장사항
- **캐싱**: Redis
- **로깅**: Winston (백엔드), Sentry (프론트엔드)
- **차트**: TradingView Widget 또는 Lightweight Charts
- **알림**: react-hot-toast 또는 sonner
- **테스트**: Jest (백엔드), Vitest (프론트엔드)

### 성능 목표
- **API 응답 시간**: 평균 200ms 이하
- **주문 매칭 속도**: 1초 이내
- **WebSocket 메시지 지연**: 100ms 이하
- **프론트엔드 초기 로딩**: 3초 이내

---

**작성일**: 2026-02-28
**작성자**: 암호화폐 거래소 기획팀
**버전**: 1.0
