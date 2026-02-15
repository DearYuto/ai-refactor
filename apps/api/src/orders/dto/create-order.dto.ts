import { IsEnum, IsNumber, IsPositive } from 'class-validator';

const ORDER_SIDES = ['buy', 'sell'] as const;
const MARKET_SOURCES = ['BINANCE', 'UPBIT'] as const;

export class CreateOrderDto {
  @IsEnum(ORDER_SIDES)
  side: 'buy' | 'sell';

  @IsNumber()
  @IsPositive()
  size: number;

  @IsEnum(MARKET_SOURCES)
  source: 'BINANCE' | 'UPBIT';
}
