$ARGUMENTS 설명을 기반으로 NestJS + Next.js 풀스택 엔드포인트를 생성하세요.

## 백엔드 (apps/api)
기존 orders/ 모듈 패턴을 참고:
- `src/{도메인}/{도메인}.controller.ts` — AuthRequest는 `../common/types/auth-request.type.ts`에서 임포트
- `src/{도메인}/{도메인}.service.ts`
- `src/{도메인}/dto/*.dto.ts` — class-validator 데코레이터 필수 (@IsEnum, @IsNumber 등)
- `src/{도메인}/{도메인}.module.ts` — AuthModule 임포트
- `src/app.module.ts`에 새 모듈 등록
- 자산 관련 상수는 `common/constants/assets.ts` 참조

## 프론트엔드 (apps/web)
기존 orders 패턴을 참고:
- `lib/api/{도메인}.api.ts` — customFetch 사용, 쿼리키도 이 파일에 포함
- `lib/hooks/use{도메인}.ts` — React Query 훅 (useQuery/useMutation)
- 에러 처리 패턴은 useOrders.ts의 extractErrorMessage 참고

## 검증
1. `npx tsc --noEmit --project apps/api/tsconfig.json`
2. `npx tsc --noEmit --project apps/web/tsconfig.json` (기존 에러 제외 신규 에러 0건 확인)
