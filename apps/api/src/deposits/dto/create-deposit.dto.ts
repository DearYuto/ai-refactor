import { IsEnum, IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class CreateDepositDto {
  @IsEnum(['BTC', 'USDT', 'KRW'])
  asset: 'BTC' | 'USDT' | 'KRW';

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  txHash?: string;
}
