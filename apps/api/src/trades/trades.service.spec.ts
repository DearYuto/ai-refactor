import { Test, TestingModule } from '@nestjs/testing';
import { TradesService } from './trades.service';
import { PrismaService } from '../database/prisma.service';

describe('TradesService', () => {
  let service: TradesService;
  let prisma: PrismaService;

  const mockTrade = {
    id: 'trade-123',
    buyOrderId: 'buy-order-123',
    sellOrderId: 'sell-order-123',
    price: 50000,
    size: 0.5,
    buyerFee: 25,
    sellerFee: 50,
    source: 'BTC-USDT',
    timestamp: new Date('2024-03-01T12:00:00Z'),
  };

  const mockBuyOrder = {
    id: 'buy-order-123',
    userId: 'buyer-123',
    side: 'buy',
  };

  const mockSellOrder = {
    id: 'sell-order-123',
    userId: 'seller-123',
    side: 'sell',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradesService,
        {
          provide: PrismaService,
          useValue: {
            trade: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TradesService>(TradesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentTrades', () => {
    it('최근 거래 내역을 최신순으로 조회해야 합니다', async () => {
      // Arrange
      const trades = [
        {
          ...mockTrade,
          timestamp: new Date('2024-03-01T12:00:00Z'),
          buyOrder: mockBuyOrder,
        },
        {
          ...mockTrade,
          id: 'trade-456',
          timestamp: new Date('2024-03-01T11:00:00Z'),
          buyOrder: mockBuyOrder,
        },
      ];
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue(trades);

      // Act
      const result = await service.getRecentTrades('BTC-USDT', 50);

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.trade.findMany).toHaveBeenCalledWith({
        where: { source: 'BTC-USDT' },
        orderBy: { timestamp: 'desc' },
        take: 50,
        select: {
          id: true,
          price: true,
          size: true,
          timestamp: true,
          buyOrder: {
            select: {
              side: true,
            },
          },
        },
      });
    });

    it('수수료 정보는 포함하지 않아야 합니다 (public API)', async () => {
      // Arrange
      const trades = [
        {
          ...mockTrade,
          buyOrder: mockBuyOrder,
        },
      ];
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue(trades);

      // Act
      const result = await service.getRecentTrades('BTC-USDT');

      // Assert
      expect(result[0]).not.toHaveProperty('buyerFee');
      expect(result[0]).not.toHaveProperty('sellerFee');
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('price');
      expect(result[0]).toHaveProperty('size');
      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('side');
    });

    it('limit 파라미터로 조회 개수를 제한할 수 있어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue([]);

      // Act
      await service.getRecentTrades('BTC-USDT', 10);

      // Assert
      expect(prisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it('기본 limit은 50이어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue([]);

      // Act
      await service.getRecentTrades('BTC-USDT');

      // Assert
      expect(prisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe('getMyTrades', () => {
    it('사용자의 거래 내역을 조회해야 합니다', async () => {
      // Arrange
      const trades = [
        {
          ...mockTrade,
          buyOrder: { ...mockBuyOrder, userId: 'user-123' },
          sellOrder: mockSellOrder,
        },
      ];
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue(trades);

      // Act
      const result = await service.getMyTrades('user-123');

      // Assert
      expect(result).toHaveLength(1);
      expect(prisma.trade.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ buyOrder: { userId: 'user-123' } }, { sellOrder: { userId: 'user-123' } }],
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
        include: expect.any(Object),
      });
    });

    it('매수자인 경우 buy 정보를 반환해야 합니다', async () => {
      // Arrange
      const trades = [
        {
          ...mockTrade,
          buyOrder: { ...mockBuyOrder, userId: 'user-123' },
          sellOrder: mockSellOrder,
        },
      ];
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue(trades);

      // Act
      const result = await service.getMyTrades('user-123');

      // Assert
      expect(result[0].side).toBe('buy');
      expect(result[0].orderId).toBe('buy-order-123');
      expect(result[0].fee).toBe(25); // buyerFee
    });

    it('매도자인 경우 sell 정보를 반환해야 합니다', async () => {
      // Arrange
      const trades = [
        {
          ...mockTrade,
          buyOrder: mockBuyOrder,
          sellOrder: { ...mockSellOrder, userId: 'user-123' },
        },
      ];
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue(trades);

      // Act
      const result = await service.getMyTrades('user-123');

      // Assert
      expect(result[0].side).toBe('sell');
      expect(result[0].orderId).toBe('sell-order-123');
      expect(result[0].fee).toBe(50); // sellerFee
    });

    it('source 파라미터로 특정 마켓만 조회할 수 있어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue([]);

      // Act
      await service.getMyTrades('user-123', 'BTC-USDT');

      // Assert
      expect(prisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            source: 'BTC-USDT',
          }),
        }),
      );
    });

    it('limit 파라미터로 조회 개수를 제한할 수 있어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue([]);

      // Act
      await service.getMyTrades('user-123', undefined, 20);

      // Assert
      expect(prisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        }),
      );
    });

    it('기본 limit은 100이어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue([]);

      // Act
      await service.getMyTrades('user-123');

      // Assert
      expect(prisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        }),
      );
    });
  });

  describe('getTradesByOrder', () => {
    it('특정 주문의 거래 내역을 조회해야 합니다', async () => {
      // Arrange
      const trades = [mockTrade];
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue(trades);

      // Act
      const result = await service.getTradesByOrder('buy-order-123');

      // Assert
      expect(result).toHaveLength(1);
      expect(prisma.trade.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ buyOrderId: 'buy-order-123' }, { sellOrderId: 'buy-order-123' }],
        },
        orderBy: { timestamp: 'desc' },
      });
    });

    it('매수 주문과 매도 주문 모두에서 검색해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue([]);

      // Act
      await service.getTradesByOrder('order-123');

      // Assert
      expect(prisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ buyOrderId: 'order-123' }, { sellOrderId: 'order-123' }],
          },
        }),
      );
    });
  });

  describe('getVolumeStats', () => {
    it('특정 기간의 거래량 통계를 계산해야 합니다', async () => {
      // Arrange
      const trades = [
        { ...mockTrade, size: 0.5, price: 50000 }, // volume: 25000
        { ...mockTrade, id: 'trade-2', size: 1.0, price: 50000 }, // volume: 50000
        { ...mockTrade, id: 'trade-3', size: 0.3, price: 50000 }, // volume: 15000
      ];
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue(trades);

      // Act
      const result = await service.getVolumeStats('BTC-USDT', 24);

      // Assert
      expect(result.volume).toBe(90000); // 25000 + 50000 + 15000
      expect(result.count).toBe(3);
      expect(result.hours).toBe(24);
    });

    it('기본 기간은 24시간이어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue([]);

      // Act
      const result = await service.getVolumeStats('BTC-USDT');

      // Assert
      expect(result.hours).toBe(24);
    });

    it('지정된 시간 이후의 거래만 집계해야 합니다', async () => {
      // Arrange
      const now = Date.now();
      const hours = 12;
      const since = new Date(now - hours * 60 * 60 * 1000);

      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue([]);
      jest.spyOn(Date, 'now').mockReturnValue(now);

      // Act
      await service.getVolumeStats('BTC-USDT', hours);

      // Assert
      expect(prisma.trade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('거래가 없으면 volume 0을 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue([]);

      // Act
      const result = await service.getVolumeStats('BTC-USDT');

      // Assert
      expect(result.volume).toBe(0);
      expect(result.count).toBe(0);
    });

    it('volume은 가격 * 수량의 합계여야 합니다', async () => {
      // Arrange
      const trades = [
        { ...mockTrade, size: 2, price: 100 }, // 200
        { ...mockTrade, id: 'trade-2', size: 3, price: 200 }, // 600
      ];
      jest.spyOn(prisma.trade, 'findMany').mockResolvedValue(trades);

      // Act
      const result = await service.getVolumeStats('BTC-USDT');

      // Assert
      expect(result.volume).toBe(800);
    });
  });
});
