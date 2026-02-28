import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TradesService } from './trades.service';
import { TradesController } from './trades.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [TradesController],
  providers: [TradesService],
  exports: [TradesService],
})
export class TradesModule {}
