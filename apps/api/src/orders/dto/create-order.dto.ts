import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
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
  size: number;

  @ValidateIf((o: CreateOrderDto) => o.type === 'limit')
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsEnum(MARKET_SOURCES)
  source: 'BINANCE' | 'UPBIT';
}
