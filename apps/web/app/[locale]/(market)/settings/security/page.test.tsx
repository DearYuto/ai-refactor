import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SecuritySettingsPage from './page';

// Zustand store mock
const mockUseAuthStore = vi.fn();
vi.mock('@/lib/store', () => ({
  useAuthStore: (selector: any) => mockUseAuthStore(selector),
}));

// API mock
vi.mock('@/lib/api/security.api', () => ({
  setup2FA: vi.fn(),
  enable2FA: vi.fn(),
  disable2FA: vi.fn(),
  sendVerificationEmail: vi.fn(),
  getBackupCodes: vi.fn(),
  regenerateBackupCodes: vi.fn(),
}));

describe('SecuritySettingsPage (보안 설정 페이지)', () => {
  const mockUser = {
    email: 'test@example.com',
    emailVerified: false,
    twoFactorEnabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
    global.prompt = vi.fn();
    global.confirm = vi.fn(() => true);

    // 기본값: 로그인된 상태
    mockUseAuthStore.mockImplementation((selector) =>
      selector({
        user: mockUser,
        token: 'mock-token',
        isLoggedIn: true,
        updateUser: vi.fn(),
      })
    );
  });

  describe('인증 상태 검증', () => {
    it('로그인하지 않은 경우 경고 메시지를 표시해야 합니다', () => {
      mockUseAuthStore.mockImplementation((selector) =>
        selector({
          user: null,
          token: null,
          isLoggedIn: false,
          updateUser: vi.fn(),
        })
      );

      render(<SecuritySettingsPage />);

      expect(screen.getByText('🔒 로그인이 필요합니다')).toBeInTheDocument();
      expect(screen.getByText(/보안 설정을 변경하려면 먼저 로그인해주세요/)).toBeInTheDocument();
    });

    it('로그인한 경우 보안 설정을 표시해야 합니다', () => {
      render(<SecuritySettingsPage />);

      expect(screen.getByText('🔐 보안 설정')).toBeInTheDocument();
      expect(screen.getByText('이메일 인증')).toBeInTheDocument();
      expect(screen.getByText('2단계 인증 (2FA)')).toBeInTheDocument();
    });
  });

  describe('이메일 인증 섹션', () => {
    it('이메일이 인증되지 않은 경우 인증 버튼을 표시해야 합니다', () => {
      render(<SecuritySettingsPage />);

      expect(screen.getByText('⚠️ 이메일이 인증되지 않았습니다')).toBeInTheDocument();
      expect(screen.getByText('인증 이메일 발송')).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });

    it('이메일이 인증된 경우 인증 완료 메시지를 표시해야 합니다', () => {
      mockUseAuthStore.mockImplementation((selector) =>
        selector({
          user: { ...mockUser, emailVerified: true },
          token: 'mock-token',
          isLoggedIn: true,
          updateUser: vi.fn(),
        })
      );

      render(<SecuritySettingsPage />);

      expect(screen.getByText('✅ 이메일이 인증되었습니다')).toBeInTheDocument();
      expect(screen.queryByText('인증 이메일 발송')).not.toBeInTheDocument();
    });

    it('인증 이메일 발송 버튼을 클릭하면 API를 호출해야 합니다', async () => {
      const { sendVerificationEmail } = await import('@/lib/api/security.api');
      vi.mocked(sendVerificationEmail).mockResolvedValue({} as any);

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      const sendButton = screen.getByText('인증 이메일 발송');
      await user.click(sendButton);

      await waitFor(() => {
        expect(sendVerificationEmail).toHaveBeenCalledWith('mock-token');
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('인증 이메일이 발송되었습니다')
        );
      });
    });

    it('이메일 발송 중에는 버튼이 비활성화되어야 합니다', async () => {
      const { sendVerificationEmail } = await import('@/lib/api/security.api');
      vi.mocked(sendVerificationEmail).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      const sendButton = screen.getByText('인증 이메일 발송');
      await user.click(sendButton);

      expect(screen.getByText('발송 중...')).toBeInTheDocument();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('2FA 섹션 - 비활성화 상태', () => {
    it('2FA가 비활성화된 경우 활성화 버튼을 표시해야 합니다', () => {
      render(<SecuritySettingsPage />);

      expect(screen.getByText(/Google Authenticator 또는 다른 TOTP 앱을 사용하여/)).toBeInTheDocument();
      expect(screen.getByText('2FA 활성화 시작')).toBeInTheDocument();
    });

    it('2FA 활성화 시작 버튼을 클릭하면 QR 코드를 표시해야 합니다', async () => {
      const { setup2FA } = await import('@/lib/api/security.api');
      vi.mocked(setup2FA).mockResolvedValue({
        qrCode: 'data:image/png;base64,abc123',
        secret: 'JBSWY3DPEHPK3PXP',
      });

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      const setupButton = screen.getByText('2FA 활성화 시작');
      await user.click(setupButton);

      await waitFor(() => {
        expect(screen.getByText('1. QR 코드 스캔')).toBeInTheDocument();
        expect(screen.getByText('2. 시크릿 키 (수동 입력용)')).toBeInTheDocument();
        expect(screen.getByText('3. 인증 코드 입력')).toBeInTheDocument();
        expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
        expect(screen.getByAltText('QR Code')).toBeInTheDocument();
      });
    });
  });

  describe('2FA 섹션 - 설정 중', () => {
    beforeEach(async () => {
      const { setup2FA } = await import('@/lib/api/security.api');
      vi.mocked(setup2FA).mockResolvedValue({
        qrCode: 'data:image/png;base64,abc123',
        secret: 'JBSWY3DPEHPK3PXP',
      });

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      const setupButton = screen.getByText('2FA 활성화 시작');
      await user.click(setupButton);

      await waitFor(() => {
        expect(screen.getByText('3. 인증 코드 입력')).toBeInTheDocument();
      });
    });

    it('6자리 인증 코드를 입력할 수 있어야 합니다', async () => {
      const user = userEvent.setup();

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '123456');

      expect(codeInput).toHaveValue('123456');
    });

    it('숫자가 아닌 문자는 입력되지 않아야 합니다', async () => {
      const user = userEvent.setup();

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, 'abc123def');

      expect(codeInput).toHaveValue('123');
    });

    it('6자리 미만일 때는 활성화 완료 버튼이 비활성화되어야 합니다', async () => {
      const user = userEvent.setup();

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '12345');

      const enableButton = screen.getByText('2FA 활성화 완료');
      expect(enableButton).toBeDisabled();
    });

    it('6자리 코드 입력 후 활성화할 수 있어야 합니다', async () => {
      const { enable2FA } = await import('@/lib/api/security.api');
      vi.mocked(enable2FA).mockResolvedValue({
        success: true,
        backupCodes: ['ABCD1234', 'EFGH5678', 'IJKL9012', 'MNOP3456', 'QRST7890',
                      'UVWX1234', 'YZAB5678', 'CDEF9012', 'GHIJ3456', 'KLMN7890'],
      });

      const user = userEvent.setup();

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '123456');

      const enableButton = screen.getByText('2FA 활성화 완료');
      expect(enableButton).not.toBeDisabled();

      await user.click(enableButton);

      await waitFor(() => {
        expect(enable2FA).toHaveBeenCalledWith('mock-token', '123456');
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('2FA가 활성화되었습니다')
        );
      });
    });
  });

  describe('2FA 섹션 - 활성화 상태', () => {
    beforeEach(() => {
      mockUseAuthStore.mockImplementation((selector) =>
        selector({
          user: { ...mockUser, twoFactorEnabled: true },
          token: 'mock-token',
          isLoggedIn: true,
          updateUser: vi.fn(),
        })
      );
    });

    it('2FA가 활성화된 경우 활성화 완료 메시지를 표시해야 합니다', () => {
      render(<SecuritySettingsPage />);

      expect(screen.getByText('✅ 2FA가 활성화되었습니다')).toBeInTheDocument();
      expect(screen.getByText('2FA 비활성화')).toBeInTheDocument();
    });

    it('백업 코드가 있으면 표시해야 합니다', async () => {
      const { setup2FA, enable2FA } = await import('@/lib/api/security.api');

      mockUseAuthStore.mockImplementation((selector) =>
        selector({
          user: { ...mockUser, twoFactorEnabled: false },
          token: 'mock-token',
          isLoggedIn: true,
          updateUser: vi.fn(),
        })
      );

      vi.mocked(setup2FA).mockResolvedValue({
        qrCode: 'data:image/png;base64,abc123',
        secret: 'JBSWY3DPEHPK3PXP',
      });

      vi.mocked(enable2FA).mockResolvedValue({
        success: true,
        backupCodes: ['ABCD1234', 'EFGH5678'],
      });

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      await user.click(screen.getByText('2FA 활성화 시작'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
      });

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '123456');
      await user.click(screen.getByText('2FA 활성화 완료'));

      await waitFor(() => {
        expect(screen.getByText('⚠️ 백업 코드 (한 번만 표시됨)')).toBeInTheDocument();
        expect(screen.getByText('ABCD1234')).toBeInTheDocument();
        expect(screen.getByText('EFGH5678')).toBeInTheDocument();
        expect(screen.getByText('백업 코드 다운로드')).toBeInTheDocument();
      });
    });

    it('2FA 비활성화 버튼을 클릭하면 prompt를 표시해야 합니다', async () => {
      const { disable2FA } = await import('@/lib/api/security.api');
      vi.mocked(disable2FA).mockResolvedValue({ success: true });
      global.prompt = vi.fn(() => '123456');

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      const disableButton = screen.getByText('2FA 비활성화');
      await user.click(disableButton);

      await waitFor(() => {
        expect(global.prompt).toHaveBeenCalledWith(
          expect.stringContaining('2FA 코드 또는 백업 코드를 입력하세요')
        );
        expect(disable2FA).toHaveBeenCalledWith('mock-token', '123456');
      });
    });
  });

  describe('보안 팁 섹션', () => {
    it('보안 팁이 표시되어야 합니다', () => {
      render(<SecuritySettingsPage />);

      expect(screen.getByText('💡 보안 팁')).toBeInTheDocument();
      expect(screen.getByText(/이메일 인증은 출금 기능 사용에 필수입니다/)).toBeInTheDocument();
      expect(screen.getByText(/2FA를 활성화하면 계정 보안이 크게 향상됩니다/)).toBeInTheDocument();
      expect(screen.getByText(/백업 코드는 안전한 곳에 보관하세요/)).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('페이지 제목이 적절한 계층 구조를 가져야 합니다', () => {
      render(<SecuritySettingsPage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('🔐 보안 설정');

      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('버튼이 적절한 role을 가져야 합니다', () => {
      render(<SecuritySettingsPage />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('에러 처리', () => {
    it('이메일 발송 실패 시 에러 메시지를 표시해야 합니다', async () => {
      const { sendVerificationEmail } = await import('@/lib/api/security.api');
      vi.mocked(sendVerificationEmail).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      const sendButton = screen.getByText('인증 이메일 발송');
      await user.click(sendButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Network error');
      });
    });

    it('2FA 설정 실패 시 에러 메시지를 표시해야 합니다', async () => {
      const { setup2FA } = await import('@/lib/api/security.api');
      vi.mocked(setup2FA).mockRejectedValue(new Error('2FA setup failed'));

      const user = userEvent.setup();
      render(<SecuritySettingsPage />);

      const setupButton = screen.getByText('2FA 활성화 시작');
      await user.click(setupButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('2FA setup failed');
      });
    });
  });
});
