import { IsEnum, IsNumber, IsPositive, IsString, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @IsEnum(['BTC', 'USDT', 'KRW'])
  asset: 'BTC' | 'USDT' | 'KRW';

  @IsNumber()
  @IsPositive()
  @Min(0.001) // 최소 출금액: 0.001 BTC
  amount: number;

  @IsString()
  toAddress: string; // 출금 주소

  @IsString()
  twoFactorToken: string; // 2FA 코드 (필수)
}
