import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

const ORDER_SIDES = ['buy', 'sell'] as const;
const ORDER_TYPES = ['market', 'limit'] as const;
const MARKET_SOURCES = ['BINANCE', 'UPBIT'] as const;

export class CreateOrderDto {
  @IsEnum(ORDER_SIDES)
  side: 'buy' | 'sell';

  @IsEnum(ORDER_TYPES)
  type: 'market' | 'limit';

  @IsNumber()
  @IsPositive()
  @Min(0.0001) // 최소 주문 수량: 0.0001 BTC
  @Max(1000) // 최대 주문 수량: 1000 BTC
  size: number;

  @ValidateIf((o: CreateOrderDto) => o.type === 'limit')
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Min(0.01) // 최소 가격: $0.01
  price?: number;

  @IsEnum(MARKET_SOURCES)
  source: 'BINANCE' | 'UPBIT';
}
