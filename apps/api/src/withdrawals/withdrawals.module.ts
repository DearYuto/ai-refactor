import { Module } from '@nestjs/common';
import { WithdrawalsController } from './withdrawals.controller';
import { WithdrawalsService } from './withdrawals.service';
import { DatabaseModule } from '../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { LoggerModule } from '../common/logger/logger.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    WalletModule,
    LoggerModule,
    NotificationsModule,
    AuthModule, // TwoFactorService, AdminGuard를 위해 추가
  ],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
})
export class WithdrawalsModule {}
