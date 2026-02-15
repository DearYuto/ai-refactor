import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketGateway } from './market.gateway';
import { MarketService } from './market.service';
import { MarketStreamService } from './market.stream.service';

@Module({
  controllers: [MarketController],
  providers: [MarketService, MarketStreamService, MarketGateway],
  exports: [MarketStreamService],
})
export class MarketModule {}
