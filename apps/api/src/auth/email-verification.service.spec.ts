import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../common/email/email.service';
import { LoggerService } from '../common/logger/logger.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let prisma: PrismaService;
  let emailService: EmailService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hash',
    role: 'USER',
    emailVerified: false,
    emailVerifiedAt: null,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVerification = {
    id: 'verification-123',
    userId: 'user-123',
    token: 'token-abc-123',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailVerificationService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            emailVerification: {
              deleteMany: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn((operations) => {
              if (Array.isArray(operations)) {
                return Promise.all(
                  operations.map((op) => (op instanceof Promise ? op : op)),
                );
              }
              return Promise.resolve(operations);
            }),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmailVerificationService>(EmailVerificationService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendVerificationEmail', () => {
    it('인증 토큰을 생성하고 이메일을 발송해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prisma.emailVerification, 'deleteMany')
        .mockResolvedValue({ count: 0 });
      jest
        .spyOn(prisma.emailVerification, 'create')
        .mockResolvedValue(mockVerification);
      jest
        .spyOn(emailService, 'sendVerificationEmail')
        .mockResolvedValue(undefined);

      // Act
      const result = await service.sendVerificationEmail('test@example.com');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Verification email sent');
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
      expect(prisma.emailVerification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          token: expect.any(String),
          expiresAt: expect.any(Date),
        },
      });
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('사용자를 찾을 수 없으면 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.sendVerificationEmail('nonexistent@example.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('이미 인증된 이메일이면 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });

      // Act & Assert
      await expect(
        service.sendVerificationEmail('test@example.com'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.sendVerificationEmail('test@example.com'),
      ).rejects.toThrow('Email already verified');
    });

    it('기존 인증 토큰을 삭제하고 새로운 토큰을 생성해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prisma.emailVerification, 'deleteMany')
        .mockResolvedValue({ count: 1 });
      jest
        .spyOn(prisma.emailVerification, 'create')
        .mockResolvedValue(mockVerification);
      jest
        .spyOn(emailService, 'sendVerificationEmail')
        .mockResolvedValue(undefined);

      // Act
      await service.sendVerificationEmail('test@example.com');

      // Assert
      expect(prisma.emailVerification.deleteMany).toHaveBeenCalledTimes(1);
      expect(prisma.emailVerification.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyEmail', () => {
    it('올바른 토큰으로 이메일을 인증해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.emailVerification, 'findUnique')
        .mockResolvedValue(mockVerification);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
      jest
        .spyOn(prisma.emailVerification, 'delete')
        .mockResolvedValue(mockVerification);

      // Act
      const result = await service.verifyEmail('token-abc-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Email verified successfully');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('잘못된 토큰에 대해 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.emailVerification, 'findUnique')
        .mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid verification token',
      );
    });

    it('만료된 토큰에 대해 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      const expiredVerification = {
        ...mockVerification,
        expiresAt: new Date(Date.now() - 1000), // 과거 시간
      };
      jest
        .spyOn(prisma.emailVerification, 'findUnique')
        .mockResolvedValue(expiredVerification);

      // Act & Assert
      await expect(service.verifyEmail('token-abc-123')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail('token-abc-123')).rejects.toThrow(
        'Verification token expired',
      );
    });

    it('인증 완료 시 사용자 정보를 업데이트하고 토큰을 삭제해야 합니다', async () => {
      // Arrange
      jest
        .spyOn(prisma.emailVerification, 'findUnique')
        .mockResolvedValue(mockVerification);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
      jest
        .spyOn(prisma.emailVerification, 'delete')
        .mockResolvedValue(mockVerification);

      // Mock transaction to execute operations
      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (operations: any) => {
          const userUpdate = await operations[0];
          const verificationDelete = await operations[1];
          return [userUpdate, verificationDelete];
        });

      // Act
      await service.verifyEmail('token-abc-123');

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          emailVerified: true,
          emailVerifiedAt: expect.any(Date),
        },
      });
      expect(prisma.emailVerification.delete).toHaveBeenCalledWith({
        where: { id: 'verification-123' },
      });
    });

    it('토큰 유효 기간이 24시간이어야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest
        .spyOn(prisma.emailVerification, 'deleteMany')
        .mockResolvedValue({ count: 0 });

      let capturedExpiresAt: Date | undefined;
      jest.spyOn(prisma.emailVerification, 'create').mockImplementation((async (
        args: any,
      ) => {
        capturedExpiresAt = args.data.expiresAt;
        return mockVerification;
      }) as any);
      jest
        .spyOn(emailService, 'sendVerificationEmail')
        .mockResolvedValue(undefined);

      // Act
      await service.sendVerificationEmail('test@example.com');

      // Assert
      expect(capturedExpiresAt).toBeDefined();
      const now = new Date();
      const hoursDiff =
        (capturedExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeGreaterThanOrEqual(23.9); // 약간의 오차 허용
      expect(hoursDiff).toBeLessThanOrEqual(24.1);
    });
  });
});
