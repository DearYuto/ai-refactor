import {
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateDepositDto {
  @IsEnum(['BTC', 'USDT', 'KRW'])
  asset: 'BTC' | 'USDT' | 'KRW';

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  txHash?: string;

  @IsOptional()
  @IsString()
  fromAddress?: string; // 입금 출처 주소 (검증용)
}
