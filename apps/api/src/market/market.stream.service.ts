import { Injectable } from '@nestjs/common';

type MarketSource = 'BINANCE' | 'UPBIT';

type MarketTicker = {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
};

type MarketOrderbook = {
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
};

type MarketSnapshot = {
  ticker: MarketTicker;
  orderbook: MarketOrderbook;
};

type BinanceTickerResponse = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
};

type BinanceOrderbookResponse = {
  bids: [string, string][];
  asks: [string, string][];
};

type UpbitTickerResponse = {
  market: string;
  trade_price: number;
  signed_change_rate: number;
  acc_trade_volume_24h: number;
};

type UpbitOrderbookUnit = {
  ask_price: number;
  bid_price: number;
  ask_size: number;
  bid_size: number;
};

type UpbitOrderbookResponse = {
  orderbook_units: UpbitOrderbookUnit[];
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Unable to load market');
  }

  return (await response.json()) as T;
};

@Injectable()
export class MarketStreamService {
  async getSnapshot(source: MarketSource): Promise<MarketSnapshot> {
    if (source === 'UPBIT') {
      const [ticker, orderbook] = await Promise.all([
        this.fetchUpbitTicker(),
        this.fetchUpbitOrderbook(),
      ]);

      return { ticker, orderbook };
    }

    const [ticker, orderbook] = await Promise.all([
      this.fetchBinanceTicker(),
      this.fetchBinanceOrderbook(),
    ]);

    return { ticker, orderbook };
  }

  private async fetchBinanceTicker(): Promise<MarketTicker> {
    const data = await fetchJson<BinanceTickerResponse>(
      'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
    );

    return {
      symbol: 'BTC/USDT',
      price: Number(data.lastPrice),
      change24h: Number(data.priceChangePercent),
      volume24h: Number(data.volume),
    };
  }

  private async fetchBinanceOrderbook(): Promise<MarketOrderbook> {
    const data = await fetchJson<BinanceOrderbookResponse>(
      'https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20',
    );

    return {
      bids: data.bids.map(([price, size]) => ({
        price: Number(price),
        size: Number(size),
      })),
      asks: data.asks.map(([price, size]) => ({
        price: Number(price),
        size: Number(size),
      })),
    };
  }

  private async fetchUpbitTicker(): Promise<MarketTicker> {
    const payload = await fetchJson<UpbitTickerResponse[]>(
      'https://api.upbit.com/v1/ticker?markets=KRW-BTC',
    );
    const data = payload[0];

    return {
      symbol: 'BTC/KRW',
      price: data.trade_price,
      change24h: data.signed_change_rate * 100,
      volume24h: data.acc_trade_volume_24h,
    };
  }

  private async fetchUpbitOrderbook(): Promise<MarketOrderbook> {
    const payload = await fetchJson<UpbitOrderbookResponse[]>(
      'https://api.upbit.com/v1/orderbook?markets=KRW-BTC',
    );
    const data = payload[0];

    return {
      bids: data.orderbook_units.map((unit) => ({
        price: unit.bid_price,
        size: unit.bid_size,
      })),
      asks: data.orderbook_units.map((unit) => ({
        price: unit.ask_price,
        size: unit.ask_size,
      })),
    };
  }
}
