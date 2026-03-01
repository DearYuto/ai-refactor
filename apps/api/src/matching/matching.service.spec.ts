import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { MatchingEngineService } from './matching.service';
import { PrismaService } from '../database/prisma.service';
import { FeeService } from '../fee/fee.service';
import { WalletService } from '../wallet/wallet.service';
import { LoggerService } from '../common/logger/logger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

describe('MatchingEngineService', () => {
  let service: MatchingEngineService;
  let prisma: PrismaService;
  let feeService: FeeService;
  let walletService: WalletService;
  let notificationsService: NotificationsService;
  let notificationsGateway: NotificationsGateway;

  const mockBuyOrder = {
    id: 'buy-order-123',
    userId: 'buyer-123',
    source: 'BTC-USDT',
    side: 'buy',
    type: 'limit',
    price: 50000,
    size: 0.5,
    status: 'pending',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    filledPrice: null,
    notional: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSellOrder = {
    id: 'sell-order-123',
    userId: 'seller-123',
    source: 'BTC-USDT',
    side: 'sell',
    type: 'limit',
    price: 49000,
    size: 0.5,
    status: 'pending',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    filledPrice: null,
    notional: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTrade = {
    id: 'trade-123',
    buyOrderId: 'buy-order-123',
    sellOrderId: 'sell-order-123',
    price: 49000,
    size: 0.5,
    buyerFee: 24.5,
    sellerFee: 49,
    source: 'BTC-USDT',
    timestamp: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchingEngineService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
            trade: {
              create: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: FeeService,
          useValue: {
            calculateFee: jest.fn(),
          },
        },
        {
          provide: WalletService,
          useValue: {
            unlockBalance: jest.fn(),
            addBalance: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            logTrade: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyOrderFilled: jest.fn(),
          },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            sendToUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MatchingEngineService>(MatchingEngineService);
    prisma = module.get<PrismaService>(PrismaService);
    feeService = module.get<FeeService>(FeeService);
    walletService = module.get<WalletService>(WalletService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
    notificationsGateway =
      module.get<NotificationsGateway>(NotificationsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('matchOrders', () => {
    it('가격이 겹치는 buy/sell 주문을 매칭해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.order, 'findMany')
        .mockResolvedValueOnce([mockBuyOrder]) // buy orders
        .mockResolvedValueOnce([mockSellOrder]); // sell orders

      jest
        .spyOn(feeService, 'calculateFee')
        .mockResolvedValueOnce(24.5) // buyer fee
        .mockResolvedValueOnce(49); // seller fee

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          const txMock = {
            trade: {
              create: jest.fn().mockResolvedValue(mockTrade),
            },
            order: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce({ ...mockBuyOrder, status: 'pending' })
                .mockResolvedValueOnce({ ...mockSellOrder, status: 'pending' }),
              update: jest
                .fn()
                .mockResolvedValue({ ...mockBuyOrder, status: 'filled' }),
              updateMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          };
          return callback(txMock);
        });

      jest.spyOn(walletService, 'unlockBalance').mockResolvedValue(undefined);
      jest.spyOn(walletService, 'addBalance').mockResolvedValue(undefined);
      jest.spyOn(notificationsService, 'notifyOrderFilled').mockResolvedValue({
        id: 'notif-123',
        userId: 'buyer-123',
        type: 'order_filled',
        title: '주문 체결',
        message: '매수 주문이 체결되었습니다',
        data: {},
        read: false,
        createdAt: new Date(),
      });

      // Act
      await service.matchOrders('BTC-USDT');

      // Assert
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(feeService.calculateFee).toHaveBeenCalledTimes(2);
    });

    it('buy 주문을 가격 높은 순으로 조회해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.order, 'findMany')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      await service.matchOrders('BTC-USDT');

      // Assert
      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          source: 'BTC-USDT',
          side: 'buy',
          status: 'pending',
          type: 'limit',
        },
        orderBy: {
          price: 'desc', // 높은 가격 우선
        },
      });
    });

    it('sell 주문을 가격 낮은 순으로 조회해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.order, 'findMany')
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      await service.matchOrders('BTC-USDT');

      // Assert
      expect(prisma.order.findMany).toHaveBeenNthCalledWith(2, {
        where: {
          source: 'BTC-USDT',
          side: 'sell',
          status: 'pending',
          type: 'limit',
        },
        orderBy: {
          price: 'asc', // 낮은 가격 우선
        },
      });
    });

    it('매칭 가능한 주문이 없으면 early return해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.order, 'findMany')
        .mockResolvedValueOnce([]) // buy orders empty
        .mockResolvedValueOnce([mockSellOrder]);

      // Act
      await service.matchOrders('BTC-USDT');

      // Assert
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('buy 가격 < sell 가격이면 매칭하지 않아야 합니다', async () => {
      // Arrange
      const lowBuyOrder = {
        ...mockBuyOrder,
        price: 48000, // sell보다 낮음
      };
      jest
        .spyOn(prisma.order, 'findMany')
        .mockResolvedValueOnce([lowBuyOrder])
        .mockResolvedValueOnce([mockSellOrder]);

      // Act
      await service.matchOrders('BTC-USDT');

      // Assert
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('executeTrade', () => {
    it('체결 가격은 sell 주문 가격을 사용해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.order, 'findMany')
        .mockResolvedValueOnce([mockBuyOrder])
        .mockResolvedValueOnce([mockSellOrder]);

      jest
        .spyOn(feeService, 'calculateFee')
        .mockResolvedValueOnce(24.5)
        .mockResolvedValueOnce(49);

      let capturedPrice: number | undefined;
      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          const txMock = {
            trade: {
              create: jest.fn().mockImplementation((args: any) => {
                capturedPrice = args.data.price;
                return mockTrade;
              }),
            },
            order: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce({ ...mockBuyOrder, status: 'pending' })
                .mockResolvedValueOnce({ ...mockSellOrder, status: 'pending' }),
              update: jest
                .fn()
                .mockResolvedValue({ ...mockBuyOrder, status: 'filled' }),
              updateMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          };
          return callback(txMock);
        });

      jest.spyOn(walletService, 'unlockBalance').mockResolvedValue(undefined);
      jest.spyOn(walletService, 'addBalance').mockResolvedValue(undefined);
      jest.spyOn(notificationsService, 'notifyOrderFilled').mockResolvedValue({
        id: 'notif-123',
        userId: 'buyer-123',
        type: 'order_filled',
        title: '주문 체결',
        message: '매수 주문이 체결되었습니다',
        data: {},
        read: false,
        createdAt: new Date(),
      });

      // Act
      await service.matchOrders('BTC-USDT');

      // Assert
      expect(capturedPrice).toBe(mockSellOrder.price);
    });

    it('체결 수량은 두 주문 중 작은 수량을 사용해야 합니다', async () => {
      // Arrange
      const largeBuyOrder = {
        ...mockBuyOrder,
        size: 1.0, // sell보다 큼
      };
      jest
        .spyOn(prisma.order, 'findMany')
        .mockResolvedValueOnce([largeBuyOrder])
        .mockResolvedValueOnce([mockSellOrder]);

      jest
        .spyOn(feeService, 'calculateFee')
        .mockResolvedValueOnce(24.5)
        .mockResolvedValueOnce(49);

      let capturedSize: number | undefined;
      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          const txMock = {
            trade: {
              create: jest.fn().mockImplementation((args: any) => {
                capturedSize = args.data.size;
                return mockTrade;
              }),
            },
            order: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce({ ...mockBuyOrder, status: 'pending' })
                .mockResolvedValueOnce({ ...mockSellOrder, status: 'pending' }),
              update: jest
                .fn()
                .mockResolvedValue({ ...mockBuyOrder, status: 'filled' }),
              updateMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          };
          return callback(txMock);
        });

      jest.spyOn(walletService, 'unlockBalance').mockResolvedValue(undefined);
      jest.spyOn(walletService, 'addBalance').mockResolvedValue(undefined);
      jest.spyOn(notificationsService, 'notifyOrderFilled').mockResolvedValue({
        id: 'notif-123',
        userId: 'buyer-123',
        type: 'order_filled',
        title: '주문 체결',
        message: '매수 주문이 체결되었습니다',
        data: {},
        read: false,
        createdAt: new Date(),
      });

      // Act
      await service.matchOrders('BTC-USDT');

      // Assert
      expect(capturedSize).toBe(
        Math.min(largeBuyOrder.size, mockSellOrder.size),
      );
      expect(capturedSize).toBe(0.5);
    });

    it('매수자와 매도자 모두에게 알림을 발송해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.order, 'findMany')
        .mockResolvedValueOnce([mockBuyOrder])
        .mockResolvedValueOnce([mockSellOrder]);

      jest
        .spyOn(feeService, 'calculateFee')
        .mockResolvedValueOnce(24.5)
        .mockResolvedValueOnce(49);

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          const txMock = {
            trade: {
              create: jest.fn().mockResolvedValue(mockTrade),
            },
            order: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce({ ...mockBuyOrder, status: 'pending' })
                .mockResolvedValueOnce({ ...mockSellOrder, status: 'pending' }),
              update: jest
                .fn()
                .mockResolvedValue({ ...mockBuyOrder, status: 'filled' }),
              updateMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
          };
          return callback(txMock);
        });

      jest.spyOn(walletService, 'unlockBalance').mockResolvedValue(undefined);
      jest.spyOn(walletService, 'addBalance').mockResolvedValue(undefined);
      jest.spyOn(notificationsService, 'notifyOrderFilled').mockResolvedValue({
        id: 'notif-123',
        userId: 'buyer-123',
        type: 'order_filled',
        title: '주문 체결',
        message: '매수 주문이 체결되었습니다',
        data: {},
        read: false,
        createdAt: new Date(),
      });
      jest.spyOn(notificationsGateway, 'sendToUser').mockReturnValue(undefined);

      // Act
      await service.matchOrders('BTC-USDT');

      // Assert
      expect(notificationsService.notifyOrderFilled).toHaveBeenCalledTimes(2);
      expect(notificationsGateway.sendToUser).toHaveBeenCalledTimes(2);
    });

    it('주문 상태를 filled로 업데이트해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.order, 'findMany')
        .mockResolvedValueOnce([mockBuyOrder])
        .mockResolvedValueOnce([mockSellOrder]);

      jest
        .spyOn(feeService, 'calculateFee')
        .mockResolvedValueOnce(24.5)
        .mockResolvedValueOnce(49);

      const orderUpdateManyMock = jest.fn().mockResolvedValue({ count: 1 });
      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          const txMock = {
            trade: {
              create: jest.fn().mockResolvedValue(mockTrade),
            },
            order: {
              findUnique: jest
                .fn()
                .mockResolvedValueOnce({ ...mockBuyOrder, status: 'pending' })
                .mockResolvedValueOnce({ ...mockSellOrder, status: 'pending' }),
              updateMany: orderUpdateManyMock,
            },
          };
          return callback(txMock);
        });

      jest.spyOn(walletService, 'unlockBalance').mockResolvedValue(undefined);
      jest.spyOn(walletService, 'addBalance').mockResolvedValue(undefined);
      jest.spyOn(notificationsService, 'notifyOrderFilled').mockResolvedValue({
        id: 'notif-123',
        userId: 'buyer-123',
        type: 'order_filled',
        title: '주문 체결',
        message: '매수 주문이 체결되었습니다',
        data: {},
        read: false,
        createdAt: new Date(),
      });

      // Act
      await service.matchOrders('BTC-USDT');

      // Assert
      expect(orderUpdateManyMock).toHaveBeenCalledTimes(2);
      expect(orderUpdateManyMock).toHaveBeenCalledWith({
        where: {
          id: mockBuyOrder.id,
          status: 'pending',
        },
        data: {
          status: 'filled',
          filledPrice: mockSellOrder.price,
        },
      });
    });
  });

  describe('matchAllMarkets', () => {
    it('모든 마켓에 대해 매칭을 실행해야 합니다', async () => {
      // Arrange
      const matchOrdersSpy = jest
        .spyOn(service, 'matchOrders')
        .mockResolvedValue(undefined);

      // Act
      await service.matchAllMarkets();

      // Assert
      expect(matchOrdersSpy).toHaveBeenCalledWith('BTC-USDT');
      expect(matchOrdersSpy).toHaveBeenCalledWith('ETH-USDT');
      expect(matchOrdersSpy).toHaveBeenCalledTimes(2);
    });

    it('한 마켓에서 에러가 발생해도 다른 마켓은 계속 처리해야 합니다', async () => {
      // Arrange
      const matchOrdersSpy = jest
        .spyOn(service, 'matchOrders')
        .mockRejectedValueOnce(new Error('BTC 매칭 실패'))
        .mockResolvedValueOnce(undefined);

      // Act
      await service.matchAllMarkets();

      // Assert
      expect(matchOrdersSpy).toHaveBeenCalledTimes(2);
    });
  });
});
