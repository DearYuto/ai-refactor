import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { TwoFactorService } from './two-factor.service';

@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  // 2FA 설정 시작 (QR 코드 생성)
  @Post('setup')
  async setupTwoFactor(@CurrentUser('email') email: string) {
    return this.twoFactorService.generateSecret(email);
  }

  // 2FA 활성화 (코드 검증 후)
  @Post('enable')
  async enableTwoFactor(
    @CurrentUser('email') email: string,
    @Body('token') token: string,
  ) {
    return this.twoFactorService.enableTwoFactor(email, token);
  }

  // 2FA 비활성화
  @Post('disable')
  async disableTwoFactor(
    @CurrentUser('email') email: string,
    @Body('token') token: string,
  ) {
    return this.twoFactorService.disableTwoFactor(email, token);
  }

  // 백업 코드 조회
  @Get('backup-codes')
  async getBackupCodes(@CurrentUser('email') email: string) {
    return this.twoFactorService.getBackupCodes(email);
  }

  // 백업 코드 재생성
  @Post('backup-codes/regenerate')
  async regenerateBackupCodes(@CurrentUser('email') email: string) {
    return this.twoFactorService.regenerateBackupCodes(email);
  }
}
