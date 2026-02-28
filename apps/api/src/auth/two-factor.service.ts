import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { randomBytes } from 'crypto';

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async generateSecret(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA already enabled');
    }

    // Secret 생성
    const secret = speakeasy.generateSecret({
      name: `CryptoExchange (${email})`,
      length: 32,
    });

    // 임시로 저장 (활성화 전)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret.base32 },
    });

    // QR 코드 생성
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    this.logger.log(`2FA 설정 시작: ${email}`, 'TwoFactorService');

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async enableTwoFactor(email: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    // 토큰 검증
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2, // 시간 오차 허용 (±1분)
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // 백업 코드 생성
    const backupCodes = this.generateBackupCodesArray();

    await this.prisma.$transaction([
      // 2FA 활성화
      this.prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      }),
      // 백업 코드 저장
      ...backupCodes.map((code) =>
        this.prisma.backupCode.create({
          data: {
            userId: user.id,
            code,
          },
        }),
      ),
    ]);

    this.logger.log(`2FA 활성화: ${email}`, 'TwoFactorService');

    return {
      success: true,
      backupCodes, // 사용자에게 한 번만 표시
    };
  }

  async disableTwoFactor(email: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled');
    }

    // 토큰 검증 (또는 백업 코드)
    const isValidToken = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    const isValidBackupCode = await this.verifyBackupCode(user.id, token);

    if (!isValidToken && !isValidBackupCode) {
      throw new BadRequestException('Invalid 2FA code or backup code');
    }

    // 2FA 비활성화 및 백업 코드 삭제
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      }),
      this.prisma.backupCode.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    this.logger.log(`2FA 비활성화: ${email}`, 'TwoFactorService');

    return { success: true };
  }

  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    // 일반 TOTP 토큰 검증
    const isValidToken = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (isValidToken) return true;

    // 백업 코드 검증
    return this.verifyBackupCode(userId, token);
  }

  private async verifyBackupCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const backupCode = await this.prisma.backupCode.findFirst({
      where: {
        userId,
        code,
        used: false,
      },
    });

    if (!backupCode) return false;

    // 백업 코드 사용 처리
    await this.prisma.backupCode.update({
      where: { id: backupCode.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    this.logger.log(`백업 코드 사용: ${userId}`, 'TwoFactorService');

    return true;
  }

  async getBackupCodes(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('User not found');

    const codes = await this.prisma.backupCode.findMany({
      where: { userId: user.id },
      select: {
        code: true,
        used: true,
        usedAt: true,
      },
    });

    return codes;
  }

  async regenerateBackupCodes(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA not enabled');
    }

    // 기존 백업 코드 삭제
    await this.prisma.backupCode.deleteMany({
      where: { userId: user.id },
    });

    // 새 백업 코드 생성
    const backupCodes = this.generateBackupCodesArray();
    await Promise.all(
      backupCodes.map((code) =>
        this.prisma.backupCode.create({
          data: {
            userId: user.id,
            code,
          },
        }),
      ),
    );

    this.logger.log(`백업 코드 재생성: ${email}`, 'TwoFactorService');

    return { backupCodes };
  }

  private generateBackupCodesArray(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
