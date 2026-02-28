# 보안 기능 구현 가이드

## 📁 구현된 파일 목록

### API 클라이언트
- `apps/web/lib/api/security.api.ts` - 모든 보안 관련 API 호출

### 상태 관리
- `apps/web/lib/store.ts` - Zustand 인증 상태 관리 (AuthStore 추가)

### 페이지
- `apps/web/app/[locale]/(market)/settings/security/page.tsx` - 보안 설정 메인 페이지
- `apps/web/app/[locale]/auth/verify-email/page.tsx` - 이메일 인증 확인 페이지

### 컴포넌트
- `apps/web/app/[locale]/(market)/settings/security/components/two-factor-section.tsx` - 2FA 설정
- `apps/web/app/[locale]/(market)/settings/security/components/email-verification-section.tsx` - 이메일 인증

### 수정된 파일
- `apps/web/app/[locale]/(auth)/login/components/login-form.tsx` - 2FA 로그인 지원 추가

## 🔗 접근 경로

### 보안 설정 페이지
```
/ko/settings/security
```

### 이메일 인증 확인
```
/ko/auth/verify-email?token=<verification-token>
```

### 로그인 페이지
```
/ko/login
```

## 🚀 사용 방법

### 1. 이메일 인증

1. `/ko/settings/security`로 이동
2. "인증 이메일 발송" 버튼 클릭
3. 이메일에서 인증 링크 클릭
4. 자동으로 보안 설정 페이지로 리다이렉트

### 2. 2FA 설정

1. `/ko/settings/security`로 이동
2. "2FA 활성화 시작" 버튼 클릭
3. Google Authenticator 앱으로 QR 코드 스캔
4. 앱에 표시된 6자리 코드 입력
5. 백업 코드 다운로드 (중요!)

### 3. 2FA 로그인

1. `/ko/login`에서 이메일/비밀번호 입력
2. 2FA가 활성화된 계정이면 2FA 코드 입력 필드 표시
3. Google Authenticator 앱의 6자리 코드 입력
4. 로그인 완료

## 🔧 백엔드 API 요구사항

프론트엔드가 정상 작동하려면 다음 백엔드 API가 필요합니다:

### 2FA API
```
POST /auth/2fa/setup
POST /auth/2fa/enable
POST /auth/2fa/disable
GET  /auth/2fa/backup-codes
POST /auth/2fa/backup-codes/regenerate
```

### 이메일 인증 API
```
POST /auth/email/send-verification
GET  /auth/email/verify?token=<token>
```

### 로그인 API (수정 필요)
```typescript
POST /auth/login

Request Body:
{
  email: string;
  password: string;
  twoFactorToken?: string;  // 추가됨
}

Response:
{
  requiresTwoFactor?: boolean;  // 2FA 필요 시
  accessToken?: string;
  user?: {
    id: string;
    email: string;
    emailVerified: boolean;
    twoFactorEnabled?: boolean;
  }
}
```

## 📋 타입 정의

### User 타입
```typescript
interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
}
```

### 2FA Response 타입
```typescript
interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string; // Data URL
}

interface BackupCodesResponse {
  backupCodes: string[];
}
```

## 🎨 UI 특징

### 색상 코드
- ✅ 성공: 초록색 (`bg-green-50`, `text-green-700`)
- ⚠️ 경고: 노란색 (`bg-yellow-50`, `text-yellow-700`)
- ❌ 에러: 빨간색 (`bg-red-50`, `text-red-700`)
- 📘 정보: 파란색 (`bg-blue-50`, `text-blue-700`)

### 로딩 상태
- 버튼 비활성화: `disabled:bg-gray-300`
- 로딩 텍스트: "처리 중...", "발송 중..."

### 백업 코드
- 2열 그리드 레이아웃
- 폰트: `font-mono`
- 다운로드 버튼 제공

## 🧪 테스트 체크리스트

### 이메일 인증
- [ ] 인증 이메일 발송 버튼 작동
- [ ] 이메일 인증 링크 클릭 시 확인 페이지 표시
- [ ] 인증 완료 후 보안 설정 페이지로 리다이렉트
- [ ] 인증 완료 상태 UI 업데이트

### 2FA 설정
- [ ] QR 코드 표시
- [ ] 시크릿 키 복사 가능
- [ ] 6자리 코드만 입력 가능 (숫자만)
- [ ] 백업 코드 표시 및 다운로드
- [ ] 2FA 활성화/비활성화 토글

### 2FA 로그인
- [ ] 일반 로그인 후 2FA 필드 표시
- [ ] 6자리 코드 입력 제한
- [ ] 잘못된 코드 입력 시 에러 표시
- [ ] 올바른 코드로 로그인 성공
- [ ] 로그인 후 마켓 페이지 리다이렉트

## ⚠️ 주의사항

1. **백업 코드는 한 번만 표시됨** - 사용자가 반드시 다운로드하도록 안내
2. **QR 코드는 Data URL 형식** - img src에 직접 사용 가능
3. **2FA 코드는 6자리 숫자만** - 입력 제한 필수
4. **localStorage와 Zustand 동기화** - 기존 코드와의 호환성 유지
5. **에러 처리 필수** - 모든 API 호출에 try-catch

## 🔐 보안 고려사항

1. **토큰 저장**: localStorage와 Zustand persist 사용
2. **자동 로그아웃**: 토큰 만료 시 처리 필요 (추후 구현)
3. **HTTPS 필수**: 프로덕션 환경에서는 반드시 HTTPS 사용
4. **백업 코드 보관**: 사용자에게 안전한 보관 강조

## 📝 다음 단계

1. 백엔드 API 완성 대기
2. 실제 API와 연동 테스트
3. 에러 케이스 처리 강화
4. 네비게이션 메뉴에 보안 설정 링크 추가
5. 다국어 지원 (i18n)
6. 접근성 개선 (ARIA 속성 추가)

---

**구현 완료일**: 2026-02-28
**작성자**: Frontend Developer (Phase 4)
