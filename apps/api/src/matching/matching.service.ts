import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FeeService } from '../fee/fee.service';
import { WalletService } from '../wallet/wallet.service';
import { LoggerService } from '../common/logger/logger.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

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
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * 주문 매칭 엔진 (메인 로직)
   *
   * Race Condition 방지:
   * - 각 매칭마다 개별 트랜잭션 사용
   * - 낙관적 락(Optimistic Lock)으로 이미 처리된 주문 자동 건너뛰기
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
    const processedOrderIds = new Set<string>(); // 이미 처리된 주문 추적

    for (const buyOrder of buyOrders) {
      // 이미 처리된 주문은 건너뛰기
      if (processedOrderIds.has(buyOrder.id)) continue;

      for (const sellOrder of sellOrders) {
        // 이미 처리된 주문은 건너뛰기
        if (processedOrderIds.has(sellOrder.id)) continue;

        // 가격이 겹치는지 확인
        // buy 가격 >= sell 가격이면 매칭 가능
        if (
          buyOrder.price !== null &&
          sellOrder.price !== null &&
          buyOrder.price >= sellOrder.price
        ) {
          // 낙관적 락(Optimistic Lock)으로 안전하게 체결 시도
          const success = await this.executeTradeWithOptimisticLock(buyOrder, sellOrder);

          if (success) {
            matchCount++;
            processedOrderIds.add(buyOrder.id);
            processedOrderIds.add(sellOrder.id);
            break; // 이번 buy 주문은 처리 완료
          }
          // 실패 시 (다른 트랜잭션이 먼저 처리) 다음 주문 시도
        }
      }
    }

    this.logger.log(`매칭 완료: ${matchCount}건`);
  }

  /**
   * 낙관적 락을 사용한 안전한 거래 체결
   *
   * @param buyOrder - 매수 주문
   * @param sellOrder - 매도 주문
   * @returns true: 성공, false: 이미 다른 트랜잭션이 처리함
   */
  private async executeTradeWithOptimisticLock(
    buyOrder: any,
    sellOrder: any,
  ): Promise<boolean> {
    const executionPrice = sellOrder.price;
    const executionSize = Math.min(buyOrder.size, sellOrder.size);

    this.logger.debug(
      `거래 체결 시도: BUY ${buyOrder.id} (${buyOrder.size}) <-> SELL ${sellOrder.id} (${sellOrder.size}) @ ${executionPrice}`,
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        // 낙관적 락: 주문이 아직 pending 상태인지 확인
        const [currentBuyOrder, currentSellOrder] = await Promise.all([
          tx.order.findUnique({ where: { id: buyOrder.id } }),
          tx.order.findUnique({ where: { id: sellOrder.id } }),
        ]);

        // 이미 다른 트랜잭션이 처리한 경우
        if (!currentBuyOrder || currentBuyOrder.status !== 'pending') {
          throw new Error(`BUY_ORDER_ALREADY_PROCESSED:${buyOrder.id}`);
        }
        if (!currentSellOrder || currentSellOrder.status !== 'pending') {
          throw new Error(`SELL_ORDER_ALREADY_PROCESSED:${sellOrder.id}`);
        }

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
        await this.walletService.unlockBalance(
          buyOrder.userId,
          buyOrder.quoteAsset,
          executionSize * executionPrice,
        );

        await this.walletService.addBalance(
          buyOrder.userId,
          buyOrder.baseAsset,
          executionSize - buyerFee,
        );

        // 4. 매도자 잔고 업데이트
        await this.walletService.unlockBalance(
          sellOrder.userId,
          sellOrder.baseAsset,
          executionSize,
        );

        await this.walletService.addBalance(
          sellOrder.userId,
          sellOrder.quoteAsset,
          executionSize * executionPrice - sellerFee,
        );

        // 5. 주문 상태 업데이트 (낙관적 락 적용)
        const updatedBuy = await tx.order.updateMany({
          where: {
            id: buyOrder.id,
            status: 'pending', // 아직 pending일 때만 업데이트
          },
          data: {
            status: 'filled',
            filledPrice: executionPrice,
          },
        });

        const updatedSell = await tx.order.updateMany({
          where: {
            id: sellOrder.id,
            status: 'pending', // 아직 pending일 때만 업데이트
          },
          data: {
            status: 'filled',
            filledPrice: executionPrice,
          },
        });

        // updateMany는 count를 반환하므로 0이면 이미 처리된 것
        if (updatedBuy.count === 0 || updatedSell.count === 0) {
          throw new Error('ORDER_ALREADY_UPDATED');
        }

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

        // 매수자에게 알림
        const buyNotification = await this.notificationsService.notifyOrderFilled(
          buyOrder.userId,
          buyOrder.id,
          'buy',
          executionSize,
          executionPrice,
          buyOrder.baseAsset,
        );
        this.notificationsGateway.sendToUser(buyOrder.userId, buyNotification);

        // 매도자에게 알림
        const sellNotification = await this.notificationsService.notifyOrderFilled(
          sellOrder.userId,
          sellOrder.id,
          'sell',
          executionSize,
          executionPrice,
          sellOrder.baseAsset,
        );
        this.notificationsGateway.sendToUser(sellOrder.userId, sellNotification);
      });

      return true; // 성공
    } catch (error) {
      // 낙관적 락 실패 (이미 처리됨)
      if (
        error.message.includes('ALREADY_PROCESSED') ||
        error.message.includes('ALREADY_UPDATED')
      ) {
        this.logger.debug(
          `주문이 이미 처리됨 (동시성 제어): ${error.message}`,
        );
        return false; // 실패이지만 정상 (다른 트랜잭션이 처리함)
      }

      // 실제 에러
      this.logger.error(`거래 체결 실패: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 거래 체결 실행 (레거시 - 하위 호환성)
   *
   * @param buyOrder - 매수 주문
   * @param sellOrder - 매도 주문
   * @deprecated executeTradeWithOptimisticLock 사용 권장
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

        // 매수자에게 알림
        const buyNotification = await this.notificationsService.notifyOrderFilled(
          buyOrder.userId,
          buyOrder.id,
          'buy',
          executionSize,
          executionPrice,
          buyOrder.baseAsset,
        );
        this.notificationsGateway.sendToUser(buyOrder.userId, buyNotification);

        // 매도자에게 알림
        const sellNotification = await this.notificationsService.notifyOrderFilled(
          sellOrder.userId,
          sellOrder.id,
          'sell',
          executionSize,
          executionPrice,
          sellOrder.baseAsset,
        );
        this.notificationsGateway.sendToUser(sellOrder.userId, sellNotification);
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
