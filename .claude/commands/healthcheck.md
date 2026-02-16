모노레포 전체 코드 상태를 검증하고 결과를 요약하세요.

검증 항목:
1. API 타입 체크: `npx tsc --noEmit --project apps/api/tsconfig.json`
2. Web 타입 체크: `npx tsc --noEmit --project apps/web/tsconfig.json`
   - .next/types/, i18n 관련 에러는 pre-existing이므로 무시
3. 린트: `bun run lint`
4. API 테스트: `cd apps/api && bun run test`

결과를 아래 형식으로 보여주세요:
| 항목 | 결과 | 비고 |
|------|------|------|
| API tsc | PASS/FAIL | 에러 수 |
| Web tsc | PASS/FAIL | 신규 에러만 카운트 |
| Lint | PASS/FAIL | 에러 수 |
| API Test | PASS/FAIL | 통과/실패 수 |
