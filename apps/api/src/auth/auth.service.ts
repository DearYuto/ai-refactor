import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { DEFAULT_BALANCES } from '../common/constants/assets';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async signup(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
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

    return this.signToken(email);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.email);
  }

  private signToken(email: string): { accessToken: string } {
    return { accessToken: this.jwtService.sign({ email }) };
  }
}
