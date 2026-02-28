import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { DEFAULT_BALANCES } from '../common/constants/assets';
import { LoggerService } from '../common/logger/logger.service';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async signup(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      this.logger.logAuth('signup', email, false);
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });

    await this.prisma.walletBalance.createMany({
      data: DEFAULT_BALANCES.map((b) => ({
        userId: user.id,
        asset: b.asset,
        available: b.available,
        locked: 0,
      })),
    });

    this.logger.logAuth('signup', email, true);
    return this.signToken(email);
  }

  async login(
    email: string,
    password: string,
    twoFactorToken?: string,
  ): Promise<
    { accessToken: string } | { requiresTwoFactor: true; message: string }
  > {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.logAuth('login', email, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      this.logger.logAuth('login', email, false);
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2FA 활성화된 경우
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        // 2FA 코드 요구
        return {
          requiresTwoFactor: true,
          message: '2FA code required',
        };
      }

      // 2FA 코드 검증
      const isValid = await this.twoFactorService.verifyTwoFactorToken(
        user.id,
        twoFactorToken,
      );

      if (!isValid) {
        this.logger.logAuth('login', email, false);
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    this.logger.logAuth('login', user.email, true);
    return this.signToken(user.email);
  }

  private signToken(email: string): { accessToken: string } {
    return { accessToken: this.jwtService.sign({ email }) };
  }
}
