import { Module } from '@nestjs/common';
import { FeeService } from './fee.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}
