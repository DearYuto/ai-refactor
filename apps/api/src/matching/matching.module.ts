import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { MatchingEngineService } from './matching.service';
import { MatchingScheduler } from './matching.scheduler';
import { DatabaseModule } from '../database/database.module';
import { FeeModule } from '../fee/fee.module';
import { WalletModule } from '../wallet/wallet.module';
import { LoggerModule } from '../common/logger/logger.module';

@Module({
  imports: [
    ScheduleModule.forRoot(), // 크론 작업 활성화
    DatabaseModule,
    FeeModule,
    WalletModule,
    LoggerModule,
  ],
  providers: [MatchingEngineService, MatchingScheduler],
  exports: [MatchingEngineService],
})
export class MatchingModule {}
