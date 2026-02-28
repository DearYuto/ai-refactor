import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { EmailVerificationService } from './email-verification.service';

@Controller('auth/email')
export class EmailVerificationController {
  constructor(
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  // 인증 이메일 발송
  @Post('send-verification')
  @UseGuards(JwtAuthGuard)
  async sendVerification(@CurrentUser('email') email: string) {
    return this.emailVerificationService.sendVerificationEmail(email);
  }

  // 이메일 인증 확인
  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    return this.emailVerificationService.verifyEmail(token);
  }
}
