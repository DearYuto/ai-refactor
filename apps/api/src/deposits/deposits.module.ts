import { Module } from '@nestjs/common';
import { DepositsController } from './deposits.controller';
import { DepositsService } from './deposits.service';
import { DatabaseModule } from '../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { LoggerModule } from '../common/logger/logger.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, WalletModule, LoggerModule, NotificationsModule],
  controllers: [DepositsController],
  providers: [DepositsService],
})
export class DepositsModule {}
