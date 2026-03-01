import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { PrismaService } from '../database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import * as speakeasy from 'speakeasy';
import * as bcrypt from 'bcryptjs';

// Mock speakeasy
jest.mock('speakeasy');
jest.mock('qrcode');
jest.mock('bcryptjs');

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let prisma: PrismaService;

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

  const mockBackupCode = {
    id: 'backup-123',
    userId: 'user-123',
    code: 'ABCD1234',
    used: false,
    usedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            backupCode: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              deleteMany: jest.fn(),
              update: jest.fn(),
            },
            $transaction: jest.fn((operations) => {
              // 트랜잭션 모킹: 각 operation이 promise면 실행
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
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn((value) => `encrypted_${value}`),
            decrypt: jest.fn((value) => value.replace('encrypted_', '')),
          },
        },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('2FA Secret과 QR 코드를 생성해야 합니다', async () => {
      // Arrange
      const mockSecret = {
        base32: 'JBSWY3DPEHPK3PXP',
        otpauth_url:
          'otpauth://totp/CryptoExchange%20(test@example.com)?secret=JBSWY3DPEHPK3PXP',
      };
      const mockQrCode = 'data:image/png;base64,abc123';

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      (speakeasy.generateSecret as jest.Mock).mockReturnValue(mockSecret);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        twoFactorSecret: mockSecret.base32,
      });

      // QRCode mock
      const qrcode = require('qrcode');
      qrcode.toDataURL = jest.fn().mockResolvedValue(mockQrCode);

      // Act
      const result = await service.generateSecret('test@example.com');

      // Assert
      expect(result.secret).toBe(mockSecret.base32);
      expect(result.qrCode).toBe(mockQrCode);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { twoFactorSecret: `encrypted_${mockSecret.base32}` },
      });
    });

    it('사용자를 찾을 수 없으면 UnauthorizedException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateSecret('nonexistent@example.com'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('이미 2FA가 활성화되어 있으면 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
      });

      // Act & Assert
      await expect(service.generateSecret('test@example.com')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('enableTwoFactor', () => {
    it('올바른 TOTP 토큰으로 2FA를 활성화하고 백업 코드를 생성해야 합니다', async () => {
      // Arrange
      const userWithSecret = {
        ...mockUser,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userWithSecret);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      // 백업 코드 생성 모킹
      jest.spyOn(prisma.backupCode, 'create').mockResolvedValue(mockBackupCode);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...userWithSecret,
        twoFactorEnabled: true,
      });

      // Act
      const result = await service.enableTwoFactor(
        'test@example.com',
        '123456',
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.backupCodes).toHaveLength(10);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('잘못된 TOTP 토큰으로 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      const userWithSecret = {
        ...mockUser,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(userWithSecret);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);

      // Act & Assert
      await expect(
        service.enableTwoFactor('test@example.com', 'wrong'),
      ).rejects.toThrow(BadRequestException);
    });

    it('2FA 설정이 시작되지 않았으면 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.enableTwoFactor('test@example.com', '123456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('disableTwoFactor', () => {
    it('올바른 TOTP 토큰으로 2FA를 비활성화해야 합니다', async () => {
      // Arrange
      const userWithTwoFactor = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      };
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(userWithTwoFactor);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      jest.spyOn(prisma.backupCode, 'findMany').mockResolvedValue([]); // TOTP 사용 시 백업 코드 체크 안 함
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });
      jest
        .spyOn(prisma.backupCode, 'deleteMany')
        .mockResolvedValue({ count: 10 });

      // Act
      const result = await service.disableTwoFactor(
        'test@example.com',
        '123456',
      );

      // Assert
      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('백업 코드로 2FA를 비활성화할 수 있어야 합니다', async () => {
      // Arrange
      const userWithTwoFactor = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      };
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(userWithTwoFactor);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      jest
        .spyOn(prisma.backupCode, 'findMany')
        .mockResolvedValue([mockBackupCode]); // 백업 코드 반환
      jest
        .spyOn(prisma.backupCode, 'findFirst')
        .mockResolvedValue(mockBackupCode);
      jest.spyOn(prisma.backupCode, 'update').mockResolvedValue({
        ...mockBackupCode,
        used: true,
        usedAt: new Date(),
      });
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });
      jest
        .spyOn(prisma.backupCode, 'deleteMany')
        .mockResolvedValue({ count: 10 });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // 백업 코드 검증 성공

      // Act
      const result = await service.disableTwoFactor(
        'test@example.com',
        'ABCD1234',
      );

      // Assert
      expect(result.success).toBe(true);
    });

    it('2FA가 활성화되지 않았으면 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.disableTwoFactor('test@example.com', '123456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyTwoFactorToken', () => {
    it('올바른 TOTP 토큰을 검증해야 합니다', async () => {
      // Arrange
      const userWithTwoFactor = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      };
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(userWithTwoFactor);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      // Act
      const result = await service.verifyTwoFactorToken('user-123', '123456');

      // Assert
      expect(result).toBe(true);
    });

    it('백업 코드를 검증하고 사용 처리해야 합니다', async () => {
      // Arrange
      const userWithTwoFactor = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      };
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(userWithTwoFactor);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      jest
        .spyOn(prisma.backupCode, 'findMany')
        .mockResolvedValue([mockBackupCode]); // 백업 코드 반환
      jest
        .spyOn(prisma.backupCode, 'findFirst')
        .mockResolvedValue(mockBackupCode);
      jest.spyOn(prisma.backupCode, 'update').mockResolvedValue({
        ...mockBackupCode,
        used: true,
        usedAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // 백업 코드 검증 성공

      // Act
      const result = await service.verifyTwoFactorToken('user-123', 'ABCD1234');

      // Assert
      expect(result).toBe(true);
      expect(prisma.backupCode.update).toHaveBeenCalledWith({
        where: { id: mockBackupCode.id },
        data: {
          used: true,
          usedAt: expect.any(Date),
        },
      });
    });

    it('잘못된 토큰에 대해 false를 반환해야 합니다', async () => {
      // Arrange
      const userWithTwoFactor = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      };
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(userWithTwoFactor);
      (speakeasy.totp.verify as jest.Mock).mockReturnValue(false);
      jest.spyOn(prisma.backupCode, 'findMany').mockResolvedValue([]); // 백업 코드 없음
      jest.spyOn(prisma.backupCode, 'findFirst').mockResolvedValue(null);

      // Act
      const result = await service.verifyTwoFactorToken('user-123', 'wrong');

      // Assert
      expect(result).toBe(false);
    });

    it('2FA가 활성화되지 않은 사용자에 대해 false를 반환해야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      // Act
      const result = await service.verifyTwoFactorToken('user-123', '123456');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getBackupCodes', () => {
    it('사용자의 백업 코드 목록을 반환해야 합니다', async () => {
      // Arrange
      const backupCodes = [
        { code: 'ABCD1234', used: false, usedAt: null },
        { code: 'EFGH5678', used: true, usedAt: new Date() },
      ];
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(prisma.backupCode, 'findMany').mockResolvedValue(
        backupCodes.map((bc, i) => ({
          id: `backup-${i}`,
          userId: 'user-123',
          createdAt: new Date(),
          ...bc,
        })),
      );

      // Act
      const result = await service.getBackupCodes('test@example.com');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('ABCD1234');
      expect(result[1].used).toBe(true);
    });
  });

  describe('regenerateBackupCodes', () => {
    it('백업 코드를 재생성해야 합니다', async () => {
      // Arrange
      const userWithTwoFactor = {
        ...mockUser,
        twoFactorEnabled: true,
      };
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockResolvedValue(userWithTwoFactor);
      jest
        .spyOn(prisma.backupCode, 'deleteMany')
        .mockResolvedValue({ count: 10 });
      jest.spyOn(prisma.backupCode, 'create').mockResolvedValue(mockBackupCode);

      // Act
      const result = await service.regenerateBackupCodes('test@example.com');

      // Assert
      expect(result.backupCodes).toHaveLength(10);
      expect(prisma.backupCode.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('2FA가 활성화되지 않았으면 BadRequestException을 발생시켜야 합니다', async () => {
      // Arrange
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        service.regenerateBackupCodes('test@example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
