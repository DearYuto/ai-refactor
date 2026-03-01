import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { EmailService } from '../common/email/email.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let emailService: EmailService;

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

  const mockNotification = {
    id: 'notif-123',
    userId: 'user-123',
    type: 'ORDER_FILLED',
    title: '주문 체결 완료',
    message: '매수 주문이 체결되었습니다',
    data: {},
    read: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: {
            notification: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              count: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
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
          provide: EmailService,
          useValue: {
            sendOrderFilledEmail: jest.fn(),
            sendDepositConfirmedEmail: jest.fn(),
            sendWithdrawalCompletedEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('알림을 생성해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);

      // Act
      const result = await service.createNotification(
        'user-123',
        'ORDER_FILLED',
        '주문 체결 완료',
        '매수 주문이 체결되었습니다',
        { orderId: 'order-123' },
      );

      // Assert
      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          type: 'ORDER_FILLED',
          title: '주문 체결 완료',
          message: '매수 주문이 체결되었습니다',
          data: { orderId: 'order-123' },
        },
      });
    });

    it('data가 없으면 빈 객체를 사용해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);

      // Act
      await service.createNotification(
        'user-123',
        'ORDER_FILLED',
        '주문 체결 완료',
        '매수 주문이 체결되었습니다',
      );

      // Assert
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          data: {},
        }),
      });
    });
  });

  describe('getNotifications', () => {
    it('사용자의 알림 목록을 최신순으로 조회해야 합니다', async () => {
      // Arrange
      const notifications = [
        { ...mockNotification, createdAt: new Date('2024-03-01T12:00:00Z') },
        {
          ...mockNotification,
          id: 'notif-456',
          createdAt: new Date('2024-03-01T11:00:00Z'),
        },
      ];
      jest
        .spyOn(prisma.notification, 'findMany')
        .mockResolvedValue(notifications);

      // Act
      const result = await service.getNotifications('user-123');

      // Assert
      expect(result).toHaveLength(2);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('limit 파라미터로 조회 개수를 제한할 수 있어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.notification, 'findMany').mockResolvedValue([]);

      // Act
      await service.getNotifications('user-123', 10);

      // Assert
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it('기본 limit은 50이어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.notification, 'findMany').mockResolvedValue([]);

      // Act
      await service.getNotifications('user-123');

      // Assert
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('읽지 않은 알림 개수를 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(5);

      // Act
      const result = await service.getUnreadCount('user-123');

      // Assert
      expect(result).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          read: false,
        },
      });
    });

    it('읽지 않은 알림이 없으면 0을 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.notification, 'count').mockResolvedValue(0);

      // Act
      const result = await service.getUnreadCount('user-123');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('알림을 읽음 처리해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'findFirst')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prisma.notification, 'update').mockResolvedValue({
        ...mockNotification,
        read: true,
      });

      // Act
      const result = await service.markAsRead('notif-123', 'user-123');

      // Assert
      expect(result.read).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-123' },
        data: { read: true },
      });
    });

    it('존재하지 않는 알림에 대해 에러를 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.notification, 'findFirst').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.markAsRead('nonexistent', 'user-123'),
      ).rejects.toThrow('Notification not found');
    });

    it('다른 사용자의 알림은 읽을 수 없어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.notification, 'findFirst').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.markAsRead('notif-123', 'other-user'),
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('모든 읽지 않은 알림을 읽음 처리해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'updateMany')
        .mockResolvedValue({ count: 5 });

      // Act
      const result = await service.markAllAsRead('user-123');

      // Assert
      expect(result.count).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          read: false,
        },
        data: { read: true },
      });
    });

    it('읽지 않은 알림이 없으면 0을 반환해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'updateMany')
        .mockResolvedValue({ count: 0 });

      // Act
      const result = await service.markAllAsRead('user-123');

      // Assert
      expect(result.count).toBe(0);
    });
  });

  describe('notifyOrderFilled', () => {
    it('주문 체결 알림을 생성해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(emailService, 'sendOrderFilledEmail')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.notifyOrderFilled(
        'user-123',
        'order-123',
        'buy',
        0.5,
        50000,
        'BTC',
      );

      // Assert
      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          type: 'ORDER_FILLED',
          title: '주문 체결 완료',
          message: expect.stringContaining('매수'),
        }),
      });
    });

    it('매수 주문 메시지를 올바르게 생성해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(emailService, 'sendOrderFilledEmail')
        .mockResolvedValue(undefined);

      // Act
      await service.notifyOrderFilled(
        'user-123',
        'order-123',
        'buy',
        0.5,
        50000,
        'BTC',
      );

      // Assert
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: '매수 주문이 체결되었습니다: 0.5 BTC @ $50000',
          }),
        }),
      );
    });

    it('매도 주문 메시지를 올바르게 생성해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(emailService, 'sendOrderFilledEmail')
        .mockResolvedValue(undefined);

      // Act
      await service.notifyOrderFilled(
        'user-123',
        'order-123',
        'sell',
        0.5,
        50000,
        'BTC',
      );

      // Assert
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: '매도 주문이 체결되었습니다: 0.5 BTC @ $50000',
          }),
        }),
      );
    });

    it('이메일 인증된 사용자에게 이메일을 발송해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(emailService, 'sendOrderFilledEmail')
        .mockResolvedValue(undefined);

      // Act
      await service.notifyOrderFilled(
        'user-123',
        'order-123',
        'buy',
        0.5,
        50000,
        'BTC',
      );

      // Assert
      expect(emailService.sendOrderFilledEmail).toHaveBeenCalledWith(
        'test@example.com',
        'buy',
        0.5,
        50000,
        'BTC',
      );
    });

    it('이메일 인증되지 않은 사용자에게는 이메일을 발송하지 않아야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });
      jest
        .spyOn(emailService, 'sendOrderFilledEmail')
        .mockResolvedValue(undefined);

      // Act
      await service.notifyOrderFilled(
        'user-123',
        'order-123',
        'buy',
        0.5,
        50000,
        'BTC',
      );

      // Assert
      expect(emailService.sendOrderFilledEmail).not.toHaveBeenCalled();
    });
  });

  describe('notifyDepositConfirmed', () => {
    it('입금 확인 알림을 생성하고 이메일을 발송해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(emailService, 'sendDepositConfirmedEmail')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.notifyDepositConfirmed(
        'user-123',
        'deposit-123',
        0.5,
        'BTC',
      );

      // Assert
      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'DEPOSIT_CONFIRMED',
          title: '입금 확인',
          message: '0.5 BTC 입금이 확인되었습니다.',
        }),
      });
      expect(emailService.sendDepositConfirmedEmail).toHaveBeenCalledWith(
        'test@example.com',
        0.5,
        'BTC',
      );
    });
  });

  describe('notifyWithdrawalCompleted', () => {
    it('출금 완료 알림을 생성하고 이메일을 발송해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.notification, 'create')
        .mockResolvedValue(mockNotification);
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(emailService, 'sendWithdrawalCompletedEmail')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.notifyWithdrawalCompleted(
        'user-123',
        'withdrawal-123',
        0.5,
        'BTC',
      );

      // Assert
      expect(result).toEqual(mockNotification);
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'WITHDRAWAL_COMPLETED',
          title: '출금 완료',
          message: '0.5 BTC 출금이 완료되었습니다.',
        }),
      });
      expect(emailService.sendWithdrawalCompletedEmail).toHaveBeenCalledWith(
        'test@example.com',
        0.5,
        'BTC',
      );
    });
  });
});
