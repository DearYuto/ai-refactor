import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../common/email/email.service';
import { LoggerService } from '../common/logger/logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly logger: LoggerService,
  ) {}

  async sendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    // 기존 토큰 삭제
    await this.prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    // 새 토큰 생성
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24시간 유효

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // 이메일 발송
    await this.emailService.sendVerificationEmail(email, token);

    this.logger.log(`이메일 인증 발송: ${email}`, 'EmailVerificationService');

    return {
      success: true,
      message: 'Verification email sent',
    };
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestException('Invalid verification token');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('Verification token expired');
    }

    // 이메일 인증 완료
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      }),
      this.prisma.emailVerification.delete({
        where: { id: verification.id },
      }),
    ]);

    this.logger.log(
      `이메일 인증 완료: ${verification.user.email}`,
      'EmailVerificationService',
    );

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }
}
