import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_BASE_ASSET,
  QUOTE_ASSET_BY_SOURCE,
} from '../common/constants/assets';
import { PrismaService } from '../database/prisma.service';
import { MarketStreamService } from '../market/market.stream.service';
import { WalletService } from '../wallet/wallet.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateOrderDto } from './dto/create-order.dto';

type OrderSide = 'buy' | 'sell';
type OrderType = 'market' | 'limit';
type OrderStatus = 'open' | 'filled' | 'cancelled';
type MarketSource = 'BINANCE' | 'UPBIT';

export type OrderRecord = {
  id: string;
  side: OrderSide;
  type: OrderType;
  size: number;
  price: number | null;
  filledPrice: number | null;
  notional: number | null;
  source: MarketSource;
  baseAsset: string;
  quoteAsset: string;
  status: OrderStatus;
  createdAt: string;
};

function toOrderRecord(row: {
  id: string;
  side: string;
  type: string;
  size: number;
  price: number | null;
  filledPrice: number | null;
  notional: number | null;
  source: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
  createdAt: Date;
}): OrderRecord {
  return {
    id: row.id,
    side: row.side as OrderSide,
    type: row.type as OrderType,
    size: row.size,
    price: row.price,
    filledPrice: row.filledPrice,
    notional: row.notional,
    source: row.source as MarketSource,
    baseAsset: row.baseAsset,
    quoteAsset: row.quoteAsset,
    status: row.status as OrderStatus,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly marketStreamService: MarketStreamService,
    private readonly walletService: WalletService,
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async getOrders(email: string): Promise<OrderRecord[]> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return [];

    const rows = await this.prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toOrderRecord);
  }

  async createOrder(
    email: string,
    payload: CreateOrderDto,
  ): Promise<OrderRecord> {
    const { side, type, size, source } = payload;

    const snapshot = await this.marketStreamService.getSnapshot(source);
    const currentPrice = Number(snapshot.ticker.price);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      throw new BadRequestException('Invalid market price');
    }

    const baseAsset = DEFAULT_BASE_ASSET;
    const quoteAsset = QUOTE_ASSET_BY_SOURCE[source];
    const userId = await this.walletService.getUserId(email);

    if (type === 'market') {
      return this.createMarketOrder(
        email,
        userId,
        side,
        size,
        source,
        baseAsset,
        quoteAsset,
        currentPrice,
      );
    }

    return this.createLimitOrder(
      email,
      userId,
      side,
      size,
      payload.price!,
      source,
      baseAsset,
      quoteAsset,
      currentPrice,
    );
  }

  async cancelOrder(email: string, orderId: string): Promise<OrderRecord> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'open') {
      throw new BadRequestException('Only open orders can be cancelled');
    }

    const lockedAmount =
      order.side === 'buy'
        ? order.price! * order.size
        : order.size;
    const lockedAsset =
      order.side === 'buy' ? order.quoteAsset : order.baseAsset;

    await this.walletService.unlockBalance(user.id, lockedAsset, lockedAmount);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });

    this.logger.logOrder('cancel', user.id, orderId, {
      side: order.side,
      type: order.type,
      size: order.size,
      price: order.price,
      source: order.source,
    });

    return toOrderRecord(updated);
  }

  private async createMarketOrder(
    email: string,
    userId: string,
    side: OrderSide,
    size: number,
    source: MarketSource,
    baseAsset: string,
    quoteAsset: string,
    price: number,
  ): Promise<OrderRecord> {
    const notional = price * size;

    if (side === 'buy') {
      await this.walletService.swapBalances(
        email,
        { asset: quoteAsset, amount: notional },
        { asset: baseAsset, amount: size },
      );
    } else {
      await this.walletService.swapBalances(
        email,
        { asset: baseAsset, amount: size },
        { asset: quoteAsset, amount: notional },
      );
    }

    const row = await this.prisma.order.create({
      data: {
        userId,
        side,
        type: 'market',
        size,
        filledPrice: price,
        notional,
        source,
        baseAsset,
        quoteAsset,
        status: 'filled',
      },
    });

    this.logger.logOrder('create', userId, row.id, {
      side,
      type: 'market',
      size,
      price,
      source,
      status: 'filled',
    });

    return toOrderRecord(row);
  }

  private async createLimitOrder(
    email: string,
    userId: string,
    side: OrderSide,
    size: number,
    limitPrice: number,
    source: MarketSource,
    baseAsset: string,
    quoteAsset: string,
    currentPrice: number,
  ): Promise<OrderRecord> {
    const lockedAsset = side === 'buy' ? quoteAsset : baseAsset;
    const lockedAmount = side === 'buy' ? limitPrice * size : size;

    await this.walletService.lockBalance(userId, lockedAsset, lockedAmount);

    const immediatelyFillable =
      side === 'buy'
        ? currentPrice <= limitPrice
        : currentPrice >= limitPrice;

    if (immediatelyFillable) {
      const filledPrice = currentPrice;
      const notional = filledPrice * size;

      const creditAsset = side === 'buy' ? baseAsset : quoteAsset;
      const creditAmount = side === 'buy' ? size : notional;

      await this.walletService.fillLimitOrder(
        userId,
        { asset: lockedAsset, lockedAmount },
        { asset: creditAsset, amount: creditAmount },
      );

      const row = await this.prisma.order.create({
        data: {
          userId,
          side,
          type: 'limit',
          size,
          price: limitPrice,
          filledPrice,
          notional,
          source,
          baseAsset,
          quoteAsset,
          status: 'filled',
        },
      });

      this.logger.logOrder('create', userId, row.id, {
        side,
        type: 'limit',
        size,
        limitPrice,
        filledPrice,
        source,
        status: 'filled',
      });

      return toOrderRecord(row);
    }

    const row = await this.prisma.order.create({
      data: {
        userId,
        side,
        type: 'limit',
        size,
        price: limitPrice,
        source,
        baseAsset,
        quoteAsset,
        status: 'open',
      },
    });

    this.logger.logOrder('create', userId, row.id, {
      side,
      type: 'limit',
      size,
      limitPrice,
      source,
      status: 'open',
    });

    return toOrderRecord(row);
  }
}
