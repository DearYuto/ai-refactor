import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * 수수료 서비스
 *
 * 역할:
 * - 거래 수수료 계산
 * - Maker/Taker 구분
 * - 자산별 수수료율 관리
 */
@Injectable()
export class FeeService {
  // 기본 수수료율 (자산별 설정이 없을 경우)
  private readonly DEFAULT_MAKER_FEE = 0.001; // 0.1%
  private readonly DEFAULT_TAKER_FEE = 0.002; // 0.2%

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 수수료 계산
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

    // 수수료 = 거래 금액 * 수수료율
    const totalValue = size * price;
    const fee = totalValue * feeRate;

    return fee;
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
