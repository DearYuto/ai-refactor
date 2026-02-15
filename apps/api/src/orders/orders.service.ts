import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DEFAULT_BASE_ASSET,
  QUOTE_ASSET_BY_SOURCE,
} from '../common/constants/assets';
import { MarketStreamService } from '../market/market.stream.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateOrderDto } from './dto/create-order.dto';

type OrderSide = 'buy' | 'sell';
type MarketSource = 'BINANCE' | 'UPBIT';

type OrderRecord = {
  id: string;
  side: OrderSide;
  size: number;
  price: number;
  notional: number;
  source: MarketSource;
  baseAsset: string;
  quoteAsset: string;
  status: 'filled';
  createdAt: string;
};

@Injectable()
export class OrdersService {
  private readonly ordersByUser = new Map<string, OrderRecord[]>();

  constructor(
    private readonly marketStreamService: MarketStreamService,
    private readonly walletService: WalletService,
  ) {}

  getOrders(email: string): OrderRecord[] {
    return this.ordersByUser.get(email) ?? [];
  }

  async createOrder(
    email: string,
    payload: CreateOrderDto,
  ): Promise<OrderRecord> {
    const { side, size, source } = payload;

    const snapshot = await this.marketStreamService.getSnapshot(source);
    const price = Number(snapshot.ticker.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestException('Invalid market price');
    }

    const baseAsset = DEFAULT_BASE_ASSET;
    const quoteAsset = QUOTE_ASSET_BY_SOURCE[source];
    const notional = price * size;

    if (side === 'buy') {
      this.walletService.swapBalances(
        email,
        { asset: quoteAsset, amount: notional },
        { asset: baseAsset, amount: size },
      );
    } else {
      this.walletService.swapBalances(
        email,
        { asset: baseAsset, amount: size },
        { asset: quoteAsset, amount: notional },
      );
    }

    const order: OrderRecord = {
      id: randomUUID(),
      side,
      size,
      price,
      notional,
      source,
      baseAsset,
      quoteAsset,
      status: 'filled',
      createdAt: new Date().toISOString(),
    };

    const orders = this.ordersByUser.get(email) ?? [];
    orders.unshift(order);
    this.ordersByUser.set(email, orders);
    return order;
  }
}
