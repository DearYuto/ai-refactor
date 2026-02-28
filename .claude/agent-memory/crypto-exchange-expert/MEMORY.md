# Crypto Exchange Expert - Project Memory

## 프로젝트 개요
- **Repo**: `/Users/reason/Desktop/2026/ai-refactor`
- **Monorepo**: Turborepo (apps/web + apps/api)
- **Frontend**: Next.js 16 + App Router + Tailwind + lightweight-charts
- **Backend**: NestJS 11 + Socket.IO + JWT 인증
- **i18n**: next-intl (ko/en), 라우팅: `[locale]/(market)/market`

## 현재 구현 상태 (프로토타입)
- BTC 단일 페어 (BINANCE USDT / UPBIT KRW 전환 가능)
- 주문 유형: 시장가(market)만 지원
- 저장소: 인메모리 (Map<email, records>)
- 주문 매칭: 없음 (외부 거래소 실시간가로 즉시 체결)
- Prisma + Database 모듈 존재하나 미사용
- 기본 잔고: KRW 1,000,000 / BTC 0.5 / USDT 2,000

## 핵심 아키텍처 패턴
- Next.js API Routes = BFF 프록시 (Binance/Upbit → 클라이언트)
- WebSocket (primary) + HTTP Polling (fallback) 이중 수집
- MarketStreamService → Socket.IO Gateway → 클라이언트 (2초 간격)
- OrdersService: swapBalances 원자성 보장 (인메모리)

## 데이터 파이프라인
- Binance: BTCUSDT klines/ticker/orderbook/trades
- Upbit: KRW-BTC ticker/orderbook/trades
- 인터벌: 1m/5m/15m/1h

## 컬러 토큰 (CSS Variables)
- Buy: `--color-buy`, `--color-buy-border`, `--color-buy-bg`
- Sell: `--color-sell`, `--color-sell-border`, `--color-sell-bg`
- 배경: `--color-bg-main` (#0b1220), `--color-surface` (#13203a)

## 관련 기획 세션
- 2026-02-18: 마켓 페이지 추가 기능 기획 (상세 내용: feature-planning.md 참조)
