NestJS API 서버를 실행하고, Orval로 OpenAPI 스펙에서 프론트엔드 타입과 React Query 훅을 생성한 뒤, 서버를 종료하세요.

절차:
1. `cd apps/api && bun run start` 으로 API 서버 백그라운드 실행 (포트 8000)
2. http://localhost:8000/openapi.json 이 응답할 때까지 대기 (최대 15초)
3. `cd apps/web && bunx orval` 실행하여 lib/api/generated.ts 재생성
4. API 서버 프로세스 종료
5. `npx tsc --noEmit --project apps/web/tsconfig.json` 으로 생성된 코드 타입 체크
6. 변경된 파일 목록과 결과 요약 출력
