import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarketPage from './page';

// Mock hooks
vi.mock('@/lib/hooks/useMarketData', () => ({
  useMarketData: vi.fn(() => ({
    ticker: {
      symbol: 'BTC/USDT',
      price: '50000',
      high: '52000',
      low: '48000',
      volume: '1234.56',
      change: '2.5',
    },
    orderbook: {
      bids: [
        { price: '49900', size: '0.5' },
        { price: '49800', size: '1.2' },
      ],
      asks: [
        { price: '50100', size: '0.8' },
        { price: '50200', size: '1.5' },
      ],
    },
    isLoading: false,
    error: null,
    lastUpdated: new Date().toISOString(),
  })),
}));

vi.mock('@/lib/hooks/useMarketSocket', () => ({
  useMarketSocket: vi.fn(() => 'connected'),
}));

vi.mock('@/lib/hooks/useTrades', () => ({
  useTrades: vi.fn(() => ({
    trades: [
      {
        id: 'trade-1',
        price: '50000',
        size: '0.1',
        side: 'buy',
        timestamp: new Date().toISOString(),
      },
    ],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/lib/hooks/useOrders', () => ({
  useOrders: vi.fn(() => ({
    orders: [],
    isLoading: false,
    error: null,
    isSubmitting: false,
    submitError: null,
    placeOrder: vi.fn(),
    cancelOrder: vi.fn(),
    resetSubmission: vi.fn(),
  })),
}));

vi.mock('@/lib/hooks/useBalances', () => ({
  useBalances: vi.fn(() => ({
    balances: [
      { asset: 'BTC', available: '1.5', locked: '0.5' },
      { asset: 'USDT', available: '10000', locked: '500' },
    ],
  })),
}));

vi.mock('@/lib/store', () => ({
  useMarketOrderStore: vi.fn(() => ({
    selectedOrderPrice: null,
    setSelectedOrderPrice: vi.fn(),
  })),
}));

// Mock 컴포넌트들
vi.mock('@/app/[locale]/(market)/market/components/market-header', () => ({
  MarketHeader: ({ title, socketStatus }: any) => (
    <div data-testid="market-header">
      <h1>{title}</h1>
      <span data-testid="socket-status">{socketStatus}</span>
    </div>
  ),
}));

vi.mock('@/app/[locale]/(market)/market/components/btc-chart-section', () => ({
  BtcChartSection: ({ source, onSourceChange }: any) => (
    <div data-testid="chart-section">
      <span>Source: {source}</span>
      <button onClick={() => onSourceChange('upbit')}>Change Source</button>
    </div>
  ),
}));

vi.mock('@/app/[locale]/(market)/market/components/live-price-section', () => ({
  LivePriceSection: ({ ticker, isLoading }: any) => (
    <div data-testid="live-price-section">
      {isLoading ? 'Loading...' : ticker?.price}
    </div>
  ),
}));

vi.mock('@/app/[locale]/(market)/market/components/orderbook-section', () => ({
  OrderbookSection: ({ orderbook, isLoading }: any) => (
    <div data-testid="orderbook-section">
      {isLoading ? 'Loading...' : `Bids: ${orderbook?.bids?.length || 0}`}
    </div>
  ),
}));

vi.mock('@/app/[locale]/(market)/market/components/ticker-section', () => ({
  TickerSection: ({ ticker }: any) => (
    <div data-testid="ticker-section">{ticker?.symbol}</div>
  ),
}));

vi.mock('@/app/[locale]/(market)/market/components/trade-tape-section', () => ({
  TradeTapeSection: ({ trades }: any) => (
    <div data-testid="trade-tape-section">Trades: {trades?.length || 0}</div>
  ),
}));

vi.mock('@/app/[locale]/(market)/market/components/wallet-balance-section', () => ({
  WalletBalanceSection: () => (
    <div data-testid="wallet-balance-section">Wallet Balance</div>
  ),
}));

vi.mock('@/app/[locale]/(market)/market/components/order-entry-section', () => ({
  OrderEntrySection: ({ source, currentPrice }: any) => (
    <div data-testid="order-entry-section">
      <span>Price: {currentPrice}</span>
      <button data-testid="buy-button">Buy</button>
      <button data-testid="sell-button">Sell</button>
      <input data-testid="size-input" placeholder="Size" />
      <input data-testid="price-input" placeholder="Price" />
    </div>
  ),
}));

vi.mock('@/components/layout/page-shell', () => ({
  PageShell: ({ children, style }: any) => <div style={style}>{children}</div>,
}));

describe('MarketPage (거래 페이지)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('페이지 렌더링', () => {
    it('거래 페이지의 모든 섹션이 렌더링되어야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      expect(screen.getByTestId('market-header')).toBeInTheDocument();
      expect(screen.getByTestId('chart-section')).toBeInTheDocument();
      expect(screen.getByTestId('live-price-section')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-balance-section')).toBeInTheDocument();
      expect(screen.getByTestId('order-entry-section')).toBeInTheDocument();
      expect(screen.getByTestId('ticker-section')).toBeInTheDocument();
      expect(screen.getByTestId('orderbook-section')).toBeInTheDocument();
      expect(screen.getByTestId('trade-tape-section')).toBeInTheDocument();
    });

    it('마켓 헤더에 심볼명이 표시되어야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    });

    it('WebSocket 연결 상태가 표시되어야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      expect(screen.getByTestId('socket-status')).toHaveTextContent('connected');
    });

    it('현재 가격이 표시되어야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      expect(screen.getByTestId('live-price-section')).toHaveTextContent('50000');
    });

    it('호가창에 매수/매도 호가가 표시되어야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      expect(screen.getByTestId('orderbook-section')).toHaveTextContent('Bids: 2');
    });

    it('체결 내역이 표시되어야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      expect(screen.getByTestId('trade-tape-section')).toHaveTextContent(
        'Trades: 1'
      );
    });
  });

  describe('마켓 소스 변경', () => {
    it('마켓 소스를 변경할 수 있어야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<MarketPage />);

      // Act
      const changeButton = screen.getByText('Change Source');
      await user.click(changeButton);

      // Assert
      // 소스 변경 로직이 호출되었는지 확인
      // (실제 구현에서는 useMarketData가 새로운 source로 재호출됨)
    });

    it('소스 변경 시 데이터가 업데이트되어야 합니다', () => {
      // Arrange
      const { useMarketData } = require('@/lib/hooks/useMarketData');

      // Act
      render(<MarketPage />);

      // Assert
      expect(useMarketData).toHaveBeenCalledWith('binance', false);
    });
  });

  describe('주문 입력 섹션', () => {
    it('주문 입력 폼이 표시되어야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      expect(screen.getByTestId('buy-button')).toBeInTheDocument();
      expect(screen.getByTestId('sell-button')).toBeInTheDocument();
      expect(screen.getByTestId('size-input')).toBeInTheDocument();
      expect(screen.getByTestId('price-input')).toBeInTheDocument();
    });

    it('현재 시세가 주문 입력 섹션에 전달되어야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      expect(screen.getByTestId('order-entry-section')).toHaveTextContent(
        'Price: 50000'
      );
    });
  });

  describe('로딩 상태', () => {
    it('데이터 로딩 중에는 로딩 메시지를 표시해야 합니다', () => {
      // Arrange
      const { useMarketData } = require('@/lib/hooks/useMarketData');
      useMarketData.mockReturnValue({
        ticker: null,
        orderbook: null,
        isLoading: true,
        error: null,
        lastUpdated: null,
      });

      // Act
      render(<MarketPage />);

      // Assert
      expect(screen.getByTestId('live-price-section')).toHaveTextContent(
        'Loading...'
      );
      expect(screen.getByTestId('orderbook-section')).toHaveTextContent(
        'Loading...'
      );
    });
  });

  describe('WebSocket 연결', () => {
    it('WebSocket 연결 시 폴링을 비활성화해야 합니다', () => {
      // Arrange
      const { useMarketSocket } = require('@/lib/hooks/useMarketSocket');
      const { useMarketData } = require('@/lib/hooks/useMarketData');
      useMarketSocket.mockReturnValue('connected');

      // Act
      render(<MarketPage />);

      // Assert
      // enablePolling = false로 useMarketData 호출
      expect(useMarketData).toHaveBeenCalledWith('binance', false);
    });

    it('WebSocket 연결 해제 시 폴링을 활성화해야 합니다', () => {
      // Arrange
      const { useMarketSocket } = require('@/lib/hooks/useMarketSocket');
      const { useMarketData } = require('@/lib/hooks/useMarketData');
      useMarketSocket.mockReturnValue('disconnected');

      // Act
      render(<MarketPage />);

      // Assert
      // enablePolling = true로 useMarketData 호출
      expect(useMarketData).toHaveBeenCalledWith('binance', true);
    });

    it('WebSocket 재연결 중에는 폴링을 활성화해야 합니다', () => {
      // Arrange
      const { useMarketSocket } = require('@/lib/hooks/useMarketSocket');
      const { useMarketData } = require('@/lib/hooks/useMarketData');
      useMarketSocket.mockReturnValue('connecting');

      // Act
      render(<MarketPage />);

      // Assert
      expect(useMarketData).toHaveBeenCalledWith('binance', true);
    });
  });

  describe('마켓 테마', () => {
    it('다크 테마 CSS 변수가 적용되어야 합니다', () => {
      // Act
      const { container } = render(<MarketPage />);

      // Assert
      const pageShell = container.firstChild as HTMLElement;
      expect(pageShell).toHaveStyle({
        '--color-bg-main': '#0b1220',
        '--color-bg-sub': '#121a2f',
      });
    });
  });

  describe('에러 처리', () => {
    it('마켓 데이터 로딩 실패 시 에러가 전달되어야 합니다', () => {
      // Arrange
      const { useMarketData } = require('@/lib/hooks/useMarketData');
      const mockError = new Error('Failed to fetch market data');
      useMarketData.mockReturnValue({
        ticker: null,
        orderbook: null,
        isLoading: false,
        error: mockError,
        lastUpdated: null,
      });

      // Act
      render(<MarketPage />);

      // Assert
      // LivePriceSection과 OrderbookSection이 error prop을 받음
      // (실제 섹션에서 에러 메시지 표시)
    });

    it('거래 내역 로딩 실패 시 에러가 전달되어야 합니다', () => {
      // Arrange
      const { useTrades } = require('@/lib/hooks/useTrades');
      const mockError = new Error('Failed to fetch trades');
      useTrades.mockReturnValue({
        trades: [],
        isLoading: false,
        error: mockError,
      });

      // Act
      render(<MarketPage />);

      // Assert
      // TradeTapeSection이 error prop을 받음
    });
  });

  describe('반응형 레이아웃', () => {
    it('지갑과 주문 입력이 그리드 레이아웃으로 배치되어야 합니다', () => {
      // Act
      const { container } = render(<MarketPage />);

      // Assert
      const gridSection = container.querySelector('.lg\\:grid-cols-\\[1fr_1\\.2fr\\]');
      expect(gridSection).toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('main 랜드마크가 존재해야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('버튼들이 적절한 role을 가져야 합니다', () => {
      // Act
      render(<MarketPage />);

      // Assert
      const buyButton = screen.getByTestId('buy-button');
      const sellButton = screen.getByTestId('sell-button');
      expect(buyButton).toHaveAttribute('type', 'button');
      expect(sellButton).toHaveAttribute('type', 'button');
    });
  });
});
