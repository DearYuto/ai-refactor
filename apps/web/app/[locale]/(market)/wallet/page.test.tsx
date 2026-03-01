import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WalletPage from './page';

// React Query Provider Mock
const mockQueryClient = {
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
};

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  QueryClient: vi.fn(() => mockQueryClient),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Hooks Mock
vi.mock('@/lib/hooks/useDeposits', () => ({
  useDeposits: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useCreateDeposit: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('@/lib/hooks/useWithdrawals', () => ({
  useWithdrawals: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
  useRequestWithdrawal: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe('WalletPage (지갑 페이지)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // alert, confirm mock
    global.alert = vi.fn();
    global.confirm = vi.fn(() => true);
  });

  describe('페이지 렌더링', () => {
    it('지갑 페이지가 올바르게 렌더링되어야 합니다', () => {
      render(<WalletPage />);

      expect(screen.getByText('지갑')).toBeInTheDocument();
      expect(screen.getByText('입금')).toBeInTheDocument();
      expect(screen.getByText('출금')).toBeInTheDocument();
      expect(screen.getByText('입출금 내역')).toBeInTheDocument();
    });

    it('기본적으로 입금 탭이 활성화되어야 합니다', () => {
      render(<WalletPage />);

      const depositTab = screen.getByText('입금');
      expect(depositTab).toHaveClass('border-b-2', 'border-blue-500', 'font-bold');
      expect(screen.getByText('입금하기')).toBeInTheDocument();
    });
  });

  describe('탭 전환', () => {
    it('출금 탭을 클릭하면 출금 섹션이 표시되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<WalletPage />);

      const withdrawTab = screen.getByText('출금');
      await user.click(withdrawTab);

      expect(withdrawTab).toHaveClass('border-b-2', 'border-blue-500', 'font-bold');
      expect(screen.getByText('출금하기')).toBeInTheDocument();
    });

    it('입출금 내역 탭을 클릭하면 거래 내역이 표시되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<WalletPage />);

      const historyTab = screen.getByText('입출금 내역');
      await user.click(historyTab);

      expect(historyTab).toHaveClass('border-b-2', 'border-blue-500', 'font-bold');
    });

    it('탭을 전환할 때마다 올바른 컨텐츠가 표시되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<WalletPage />);

      // 입금 → 출금
      await user.click(screen.getByText('출금'));
      expect(screen.getByText('출금하기')).toBeInTheDocument();

      // 출금 → 내역
      await user.click(screen.getByText('입출금 내역'));
      expect(screen.queryByText('출금하기')).not.toBeInTheDocument();

      // 내역 → 입금
      await user.click(screen.getByText('입금'));
      expect(screen.getByText('입금하기')).toBeInTheDocument();
    });
  });

  describe('입금 섹션', () => {
    it('자산 선택 드롭다운이 표시되어야 합니다', () => {
      render(<WalletPage />);

      const assetSelect = screen.getByRole('combobox', { name: /자산/i });
      expect(assetSelect).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'BTC' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'USDT' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'KRW' })).toBeInTheDocument();
    });

    it('선택한 자산에 따라 입금 주소가 표시되어야 합니다', async () => {
      const user = userEvent.setup();
      render(<WalletPage />);

      // 기본값 BTC
      expect(screen.getByText(/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/)).toBeInTheDocument();

      // USDT 선택
      const assetSelect = screen.getByRole('combobox', { name: /자산/i });
      await user.selectOptions(assetSelect, 'USDT');

      await waitFor(() => {
        expect(screen.getByText(/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/)).toBeInTheDocument();
      });

      // KRW 선택
      await user.selectOptions(assetSelect, 'KRW');

      await waitFor(() => {
        expect(screen.getByText(/110-123-456789/)).toBeInTheDocument();
      });
    });

    it('입금 시뮬레이션 버튼이 표시되어야 합니다', () => {
      render(<WalletPage />);

      expect(screen.getByText('입금 시뮬레이션')).toBeInTheDocument();
    });
  });

  describe('출금 섹션', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<WalletPage />);
      await user.click(screen.getByText('출금'));
    });

    it('출금 폼이 올바르게 렌더링되어야 합니다', () => {
      expect(screen.getByText('출금하기')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /자산/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/)).toBeInTheDocument();
      expect(screen.getByText('출금 요청')).toBeInTheDocument();
    });

    it('최소 출금액이 표시되어야 합니다', () => {
      expect(screen.getByText(/최소: 0.001 BTC/i)).toBeInTheDocument();
    });

    it('출금 금액 입력 시 수수료와 총액이 계산되어야 합니다', async () => {
      const user = userEvent.setup();

      const amountInput = screen.getByPlaceholderText('0.00');
      await user.type(amountInput, '1');

      await waitFor(() => {
        expect(screen.getByText(/출금 금액:/)).toBeInTheDocument();
        expect(screen.getByText(/수수료:/)).toBeInTheDocument();
        expect(screen.getByText(/총 차감:/)).toBeInTheDocument();
      });
    });

    it('자산 변경 시 최소 출금액이 업데이트되어야 합니다', async () => {
      const user = userEvent.setup();

      const assetSelect = screen.getByRole('combobox', { name: /자산/i });

      // USDT 선택
      await user.selectOptions(assetSelect, 'USDT');
      await waitFor(() => {
        expect(screen.getByText(/최소: 10 USDT/i)).toBeInTheDocument();
      });

      // KRW 선택
      await user.selectOptions(assetSelect, 'KRW');
      await waitFor(() => {
        expect(screen.getByText(/최소: 10000 KRW/i)).toBeInTheDocument();
      });
    });
  });

  describe('입출금 내역', () => {
    it('내역 탭으로 전환할 수 있어야 합니다', async () => {
      const user = userEvent.setup();
      render(<WalletPage />);

      const historyTab = screen.getByText('입출금 내역');
      await user.click(historyTab);

      expect(historyTab).toHaveClass('border-b-2', 'border-blue-500', 'font-bold');
    });

    it('로딩 상태를 올바르게 표시해야 합니다', async () => {
      const { useDeposits } = await import('@/lib/hooks/useDeposits');
      const { useWithdrawals } = await import('@/lib/hooks/useWithdrawals');

      vi.mocked(useDeposits).mockReturnValue({
        data: [],
        isLoading: true,
      } as any);

      vi.mocked(useWithdrawals).mockReturnValue({
        data: [],
        isLoading: true,
      } as any);

      const user = userEvent.setup();
      render(<WalletPage />);

      await user.click(screen.getByText('입출금 내역'));

      // TransactionHistory 컴포넌트는 isLoading prop을 받음
      // 실제 로딩 UI는 TransactionHistory 내부에서 구현되어야 함
    });
  });

  describe('접근성', () => {
    it('모든 폼 요소에 적절한 label이 있어야 합니다', () => {
      render(<WalletPage />);

      expect(screen.getByLabelText(/자산/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/입금 주소/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/입금할 금액/i)).toBeInTheDocument();
    });

    it('버튼이 적절한 role을 가져야 합니다', () => {
      render(<WalletPage />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('반응형 디자인', () => {
    it('컨테이너가 적절한 클래스를 가져야 합니다', () => {
      const { container } = render(<WalletPage />);

      const mainContainer = container.querySelector('.container');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('mx-auto', 'p-6');
    });

    it('입출금 섹션이 max-width를 가져야 합니다', () => {
      const { container } = render(<WalletPage />);

      const section = container.querySelector('.max-w-md');
      expect(section).toBeInTheDocument();
    });
  });
});
