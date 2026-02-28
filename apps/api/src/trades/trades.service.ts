import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * 거래 내역 서비스
 *
 * 역할:
 * - 최근 거래 내역 조회 (public)
 * - 내 거래 내역 조회 (private)
 */
@Injectable()
export class TradesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 최근 거래 내역 조회 (public API)
   *
   * @param source - 마켓 소스 (예: 'BTC-USDT')
   * @param limit - 조회 개수 (기본: 50)
   * @returns Trade 레코드 배열
   */
  async getRecentTrades(source: string, limit: number = 50) {
    const trades = await this.prisma.trade.findMany({
      where: { source },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        price: true,
        size: true,
        timestamp: true,
        // 수수료는 public API에서 제외
        buyOrder: {
          select: {
            side: true,
          },
        },
      },
    });

    // 응답 포맷 정리
    return trades.map((trade) => ({
      id: trade.id,
      price: trade.price,
      size: trade.size,
      timestamp: trade.timestamp,
      side: trade.buyOrder.side, // 'buy' or 'sell'
    }));
  }

  /**
   * 내 거래 내역 조회 (private API)
   *
   * @param userId - 사용자 ID
   * @param source - 마켓 소스 (선택)
   * @param limit - 조회 개수 (기본: 100)
   * @returns 내 Trade 레코드 배열
   */
  async getMyTrades(userId: string, source?: string, limit: number = 100) {
    const trades = await this.prisma.trade.findMany({
      where: {
        OR: [
          { buyOrder: { userId } },
          { sellOrder: { userId } },
        ],
        ...(source && { source }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        buyOrder: {
          select: {
            id: true,
            userId: true,
            side: true,
          },
        },
        sellOrder: {
          select: {
            id: true,
            userId: true,
            side: true,
          },
        },
      },
    });

    // 내가 매수자인지 매도자인지 구분
    return trades.map((trade) => {
      const isBuyer = trade.buyOrder.userId === userId;

      return {
        id: trade.id,
        orderId: isBuyer ? trade.buyOrderId : trade.sellOrderId,
        side: isBuyer ? 'buy' : 'sell',
        price: trade.price,
        size: trade.size,
        fee: isBuyer ? trade.buyerFee : trade.sellerFee,
        timestamp: trade.timestamp,
        source: trade.source,
      };
    });
  }

  /**
   * 특정 주문의 거래 내역 조회
   *
   * @param orderId - 주문 ID
   * @returns Trade 레코드 배열
   */
  async getTradesByOrder(orderId: string) {
    const trades = await this.prisma.trade.findMany({
      where: {
        OR: [{ buyOrderId: orderId }, { sellOrderId: orderId }],
      },
      orderBy: { timestamp: 'desc' },
    });

    return trades;
  }

  /**
   * 거래량 통계 조회
   *
   * @param source - 마켓 소스
   * @param hours - 시간 범위 (기본: 24시간)
   * @returns { volume: number, count: number }
   */
  async getVolumeStats(source: string, hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const trades = await this.prisma.trade.findMany({
      where: {
        source,
        timestamp: {
          gte: since,
        },
      },
      select: {
        size: true,
        price: true,
      },
    });

    const volume = trades.reduce((sum, trade) => sum + trade.size * trade.price, 0);
    const count = trades.length;

    return { volume, count, hours };
  }
}
