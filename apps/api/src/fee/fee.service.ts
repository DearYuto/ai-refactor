import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * 수수료 서비스
 *
 * 역할:
 * - 거래 수수료 계산 (고정밀도 연산)
 * - Maker/Taker 구분
 * - 자산별 수수료율 관리
 *
 * 정밀도 처리:
 * - 부동소수점 오차 방지를 위해 고정 소수점 연산 사용
 * - 모든 금액을 satoshi 단위(1e8)로 변환하여 정수 연산
 */
@Injectable()
export class FeeService {
  // 기본 수수료율 (자산별 설정이 없을 경우)
  private readonly DEFAULT_MAKER_FEE = 0.001; // 0.1%
  private readonly DEFAULT_TAKER_FEE = 0.002; // 0.2%

  // 고정밀도 계산을 위한 스케일 팩터 (소수점 8자리)
  private readonly PRECISION = 100000000; // 1e8 (satoshi 단위)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 수수료 계산 (고정밀도)
   *
   * 부동소수점 오차 방지:
   * 1. 모든 값을 정수로 변환 (1e8 곱하기)
   * 2. 정수 연산 수행
   * 3. 결과를 다시 float로 변환 (1e8 나누기)
   *
   * @param orderType - 주문 타입 ('limit' = Maker, 'market' = Taker)
   * @param size - 거래 수량
   * @param price - 거래 가격
   * @param asset - 자산 (예: 'BTC', 'ETH')
   * @returns 수수료 금액
   */
  async calculateFee(
    orderType: 'limit' | 'market',
    size: number,
    price: number,
    asset: string,
  ): Promise<number> {
    // Maker = 지정가 주문 (오더북에 등록)
    // Taker = 시장가 주문 (즉시 체결)
    const isMaker = orderType === 'limit';

    // 자산별 수수료율 조회 (DB에서)
    const feeConfig = await this.getFeeConfig(asset);

    // 수수료율 결정
    const feeRate = isMaker ? feeConfig.makerFee : feeConfig.takerFee;

    // 고정밀도 연산
    // 1. 모든 값을 정수로 변환 (satoshi 단위)
    const sizeInt = Math.round(size * this.PRECISION);
    const priceInt = Math.round(price * this.PRECISION);
    const feeRateInt = Math.round(feeRate * this.PRECISION);

    // 2. 정수 연산: (size * price * feeRate) / (PRECISION^2)
    // BigInt 사용하여 오버플로우 방지
    const totalValueInt = BigInt(sizeInt) * BigInt(priceInt);
    const feeInt = totalValueInt * BigInt(feeRateInt);

    // 3. 결과를 다시 float로 변환
    const fee = Number(feeInt) / Math.pow(this.PRECISION, 3);

    // 소수점 8자리로 반올림 (Bitcoin 정밀도)
    return Math.round(fee * this.PRECISION) / this.PRECISION;
  }

  /**
   * 자산별 수수료 설정 조회
   *
   * @param asset - 자산 심볼
   * @returns 수수료 설정 { makerFee, takerFee }
   */
  async getFeeConfig(asset: string): Promise<{ makerFee: number; takerFee: number }> {
    const config = await this.prisma.fee.findUnique({
      where: { asset },
    });

    if (config) {
      return {
        makerFee: config.makerFee,
        takerFee: config.takerFee,
      };
    }

    // DB에 설정이 없으면 기본값 반환
    return {
      makerFee: this.DEFAULT_MAKER_FEE,
      takerFee: this.DEFAULT_TAKER_FEE,
    };
  }

  /**
   * 자산별 수수료율 설정
   * (관리자 기능)
   *
   * @param asset - 자산 심볼
   * @param makerFee - Maker 수수료율
   * @param takerFee - Taker 수수료율
   */
  async setFeeConfig(asset: string, makerFee: number, takerFee: number): Promise<void> {
    await this.prisma.fee.upsert({
      where: { asset },
      update: { makerFee, takerFee },
      create: { asset, makerFee, takerFee },
    });
  }

  /**
   * 예상 수수료 계산 (프론트엔드용)
   *
   * @param orderType - 주문 타입
   * @param size - 수량
   * @param price - 가격
   * @param asset - 자산
   * @returns { fee: number, feeRate: number }
   */
  async estimateFee(
    orderType: 'limit' | 'market',
    size: number,
    price: number,
    asset: string,
  ): Promise<{ fee: number; feeRate: number }> {
    const isMaker = orderType === 'limit';
    const feeConfig = await this.getFeeConfig(asset);
    const feeRate = isMaker ? feeConfig.makerFee : feeConfig.takerFee;
    const fee = await this.calculateFee(orderType, size, price, asset);

    return { fee, feeRate };
  }
}
