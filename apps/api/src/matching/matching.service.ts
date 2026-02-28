import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FeeService } from '../fee/fee.service';
import { WalletService } from '../wallet/wallet.service';
import { LoggerService } from '../common/logger/logger.service';

/**
 * 주문 매칭 엔진 서비스
 *
 * 역할:
 * - 대기 중인 buy/sell 주문 자동 매칭
 * - 가격이 겹치는 주문 찾아서 체결
 * - Trade 레코드 생성
 * - 수수료 차감 및 잔고 업데이트
 */
@Injectable()
export class MatchingEngineService {
  private readonly logger = new Logger(MatchingEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feeService: FeeService,
    private readonly walletService: WalletService,
    private readonly customLogger: LoggerService,
  ) {}

  /**
   * 주문 매칭 엔진 (메인 로직)
   *
   * @param marketSource - 마켓 소스 (예: 'BTC-USDT')
   */
  async matchOrders(marketSource: string): Promise<void> {
    this.logger.debug(`매칭 엔진 시작: ${marketSource}`);

    // 1. 대기 중인 buy 주문 조회 (가격 높은 순)
    const buyOrders = await this.prisma.order.findMany({
      where: {
        source: marketSource,
        side: 'buy',
        status: 'pending',
        type: 'limit',
      },
      orderBy: {
        price: 'desc', // 높은 가격부터
      },
    });

    // 2. 대기 중인 sell 주문 조회 (가격 낮은 순)
    const sellOrders = await this.prisma.order.findMany({
      where: {
        source: marketSource,
        side: 'sell',
        status: 'pending',
        type: 'limit',
      },
      orderBy: {
        price: 'asc', // 낮은 가격부터
      },
    });

    if (buyOrders.length === 0 || sellOrders.length === 0) {
      this.logger.debug(`매칭 가능한 주문 없음`);
      return;
    }

    // 3. 매칭 로직 실행
    let matchCount = 0;

    for (const buyOrder of buyOrders) {
      for (const sellOrder of sellOrders) {
        // 가격이 겹치는지 확인
        // buy 가격 >= sell 가격이면 매칭 가능
        if (
          buyOrder.price !== null &&
          sellOrder.price !== null &&
          buyOrder.price >= sellOrder.price
        ) {
          await this.executeTrade(buyOrder, sellOrder);
          matchCount++;
          break; // 이번 buy 주문은 처리 완료
        }
      }
    }

    this.logger.log(`매칭 완료: ${matchCount}건`);
  }

  /**
   * 거래 체결 실행
   *
   * @param buyOrder - 매수 주문
   * @param sellOrder - 매도 주문
   */
  private async executeTrade(buyOrder: any, sellOrder: any): Promise<void> {
    // 체결 가격 결정 (먼저 들어온 주문의 가격 사용)
    // 일반적으로 sell 주문 가격 사용 (더 먼저 등록된 경우가 많음)
    const executionPrice = sellOrder.price;

    // 체결 수량 결정 (두 주문 중 작은 수량)
    const executionSize = Math.min(buyOrder.size, sellOrder.size);

    this.logger.debug(
      `거래 체결 시도: BUY ${buyOrder.id} (${buyOrder.size}) <-> SELL ${sellOrder.id} (${sellOrder.size}) @ ${executionPrice}`,
    );

    try {
      // 트랜잭션으로 원자성 보장
      await this.prisma.$transaction(async (tx) => {
        // 1. 수수료 계산
        const buyerFee = await this.feeService.calculateFee(
          'limit',
          executionSize,
          executionPrice,
          buyOrder.baseAsset,
        );

        const sellerFee = await this.feeService.calculateFee(
          'limit',
          executionSize,
          executionPrice,
          sellOrder.baseAsset,
        );

        // 2. Trade 레코드 생성
        const trade = await tx.trade.create({
          data: {
            buyOrderId: buyOrder.id,
            sellOrderId: sellOrder.id,
            price: executionPrice,
            size: executionSize,
            buyerFee,
            sellerFee,
            source: buyOrder.source,
          },
        });

        // 3. 매수자 잔고 업데이트
        // - quoteAsset(USDT) 차감 (이미 locked에 있음)
        // - baseAsset(BTC) 증가 (수수료 차감)
        await this.walletService.unlockBalance(
          buyOrder.userId,
          buyOrder.quoteAsset,
          executionSize * executionPrice,
        );

        await this.walletService.addBalance(
          buyOrder.userId,
          buyOrder.baseAsset,
          executionSize - buyerFee, // 수수료 차감
        );

        // 4. 매도자 잔고 업데이트
        // - baseAsset(BTC) 차감 (이미 locked에 있음)
        // - quoteAsset(USDT) 증가 (수수료 차감)
        await this.walletService.unlockBalance(
          sellOrder.userId,
          sellOrder.baseAsset,
          executionSize,
        );

        await this.walletService.addBalance(
          sellOrder.userId,
          sellOrder.quoteAsset,
          executionSize * executionPrice - sellerFee, // 수수료 차감
        );

        // 5. 주문 상태 업데이트
        // 완전 체결: 'filled'
        // 부분 체결: 'partially_filled' (TODO: 향후 구현)
        await tx.order.update({
          where: { id: buyOrder.id },
          data: {
            status: 'filled',
            filledPrice: executionPrice,
          },
        });

        await tx.order.update({
          where: { id: sellOrder.id },
          data: {
            status: 'filled',
            filledPrice: executionPrice,
          },
        });

        this.logger.log(
          `✅ 거래 체결 완료: Trade ${trade.id} - ${executionSize} @ ${executionPrice} (수수료: B=${buyerFee}, S=${sellerFee})`,
        );

        // Winston 로거를 통한 구조화된 로깅
        this.customLogger.logTrade(
          buyOrder.id,
          sellOrder.id,
          executionPrice,
          executionSize,
        );
      });
    } catch (error) {
      this.logger.error(`거래 체결 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 모든 마켓에 대해 매칭 실행
   */
  async matchAllMarkets(): Promise<void> {
    // 현재 활성화된 마켓 목록 (하드코딩 → 향후 DB에서 관리)
    const markets = ['BTC-USDT', 'ETH-USDT'];

    for (const market of markets) {
      try {
        await this.matchOrders(market);
      } catch (error) {
        this.logger.error(`${market} 매칭 실패: ${error.message}`);
      }
    }
  }
}
