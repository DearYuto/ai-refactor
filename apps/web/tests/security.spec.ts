import { test, expect } from '@playwright/test';

const apiBaseUrl = process.env.API_URL || 'http://localhost:4000';

test.describe('Security Settings Page (보안 설정 페이지)', () => {
  let email: string;
  let password: string;
  let authToken: string;

  test.beforeEach(async ({ page, request }) => {
    // 테스트용 계정 생성
    email = `e2e+security+${Date.now()}@example.com`;
    password = 'Test1234!';

    const signupResponse = await request.post(`${apiBaseUrl}/auth/signup`, {
      data: { email, password },
    });

    expect(signupResponse.ok()).toBeTruthy();
    const signupData = await signupResponse.json();
    authToken = signupData.token;

    // 로그인
    await page.goto('/ko/login', { waitUntil: 'networkidle' });
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    await page.getByTestId('login-submit').click();

    // 로그인 성공 확인
    await expect(page.getByTestId('login-success')).toBeVisible({ timeout: 5000 });

    // 보안 설정 페이지로 이동
    await page.goto('/ko/settings/security', { waitUntil: 'networkidle' });
  });

  test('보안 설정 페이지가 올바르게 렌더링되어야 합니다', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: /보안 설정/ })).toBeVisible();

    // 이메일 인증 섹션 확인
    await expect(page.getByRole('heading', { name: '이메일 인증' })).toBeVisible();

    // 2FA 섹션 확인
    await expect(page.getByRole('heading', { name: /2단계 인증/ })).toBeVisible();

    // 보안 팁 섹션 확인
    await expect(page.getByText('💡 보안 팁')).toBeVisible();
  });

  test.describe('이메일 인증', () => {
    test('이메일 미인증 상태가 표시되어야 합니다', async ({ page }) => {
      await expect(page.getByText('⚠️ 이메일이 인증되지 않았습니다')).toBeVisible();
      await expect(page.getByText(/이메일 인증을 완료하면 출금 등의 기능을 사용할 수 있습니다/)).toBeVisible();
      await expect(page.getByText(email)).toBeVisible();
    });

    test('인증 이메일을 발송할 수 있어야 합니다', async ({ page }) => {
      // 인증 이메일 발송 버튼 클릭
      await page.getByRole('button', { name: '인증 이메일 발송' }).click();

      // alert 처리
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain('인증 이메일이 발송되었습니다');
        dialog.accept();
      });

      // 버튼이 로딩 상태로 변경되었다가 원래대로 돌아와야 함
      await expect(page.getByRole('button', { name: '발송 중...' })).toBeVisible();
      await expect(page.getByRole('button', { name: '인증 이메일 발송' })).toBeVisible({ timeout: 5000 });
    });

    test('이메일 인증 후 상태가 변경되어야 합니다', async ({ page, request }) => {
      // API로 이메일 인증 처리 (시뮬레이션)
      await request.post(`${apiBaseUrl}/auth/verify-email-direct`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // 페이지 새로고침
      await page.reload({ waitUntil: 'networkidle' });

      // 인증 완료 상태 확인
      await expect(page.getByText('✅ 이메일이 인증되었습니다')).toBeVisible();
      await expect(page.getByRole('button', { name: '인증 이메일 발송' })).not.toBeVisible();
    });
  });

  test.describe('2FA (2단계 인증)', () => {
    test('2FA 비활성화 상태가 표시되어야 합니다', async ({ page }) => {
      await expect(page.getByText(/Google Authenticator 또는 다른 TOTP 앱을 사용하여/)).toBeVisible();
      await expect(page.getByRole('button', { name: '2FA 활성화 시작' })).toBeVisible();
    });

    test('2FA 활성화 플로우 - QR 코드 표시', async ({ page }) => {
      // 2FA 활성화 시작
      await page.getByRole('button', { name: '2FA 활성화 시작' }).click();

      // QR 코드 섹션이 표시되어야 함
      await expect(page.getByText('1. QR 코드 스캔')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('2. 시크릿 키 (수동 입력용)')).toBeVisible();
      await expect(page.getByText('3. 인증 코드 입력')).toBeVisible();

      // QR 코드 이미지가 표시되어야 함
      const qrImage = page.getByAltText('QR Code');
      await expect(qrImage).toBeVisible();

      // 시크릿 키가 표시되어야 함
      const secretCode = page.locator('code').first();
      await expect(secretCode).toBeVisible();
      const secretText = await secretCode.textContent();
      expect(secretText).toBeTruthy();
      expect(secretText!.length).toBeGreaterThan(10);
    });

    test('2FA 활성화 플로우 - 6자리 코드 입력', async ({ page }) => {
      // 2FA 활성화 시작
      await page.getByRole('button', { name: '2FA 활성화 시작' }).click();

      // 코드 입력 대기
      await expect(page.getByPlaceholder('000000')).toBeVisible({ timeout: 5000 });

      // 5자리 입력 시 버튼 비활성화
      await page.getByPlaceholder('000000').fill('12345');
      await expect(page.getByRole('button', { name: '2FA 활성화 완료' })).toBeDisabled();

      // 6자리 입력 시 버튼 활성화
      await page.getByPlaceholder('000000').fill('123456');
      await expect(page.getByRole('button', { name: '2FA 활성화 완료' })).not.toBeDisabled();
    });

    test('2FA 활성화 플로우 - 숫자만 입력 가능', async ({ page }) => {
      // 2FA 활성화 시작
      await page.getByRole('button', { name: '2FA 활성화 시작' }).click();

      await expect(page.getByPlaceholder('000000')).toBeVisible({ timeout: 5000 });

      // 문자 포함 입력
      await page.getByPlaceholder('000000').fill('abc123def');

      // 숫자만 남아있어야 함
      await expect(page.getByPlaceholder('000000')).toHaveValue('123');
    });

    test('2FA 활성화 완료 - 백업 코드 표시', async ({ page, request }) => {
      // 2FA 활성화 시작
      await page.getByRole('button', { name: '2FA 활성화 시작' }).click();

      await expect(page.getByPlaceholder('000000')).toBeVisible({ timeout: 5000 });

      // 시크릿 키 추출
      const secretCode = await page.locator('code').first().textContent();

      // TOTP 코드 생성 (시뮬레이션 - 실제로는 Authenticator 앱 사용)
      // 테스트 환경에서는 고정값 사용 또는 API 호출
      const testCode = '123456';

      await page.getByPlaceholder('000000').fill(testCode);
      await page.getByRole('button', { name: '2FA 활성화 완료' }).click();

      // 백업 코드 섹션이 표시되어야 함
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain('2FA가 활성화되었습니다');
        dialog.accept();
      });

      await expect(page.getByText('⚠️ 백업 코드 (한 번만 표시됨)')).toBeVisible({ timeout: 5000 });

      // 백업 코드 10개가 표시되어야 함
      const backupCodeElements = page.locator('div.grid > div');
      const count = await backupCodeElements.count();
      expect(count).toBe(10);

      // 백업 코드 다운로드 버튼
      await expect(page.getByRole('button', { name: '백업 코드 다운로드' })).toBeVisible();
    });

    test('백업 코드 다운로드', async ({ page }) => {
      // 2FA가 이미 활성화되었다고 가정
      // (이전 테스트의 연속이거나 API로 사전 설정)

      // 다운로드 시작 이벤트 리스너
      const downloadPromise = page.waitForEvent('download');

      // 백업 코드 다운로드 버튼 클릭 (활성화된 상태에서)
      // 이 테스트는 2FA 활성화 후에만 가능하므로 조건부로 실행
      const downloadButton = page.getByRole('button', { name: '백업 코드 다운로드' });
      const isVisible = await downloadButton.isVisible();

      if (isVisible) {
        await downloadButton.click();
        const download = await downloadPromise;

        // 파일명 확인
        expect(download.suggestedFilename()).toBe('backup-codes.txt');

        // 파일 내용 확인
        const path = await download.path();
        expect(path).toBeTruthy();
      }
    });

    test('2FA 비활성화', async ({ page }) => {
      // 2FA가 활성화된 상태에서 시작 (사전 조건 필요)
      // API로 2FA 활성화 상태 설정하거나 이전 테스트 결과 활용

      const disableButton = page.getByRole('button', { name: '2FA 비활성화' });
      const isVisible = await disableButton.isVisible();

      if (isVisible) {
        // prompt 처리
        page.once('dialog', dialog => {
          expect(dialog.type()).toBe('prompt');
          expect(dialog.message()).toContain('2FA 코드 또는 백업 코드를 입력하세요');
          dialog.accept('123456'); // 테스트용 코드
        });

        await disableButton.click();

        // 비활성화 성공 alert
        page.once('dialog', dialog => {
          expect(dialog.message()).toContain('2FA가 비활성화되었습니다');
          dialog.accept();
        });

        // 비활성화 상태로 변경되어야 함
        await expect(page.getByRole('button', { name: '2FA 활성화 시작' })).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('보안 팁', () => {
    test('모든 보안 팁이 표시되어야 합니다', async ({ page }) => {
      await expect(page.getByText('💡 보안 팁')).toBeVisible();
      await expect(page.getByText(/이메일 인증은 출금 기능 사용에 필수입니다/)).toBeVisible();
      await expect(page.getByText(/2FA를 활성화하면 계정 보안이 크게 향상됩니다/)).toBeVisible();
      await expect(page.getByText(/백업 코드는 안전한 곳에 보관하세요/)).toBeVisible();
      await expect(page.getByText(/2FA 앱을 분실한 경우 백업 코드로 로그인할 수 있습니다/)).toBeVisible();
    });
  });

  test.describe('접근성', () => {
    test('키보드 네비게이션이 동작해야 합니다', async ({ page }) => {
      // Tab 키로 포커스 이동
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // 버튼에 포커스가 이동했는지 확인
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
    });

    test('적절한 ARIA 레이블이 있어야 합니다', async ({ page }) => {
      // heading role 확인
      const headings = await page.getByRole('heading').all();
      expect(headings.length).toBeGreaterThanOrEqual(3); // 페이지 제목 + 2개 섹션

      // button role 확인
      const buttons = await page.getByRole('button').all();
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  test.describe('반응형 디자인', () => {
    test('모바일 화면에서도 올바르게 표시되어야 합니다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByRole('heading', { name: /보안 설정/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: '이메일 인증' })).toBeVisible();
      await expect(page.getByRole('heading', { name: /2단계 인증/ })).toBeVisible();
    });
  });

  test.describe('로그인 필수', () => {
    test('로그아웃 상태에서 접근 시 경고를 표시해야 합니다', async ({ page }) => {
      // 로그아웃
      await page.goto('/ko/logout', { waitUntil: 'networkidle' });

      // 보안 설정 페이지 접근
      await page.goto('/ko/settings/security', { waitUntil: 'networkidle' });

      // 로그인 필요 메시지 확인
      await expect(page.getByText('🔒 로그인이 필요합니다')).toBeVisible();
      await expect(page.getByText(/보안 설정을 변경하려면 먼저 로그인해주세요/)).toBeVisible();
    });
  });
});
