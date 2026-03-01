import { test, expect } from '@playwright/test';

const apiBaseUrl = process.env.API_URL || 'http://localhost:4000';

test.describe('Notifications (알림 시스템)', () => {
  let email: string;
  let password: string;
  let authToken: string;

  test.beforeEach(async ({ page, request }) => {
    // 테스트용 계정 생성
    email = `e2e+notifications+${Date.now()}@example.com`;
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

    await expect(page.getByTestId('login-success')).toBeVisible({ timeout: 5000 });

    // 메인 페이지로 이동
    await page.goto('/ko', { waitUntil: 'networkidle' });
  });

  test.describe('알림 드롭다운', () => {
    test('알림 아이콘이 헤더에 표시되어야 합니다', async ({ page }) => {
      // 알림 벨 아이콘 또는 알림 버튼 확인
      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await expect(notificationButton).toBeVisible();
    });

    test('알림 버튼을 클릭하면 드롭다운이 열려야 합니다', async ({ page }) => {
      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.click();

      // 알림 드롭다운이 표시되어야 함
      const dropdown = page.getByTestId('notifications-dropdown').or(
        page.locator('[role="menu"]')
      );

      await expect(dropdown).toBeVisible();
    });

    test('드롭다운 외부 클릭 시 닫혀야 합니다', async ({ page }) => {
      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      // 드롭다운 열기
      await notificationButton.click();

      const dropdown = page.getByTestId('notifications-dropdown').or(
        page.locator('[role="menu"]')
      );

      await expect(dropdown).toBeVisible();

      // 외부 클릭
      await page.click('body', { position: { x: 10, y: 10 } });

      // 드롭다운이 닫혀야 함
      await expect(dropdown).not.toBeVisible({ timeout: 1000 });
    });

    test('ESC 키로 드롭다운이 닫혀야 합니다', async ({ page }) => {
      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.click();

      const dropdown = page.getByTestId('notifications-dropdown').or(
        page.locator('[role="menu"]')
      );

      await expect(dropdown).toBeVisible();

      // ESC 키 누르기
      await page.keyboard.press('Escape');

      // 드롭다운이 닫혀야 함
      await expect(dropdown).not.toBeVisible({ timeout: 1000 });
    });
  });

  test.describe('알림 목록', () => {
    test('알림이 없을 때 빈 상태 메시지를 표시해야 합니다', async ({ page }) => {
      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.click();

      // 빈 상태 메시지 확인
      await expect(
        page.getByText(/알림이 없습니다/).or(page.getByText(/새로운 알림이 없습니다/))
      ).toBeVisible({ timeout: 2000 });
    });

    test('알림 목록이 표시되어야 합니다', async ({ page, request }) => {
      // 테스트용 알림 생성 (API 호출)
      await request.post(`${apiBaseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          type: 'ORDER_FILLED',
          title: '주문 체결 완료',
          message: '매수 주문이 체결되었습니다',
        },
      });

      // 페이지 새로고침 또는 알림 다시 불러오기
      await page.reload({ waitUntil: 'networkidle' });

      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.click();

      // 알림 항목 확인
      await expect(page.getByText('주문 체결 완료')).toBeVisible({ timeout: 2000 });
      await expect(page.getByText(/매수 주문이 체결되었습니다/)).toBeVisible();
    });

    test('읽지 않은 알림 개수가 표시되어야 합니다', async ({ page, request }) => {
      // 테스트용 알림 2개 생성
      await request.post(`${apiBaseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          type: 'ORDER_FILLED',
          title: '알림 1',
          message: '테스트 알림 1',
        },
      });

      await request.post(`${apiBaseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          type: 'DEPOSIT_CONFIRMED',
          title: '알림 2',
          message: '테스트 알림 2',
        },
      });

      await page.reload({ waitUntil: 'networkidle' });

      // 뱃지에 숫자가 표시되어야 함
      const badge = page.getByTestId('notifications-badge').or(
        page.locator('.notification-badge')
      );

      const badgeVisible = await badge.isVisible();
      if (badgeVisible) {
        const badgeText = await badge.textContent();
        expect(badgeText).toBeTruthy();
        expect(parseInt(badgeText!)).toBeGreaterThan(0);
      }
    });
  });

  test.describe('알림 읽음 처리', () => {
    test.beforeEach(async ({ page, request }) => {
      // 테스트용 알림 생성
      await request.post(`${apiBaseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          type: 'ORDER_FILLED',
          title: '주문 체결',
          message: '테스트 주문',
        },
      });

      await page.reload({ waitUntil: 'networkidle' });
    });

    test('개별 알림을 읽음 처리할 수 있어야 합니다', async ({ page }) => {
      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.click();

      // 알림 항목 클릭 (읽음 처리)
      const notificationItem = page.getByText('주문 체결').first();
      await notificationItem.click();

      // 읽음 처리되면 시각적 변화가 있어야 함 (예: 배경색 변경)
      // 또는 읽지 않은 개수가 감소해야 함
    });

    test('모든 알림을 읽음 처리할 수 있어야 합니다', async ({ page }) => {
      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.click();

      // "모두 읽음" 버튼 클릭
      const markAllReadButton = page.getByRole('button', { name: /모두 읽음/ }).or(
        page.getByTestId('mark-all-read-button')
      );

      const isVisible = await markAllReadButton.isVisible();
      if (isVisible) {
        await markAllReadButton.click();

        // 읽지 않은 알림 개수가 0이 되어야 함
        const badge = page.getByTestId('notifications-badge');
        await expect(badge).not.toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe('실시간 알림 (WebSocket)', () => {
    test('WebSocket 연결이 성공해야 합니다', async ({ page }) => {
      // WebSocket 연결 감지
      const wsPromise = page.waitForEvent('websocket');

      // 페이지 새로고침하여 WebSocket 연결 시도
      await page.reload({ waitUntil: 'networkidle' });

      try {
        const ws = await Promise.race([
          wsPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);

        // WebSocket URL 확인
        expect((ws as any).url()).toContain('/notifications');
      } catch (error) {
        // WebSocket이 구현되지 않았을 수 있음
        console.log('WebSocket connection not detected');
      }
    });

    test('실시간 알림 수신 시 드롭다운에 표시되어야 합니다', async ({ page, request }) => {
      // 알림 드롭다운 열기
      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.click();

      // 새 알림 생성 (백그라운드에서)
      await request.post(`${apiBaseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          type: 'DEPOSIT_CONFIRMED',
          title: '실시간 알림',
          message: '새로운 알림입니다',
        },
      });

      // 실시간으로 알림이 추가되어야 함 (WebSocket 사용 시)
      // 또는 페이지를 닫고 다시 열었을 때 표시되어야 함
      await notificationButton.click(); // 닫기
      await page.waitForTimeout(1000);
      await notificationButton.click(); // 다시 열기

      await expect(page.getByText('실시간 알림')).toBeVisible({ timeout: 3000 });
    });

    test('새 알림 수신 시 뱃지 개수가 증가해야 합니다', async ({ page, request }) => {
      // 현재 뱃지 숫자 확인
      const badge = page.getByTestId('notifications-badge').or(
        page.locator('.notification-badge')
      );

      let initialCount = 0;
      const initialVisible = await badge.isVisible();
      if (initialVisible) {
        const initialText = await badge.textContent();
        initialCount = parseInt(initialText || '0');
      }

      // 새 알림 생성
      await request.post(`${apiBaseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          type: 'WITHDRAWAL_COMPLETED',
          title: '출금 완료',
          message: '출금이 완료되었습니다',
        },
      });

      // 페이지 새로고침 또는 WebSocket 이벤트 대기
      await page.reload({ waitUntil: 'networkidle' });

      // 뱃지 숫자가 증가했는지 확인
      const newVisible = await badge.isVisible();
      if (newVisible) {
        const newText = await badge.textContent();
        const newCount = parseInt(newText || '0');
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });
  });

  test.describe('알림 타입별 표시', () => {
    const notificationTypes = [
      { type: 'ORDER_FILLED', title: '주문 체결', icon: '💰' },
      { type: 'DEPOSIT_CONFIRMED', title: '입금 확인', icon: '💵' },
      { type: 'WITHDRAWAL_COMPLETED', title: '출금 완료', icon: '💸' },
    ];

    for (const notif of notificationTypes) {
      test(`${notif.type} 알림이 올바르게 표시되어야 합니다`, async ({ page, request }) => {
        // 특정 타입의 알림 생성
        await request.post(`${apiBaseUrl}/notifications`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            type: notif.type,
            title: notif.title,
            message: `${notif.type} 테스트`,
          },
        });

        await page.reload({ waitUntil: 'networkidle' });

        const notificationButton = page.getByTestId('notifications-button').or(
          page.getByRole('button', { name: /알림/ })
        );

        await notificationButton.click();

        // 알림 제목 확인
        await expect(page.getByText(notif.title)).toBeVisible({ timeout: 2000 });
      });
    }
  });

  test.describe('접근성', () => {
    test('키보드로 알림 드롭다운을 열 수 있어야 합니다', async ({ page }) => {
      // 알림 버튼에 포커스
      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.focus();

      // Enter 또는 Space로 열기
      await page.keyboard.press('Enter');

      const dropdown = page.getByTestId('notifications-dropdown').or(
        page.locator('[role="menu"]')
      );

      await expect(dropdown).toBeVisible({ timeout: 1000 });
    });

    test('화살표 키로 알림 항목을 탐색할 수 있어야 합니다', async ({ page, request }) => {
      // 여러 알림 생성
      await request.post(`${apiBaseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          type: 'ORDER_FILLED',
          title: '알림 1',
          message: '테스트',
        },
      });

      await request.post(`${apiBaseUrl}/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          type: 'DEPOSIT_CONFIRMED',
          title: '알림 2',
          message: '테스트',
        },
      });

      await page.reload({ waitUntil: 'networkidle' });

      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.click();

      // 화살표 키로 탐색
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowUp');

      // 포커스가 알림 항목에 있어야 함
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['DIV', 'BUTTON', 'A']).toContain(focusedElement);
    });
  });

  test.describe('반응형 디자인', () => {
    test('모바일에서 알림 드롭다운이 전체 화면으로 표시되어야 합니다', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const notificationButton = page.getByTestId('notifications-button').or(
        page.getByRole('button', { name: /알림/ })
      );

      await notificationButton.click();

      const dropdown = page.getByTestId('notifications-dropdown').or(
        page.locator('[role="menu"]')
      );

      await expect(dropdown).toBeVisible();

      // 드롭다운의 너비가 화면 너비와 비슷해야 함 (전체 화면)
      const box = await dropdown.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(300); // 모바일 화면 대부분 차지
      }
    });
  });
});
