import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LoggerService } from '../common/logger/logger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateDepositDto } from './dto/create-deposit.dto';

describe('DepositsService', () => {
  let service: DepositsService;
  let prisma: PrismaService;
  let walletService: WalletService;
  let notificationsService: NotificationsService;
  let notificationsGateway: NotificationsGateway;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hash',
    role: 'USER',
    emailVerified: true,
    emailVerifiedAt: new Date(),
    twoFactorEnabled: false,
    twoFactorSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDeposit = {
    id: 'deposit-123',
    userId: 'user-123',
    asset: 'BTC',
    amount: 0.5,
    txHash: '0xabc123',
    status: 'pending' as const,
    confirmations: 0,
    confirmedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            deposit: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: WalletService,
          useValue: {
            getUserId: jest.fn(),
            addBalance: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyDepositConfirmed: jest.fn(),
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

    service = module.get<DepositsService>(DepositsService);
    prisma = module.get<PrismaService>(PrismaService);
    walletService = module.get<WalletService>(WalletService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
    notificationsGateway =
      module.get<NotificationsGateway>(NotificationsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDeposits', () => {
    it('사용자의 입금 내역을 최신순으로 조회해야 합니다', async () => {
      // Arrange
      const deposits = [
        { ...mockDeposit, createdAt: new Date('2024-03-01') },
        {
          ...mockDeposit,
          id: 'deposit-456',
          createdAt: new Date('2024-02-01'),
        },
      ];
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.deposit, 'findMany').mockResolvedValue(deposits);

      // Act
      const result = await service.getDeposits('test@example.com');

      // Assert
      expect(result).toEqual(deposits);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(prisma.deposit.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('사용자를 찾을 수 없으면 빈 배열을 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await service.getDeposits('nonexistent@example.com');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('createDeposit', () => {
    it('입금 요청을 생성해야 합니다', async () => {
      // Arrange
      const dto: CreateDepositDto = {
        asset: 'BTC',
        amount: 0.5,
        txHash: '0xabc123',
      };
      jest.spyOn(walletService, 'getUserId').mockResolvedValue('user-123');
      jest.spyOn(prisma.deposit, 'findFirst').mockResolvedValue(null); // 중복 없음
      jest.spyOn(prisma.deposit, 'create').mockResolvedValue(mockDeposit);

      // Act
      const result = await service.createDeposit('test@example.com', dto);

      // Assert
      expect(result).toEqual(mockDeposit);
      expect(walletService.getUserId).toHaveBeenCalledWith('test@example.com');
      expect(prisma.deposit.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          asset: 'BTC',
          amount: 0.5,
          txHash: '0xabc123',
          status: 'pending',
        },
      });
    });
  });

  describe('confirmDeposit', () => {
    it('입금을 확인하고 잔고를 업데이트해야 합니다', async () => {
      // Arrange
      const confirmedDeposit = {
        ...mockDeposit,
        status: 'confirmed' as const,
        confirmations: 6,
        confirmedAt: expect.any(Date),
      };
      const mockNotification = {
        id: 'notif-123',
        userId: 'user-123',
        type: 'deposit_confirmed',
        title: '입금 완료',
        message: '0.5 BTC 입금이 완료되었습니다',
        data: {},
        read: false,
        createdAt: new Date(),
      };

      jest.spyOn(prisma.deposit, 'findUnique').mockResolvedValue(mockDeposit);
      jest.spyOn(walletService, 'addBalance').mockResolvedValue(undefined);
      jest.spyOn(prisma.deposit, 'update').mockResolvedValue(confirmedDeposit);
      jest
        .spyOn(notificationsService, 'notifyDepositConfirmed')
        .mockResolvedValue(mockNotification);
      jest.spyOn(notificationsGateway, 'sendToUser').mockReturnValue(undefined);

      // Act
      const result = await service.confirmDeposit('deposit-123');

      // Assert
      expect(result.status).toBe('confirmed');
      expect(result.confirmations).toBe(6);
      expect(walletService.addBalance).toHaveBeenCalledWith(
        'user-123',
        'BTC',
        0.5,
      );
      expect(notificationsService.notifyDepositConfirmed).toHaveBeenCalledWith(
        'user-123',
        'deposit-123',
        0.5,
        'BTC',
      );
      expect(notificationsGateway.sendToUser).toHaveBeenCalledWith(
        'user-123',
        mockNotification,
      );
    });

    it('존재하지 않는 입금에 대해 NotFoundException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.deposit, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.confirmDeposit('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('이미 처리된 입금에 대해 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      const processedDeposit = {
        ...mockDeposit,
        status: 'confirmed' as const,
      };
      jest
        .spyOn(prisma.deposit, 'findUnique')
        .mockResolvedValue(processedDeposit);

      // Act & Assert
      await expect(service.confirmDeposit('deposit-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
