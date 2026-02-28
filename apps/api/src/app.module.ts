import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { MarketModule } from './market/market.module';
import { OrdersModule } from './orders/orders.module';
import { FeeModule } from './fee/fee.module';
import { MatchingModule } from './matching/matching.module';
import { TradesModule } from './trades/trades.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['apps/api/.env', '.env'],
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    WalletModule,
    MarketModule,
    OrdersModule,
    FeeModule,
    MatchingModule,
    TradesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
