import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WithdrawalsService } from './withdrawals.service';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LoggerService } from '../common/logger/logger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { TwoFactorService } from '../auth/two-factor.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

describe('WithdrawalsService', () => {
  let service: WithdrawalsService;
  let prisma: PrismaService;
  let walletService: WalletService;
  let notificationsService: NotificationsService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hash',
    role: 'USER',
    emailVerified: true,
    emailVerifiedAt: new Date(),
    twoFactorEnabled: true, // 2FA가 필수이므로 true로 설정
    twoFactorSecret: 'JBSWY3DPEHPK3PXP',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockWithdrawal = {
    id: 'withdrawal-123',
    userId: 'user-123',
    asset: 'BTC',
    amount: 0.5,
    fee: 0.0005,
    toAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    status: 'pending' as const,
    txHash: null,
    requestedAt: new Date(),
    approvedAt: null,
    completedAt: null,
    rejectReason: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
            withdrawal: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              aggregate: jest.fn(),
            },
            withdrawalLimit: {
              findUnique: jest.fn(),
            },
            withdrawalFee: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: WalletService,
          useValue: {
            getUserId: jest.fn(),
            addBalance: jest.fn(),
            subtractBalance: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyWithdrawalCompleted: jest.fn(),
          },
        },
        {
          provide: NotificationsGateway,
          useValue: {
            sendToUser: jest.fn(),
          },
        },
        {
          provide: TwoFactorService,
          useValue: {
            verifyTwoFactorToken: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<WithdrawalsService>(WithdrawalsService);
    prisma = module.get<PrismaService>(PrismaService);
    walletService = module.get<WalletService>(WalletService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWithdrawals', () => {
    it('사용자의 출금 내역을 최신순으로 조회해야 합니다', async () => {
      // Arrange
      const withdrawals = [
        { ...mockWithdrawal, requestedAt: new Date('2024-03-01') },
        {
          ...mockWithdrawal,
          id: 'withdrawal-456',
          requestedAt: new Date('2024-02-01'),
        },
      ];
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.withdrawal, 'findMany').mockResolvedValue(withdrawals);

      // Act
      const result = await service.getWithdrawals('test@example.com');

      // Assert
      expect(result).toEqual(withdrawals);
      expect(prisma.withdrawal.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { requestedAt: 'desc' },
      });
    });

    it('사용자를 찾을 수 없으면 빈 배열을 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // Act
      const result = await service.getWithdrawals('nonexistent@example.com');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('requestWithdrawal', () => {
    it('출금 요청을 생성하고 잔고를 차감해야 합니다', async () => {
      // Arrange
      const dto: CreateWithdrawalDto = {
        asset: 'BTC',
        amount: 0.5,
        toAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        twoFactorToken: '123456',
      };
      jest.spyOn(walletService, 'getUserId').mockResolvedValue('user-123');
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(walletService, 'subtractBalance').mockResolvedValue(undefined);
      jest.spyOn(prisma.withdrawalFee, 'findUnique').mockResolvedValue({
        id: 'fee-1',
        asset: 'BTC',
        baseFee: 0.0005 as any,
        networkFee: null,
        minFee: 0.0001 as any,
        maxFee: 0.001 as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(prisma.withdrawalLimit, 'findUnique').mockResolvedValue({
        id: 'limit-1',
        asset: 'BTC',
        dailyLimit: 10 as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(prisma.withdrawal, 'aggregate').mockResolvedValue({
        _sum: { amount: 0 },
        _count: { amount: 0 },
        _avg: { amount: null },
        _min: { amount: null },
        _max: { amount: null },
      });
      jest.spyOn(prisma.withdrawal, 'create').mockResolvedValue(mockWithdrawal);

      // Act
      const result = await service.requestWithdrawal('test@example.com', dto);

      // Assert
      expect(result).toEqual(mockWithdrawal);
      expect(walletService.subtractBalance).toHaveBeenCalledWith(
        'user-123',
        'BTC',
        0.5005,
      ); // amount + fee
    });

    it('최소 출금액 미달 시 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      const dto: CreateWithdrawalDto = {
        asset: 'BTC',
        amount: 0.0001, // MIN_WITHDRAWAL[BTC] = 0.001보다 작음
        toAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        twoFactorToken: '123456',
      };
      jest.spyOn(walletService, 'getUserId').mockResolvedValue('user-123');
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.requestWithdrawal('test@example.com', dto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.requestWithdrawal('test@example.com', dto),
      ).rejects.toThrow('최소 출금액');
    });

    it('일일 한도 초과 시 BadRequestException을 발생시키고 잔고를 복구해야 합니다', async () => {
      // Arrange
      const dto: CreateWithdrawalDto = {
        asset: 'BTC',
        amount: 5, // 이미 오늘 6 BTC 출금했다고 가정하면 초과
        toAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        twoFactorToken: '123456',
      };
      jest.spyOn(walletService, 'getUserId').mockResolvedValue('user-123');
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(walletService, 'subtractBalance').mockResolvedValue(undefined);
      jest.spyOn(walletService, 'addBalance').mockResolvedValue(undefined);
      jest.spyOn(prisma.withdrawalFee, 'findUnique').mockResolvedValue({
        id: 'fee-1',
        asset: 'BTC',
        baseFee: 0.0005 as any,
        networkFee: null,
        minFee: 0.0001 as any,
        maxFee: 0.001 as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(prisma.withdrawalLimit, 'findUnique').mockResolvedValue({
        id: 'limit-1',
        asset: 'BTC',
        dailyLimit: 10 as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(prisma.withdrawal, 'aggregate').mockResolvedValue({
        _sum: { amount: 6 }, // 오늘 이미 6 BTC 출금
        _count: { amount: 1 },
        _avg: { amount: 6 },
        _min: { amount: 6 },
        _max: { amount: 6 },
      });

      // Act & Assert
      await expect(
        service.requestWithdrawal('test@example.com', dto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.requestWithdrawal('test@example.com', dto),
      ).rejects.toThrow('24시간 출금 한도 초과');
      // 잔고 복구 확인
      expect(walletService.addBalance).toHaveBeenCalledWith(
        'user-123',
        'BTC',
        5.0005,
      );
    });

    it('수수료를 올바르게 계산해야 합니다', async () => {
      // Arrange
      const dto: CreateWithdrawalDto = {
        asset: 'USDT',
        amount: 100,
        toAddress: '0xAddress',
        twoFactorToken: '123456',
      };
      jest.spyOn(walletService, 'getUserId').mockResolvedValue('user-123');
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(walletService, 'subtractBalance').mockResolvedValue(undefined);
      jest.spyOn(prisma.withdrawalFee, 'findUnique').mockResolvedValue({
        id: 'fee-2',
        asset: 'USDT',
        baseFee: 1.0 as any,
        networkFee: null,
        minFee: 0.5 as any,
        maxFee: 5.0 as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(prisma.withdrawalLimit, 'findUnique').mockResolvedValue({
        id: 'limit-2',
        asset: 'USDT',
        dailyLimit: 100000 as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(prisma.withdrawal, 'aggregate').mockResolvedValue({
        _sum: { amount: 0 },
        _count: { amount: 0 },
        _avg: { amount: null },
        _min: { amount: null },
        _max: { amount: null },
      });
      jest.spyOn(prisma.withdrawal, 'create').mockResolvedValue({
        ...mockWithdrawal,
        asset: 'USDT',
        amount: 100,
        fee: 1.0, // WITHDRAWAL_FEES[USDT] = 1.0
      });

      // Act
      const result = await service.requestWithdrawal('test@example.com', dto);

      // Assert
      expect(result.fee).toBe(1.0);
      expect(walletService.subtractBalance).toHaveBeenCalledWith(
        'user-123',
        'USDT',
        101,
      ); // amount + fee
    });
  });

  describe('approveWithdrawal', () => {
    it('출금을 승인해야 합니다', async () => {
      // Arrange
      const approvedWithdrawal = {
        ...mockWithdrawal,
        status: 'approved' as const,
        approvedAt: expect.any(Date),
      };
      jest
        .spyOn(prisma.withdrawal, 'findUnique')
        .mockResolvedValue(mockWithdrawal);
      jest
        .spyOn(prisma.withdrawal, 'update')
        .mockResolvedValue(approvedWithdrawal);

      // Act
      const result = await service.approveWithdrawal('withdrawal-123');

      // Assert
      expect(result.status).toBe('approved');
      expect(result.approvedAt).toBeDefined();
    });

    it('존재하지 않는 출금에 대해 NotFoundException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.withdrawal, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(service.approveWithdrawal('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('이미 처리된 출금에 대해 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      const processedWithdrawal = {
        ...mockWithdrawal,
        status: 'approved' as const,
      };
      jest
        .spyOn(prisma.withdrawal, 'findUnique')
        .mockResolvedValue(processedWithdrawal);

      // Act & Assert
      await expect(service.approveWithdrawal('withdrawal-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rejectWithdrawal', () => {
    it('출금을 거부하고 잔고를 복구해야 합니다', async () => {
      // Arrange
      const rejectedWithdrawal = {
        ...mockWithdrawal,
        status: 'rejected' as const,
        rejectReason: '부정 거래 의심',
      };
      jest
        .spyOn(prisma.withdrawal, 'findUnique')
        .mockResolvedValue(mockWithdrawal);
      jest.spyOn(walletService, 'addBalance').mockResolvedValue(undefined);
      jest
        .spyOn(prisma.withdrawal, 'update')
        .mockResolvedValue(rejectedWithdrawal);

      // Act
      const result = await service.rejectWithdrawal(
        'withdrawal-123',
        '부정 거래 의심',
      );

      // Assert
      expect(result.status).toBe('rejected');
      expect(result.rejectReason).toBe('부정 거래 의심');
      expect(walletService.addBalance).toHaveBeenCalledWith(
        'user-123',
        'BTC',
        0.5005,
      ); // amount + fee 복구
    });

    it('존재하지 않는 출금에 대해 NotFoundException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.withdrawal, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.rejectWithdrawal('nonexistent', '이유'),
      ).rejects.toThrow(NotFoundException);
    });

    it('이미 처리된 출금에 대해 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      const processedWithdrawal = {
        ...mockWithdrawal,
        status: 'approved' as const,
      };
      jest
        .spyOn(prisma.withdrawal, 'findUnique')
        .mockResolvedValue(processedWithdrawal);

      // Act & Assert
      await expect(
        service.rejectWithdrawal('withdrawal-123', '이유'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
