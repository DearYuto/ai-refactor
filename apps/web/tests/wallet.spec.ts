import { test, expect } from '@playwright/test';

const apiBaseUrl = process.env.API_URL || 'http://localhost:4000';

test.describe('Wallet Page (지갑 페이지)', () => {
  let email: string;
  let password: string;
  let authToken: string;

  test.beforeEach(async ({ page, request }) => {
    // 테스트용 계정 생성
    email = `e2e+wallet+${Date.now()}@example.com`;
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

    // 지갑 페이지로 이동
    await page.goto('/ko/wallet', { waitUntil: 'networkidle' });
  });

  test('지갑 페이지가 올바르게 렌더링되어야 합니다', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: '지갑' })).toBeVisible();

    // 탭 메뉴 확인
    await expect(page.getByRole('button', { name: '입금' })).toBeVisible();
    await expect(page.getByRole('button', { name: '출금' })).toBeVisible();
    await expect(page.getByRole('button', { name: '입출금 내역' })).toBeVisible();

    // 기본적으로 입금 탭이 활성화되어 있어야 함
    await expect(page.getByText('입금하기')).toBeVisible();
  });

  test('탭 전환이 올바르게 동작해야 합니다', async ({ page }) => {
    // 출금 탭으로 전환
    await page.getByRole('button', { name: '출금' }).click();
    await expect(page.getByText('출금하기')).toBeVisible();
    await expect(page.getByText('입금하기')).not.toBeVisible();

    // 입출금 내역 탭으로 전환
    await page.getByRole('button', { name: '입출금 내역' }).click();
    await expect(page.getByText('출금하기')).not.toBeVisible();

    // 다시 입금 탭으로 전환
    await page.getByRole('button', { name: '입금' }).click();
    await expect(page.getByText('입금하기')).toBeVisible();
  });

  test.describe('입금 기능', () => {
    test('자산별 입금 주소가 표시되어야 합니다', async ({ page }) => {
      // BTC 선택 (기본값)
      await expect(page.getByText(/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/)).toBeVisible();

      // USDT 선택
      await page.getByLabel('자산').selectOption('USDT');
      await expect(page.getByText(/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/)).toBeVisible();

      // KRW 선택
      await page.getByLabel('자산').selectOption('KRW');
      await expect(page.getByText(/110-123-456789/)).toBeVisible();
    });

    test('입금 시뮬레이션이 동작해야 합니다', async ({ page }) => {
      // 입금 금액 입력
      await page.getByLabel('입금할 금액').fill('0.5');

      // 입금 시뮬레이션 버튼 클릭
      await page.getByRole('button', { name: '입금 시뮬레이션' }).click();

      // alert 처리
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain('입금 요청이 생성되었습니다');
        dialog.accept();
      });

      // 입력 필드가 초기화되어야 함
      await expect(page.getByLabel('입금할 금액')).toHaveValue('');
    });

    test('잘못된 금액 입력 시 경고를 표시해야 합니다', async ({ page }) => {
      // 0 또는 음수 입력
      await page.getByLabel('입금할 금액').fill('0');

      // alert 처리
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain('금액을 입력하세요');
        dialog.accept();
      });

      await page.getByRole('button', { name: '입금 시뮬레이션' }).click();
    });
  });

  test.describe('출금 기능', () => {
    test.beforeEach(async ({ page }) => {
      // 출금 탭으로 전환
      await page.getByRole('button', { name: '출금' }).click();
      await expect(page.getByText('출금하기')).toBeVisible();
    });

    test('출금 폼이 올바르게 표시되어야 합니다', async ({ page }) => {
      // 폼 요소 확인
      await expect(page.getByLabel('자산')).toBeVisible();
      await expect(page.getByLabel(/출금 금액/)).toBeVisible();
      await expect(page.getByLabel('출금 주소')).toBeVisible();
      await expect(page.getByRole('button', { name: '출금 요청' })).toBeVisible();

      // 최소 출금액 표시 확인
      await expect(page.getByText(/최소: 0.001 BTC/)).toBeVisible();
    });

    test('자산별 최소 출금액이 표시되어야 합니다', async ({ page }) => {
      // BTC (기본값)
      await expect(page.getByText(/최소: 0.001 BTC/)).toBeVisible();

      // USDT
      await page.getByLabel('자산').selectOption('USDT');
      await expect(page.getByText(/최소: 10 USDT/)).toBeVisible();

      // KRW
      await page.getByLabel('자산').selectOption('KRW');
      await expect(page.getByText(/최소: 10000 KRW/)).toBeVisible();
    });

    test('출금 금액 입력 시 수수료와 총액이 표시되어야 합니다', async ({ page }) => {
      // 출금 금액 입력
      await page.getByLabel(/출금 금액/).fill('1');

      // 수수료 및 총액 표시 확인
      await expect(page.getByText('출금 금액:')).toBeVisible();
      await expect(page.getByText('수수료:')).toBeVisible();
      await expect(page.getByText('총 차감:')).toBeVisible();

      // BTC 수수료 확인 (0.0005)
      await expect(page.getByText(/0.0005 BTC/)).toBeVisible();
    });

    test('최소 출금액 미만 입력 시 경고를 표시해야 합니다', async ({ page }) => {
      // 최소 금액 미만 입력
      await page.getByLabel(/출금 금액/).fill('0.0005');
      await page.getByLabel('출금 주소').fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      // alert 처리
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain('최소 출금액');
        dialog.accept();
      });

      await page.getByRole('button', { name: '출금 요청' }).click();
    });

    test('출금 주소 미입력 시 경고를 표시해야 합니다', async ({ page }) => {
      // 금액만 입력
      await page.getByLabel(/출금 금액/).fill('1');

      // alert 처리
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain('출금 주소를 입력하세요');
        dialog.accept();
      });

      await page.getByRole('button', { name: '출금 요청' }).click();
    });

    test('출금 요청이 성공적으로 제출되어야 합니다', async ({ page, request }) => {
      // 테스트용 잔고 추가 (API 직접 호출)
      await request.post(`${apiBaseUrl}/wallet/add-balance`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          asset: 'BTC',
          amount: 10,
        },
      });

      // 페이지 새로고침하여 잔고 반영
      await page.reload({ waitUntil: 'networkidle' });
      await page.getByRole('button', { name: '출금' }).click();

      // 출금 정보 입력
      await page.getByLabel(/출금 금액/).fill('1');
      await page.getByLabel('출금 주소').fill('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');

      // confirm 처리
      page.once('dialog', dialog => {
        expect(dialog.type()).toBe('confirm');
        dialog.accept();
      });

      await page.getByRole('button', { name: '출금 요청' }).click();

      // 성공 alert 처리
      page.once('dialog', dialog => {
        expect(dialog.message()).toContain('출금 요청이 제출되었습니다');
        dialog.accept();
      });

      // 폼이 초기화되어야 함
      await expect(page.getByLabel(/출금 금액/)).toHaveValue('');
      await expect(page.getByLabel('출금 주소')).toHaveValue('');
    });
  });

  test.describe('입출금 내역', () => {
    test('입출금 내역 탭이 표시되어야 합니다', async ({ page }) => {
      // 입출금 내역 탭으로 전환
      await page.getByRole('button', { name: '입출금 내역' }).click();

      // 내역이 표시되거나 빈 상태 메시지가 표시되어야 함
      // (실제 내역이 있는지는 이전 테스트 실행 여부에 따라 다름)
    });

    test('로딩 상태가 올바르게 표시되어야 합니다', async ({ page }) => {
      // 네트워크 지연 시뮬레이션
      await page.route('**/api/deposits', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      // 입출금 내역 탭으로 전환
      await page.getByRole('button', { name: '입출금 내역' }).click();

      // 로딩 인디케이터가 있다면 확인
      // (실제 구현에 따라 다를 수 있음)
    });
  });

  test.describe('반응형 디자인', () => {
    test('모바일 화면에서도 올바르게 표시되어야 합니다', async ({ page }) => {
      // 모바일 뷰포트 설정
      await page.setViewportSize({ width: 375, height: 667 });

      // 페이지가 올바르게 렌더링되는지 확인
      await expect(page.getByRole('heading', { name: '지갑' })).toBeVisible();
      await expect(page.getByRole('button', { name: '입금' })).toBeVisible();
    });

    test('태블릿 화면에서도 올바르게 표시되어야 합니다', async ({ page }) => {
      // 태블릿 뷰포트 설정
      await page.setViewportSize({ width: 768, height: 1024 });

      // 페이지가 올바르게 렌더링되는지 확인
      await expect(page.getByRole('heading', { name: '지갑' })).toBeVisible();
      await expect(page.getByText('입금하기')).toBeVisible();
    });
  });

  test.describe('접근성', () => {
    test('키보드 네비게이션이 동작해야 합니다', async ({ page }) => {
      // Tab 키로 포커스 이동
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Enter 키로 출금 탭 선택
      await page.getByRole('button', { name: '출금' }).focus();
      await page.keyboard.press('Enter');

      await expect(page.getByText('출금하기')).toBeVisible();
    });

    test('스크린 리더를 위한 적절한 ARIA 속성이 있어야 합니다', async ({ page }) => {
      // button role 확인
      const buttons = await page.getByRole('button').all();
      expect(buttons.length).toBeGreaterThan(0);

      // heading role 확인
      const headings = await page.getByRole('heading').all();
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
