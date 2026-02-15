import type {
  CandlestickData,
  HistogramData,
  UTCTimestamp,
} from "lightweight-charts";
import {
  buildKlinesRoute,
  buildOrderbookRoute,
  buildTickerRoute,
  buildUpbitCandlesRoute,
} from "@/lib/api/market-routes";
import {
  MARKET_SOURCE,
  type MarketInterval,
  type MarketSource,
  type Orderbook,
  type Trade,
  type Ticker,
} from "@/lib/api/market.types";
import {
  buildTradesRoute,
  buildUpbitTradesRoute,
} from "@/lib/api/market-routes";

type BinanceKlineResponse = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

type UpbitCandle = {
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  timestamp: number;
  candle_acc_trade_volume: number;
};

type BinanceTradeResponse = {
  id: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
};

type UpbitTradeResponse = {
  trade_price: number;
  trade_volume: number;
  trade_timestamp: number;
  ask_bid: "ASK" | "BID";
  sequential_id: number;
};

const fetchJson = async <T>(url: string, signal?: AbortSignal): Promise<T> => {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error("Unable to load market");
  }

  return (await response.json()) as T;
};

export const fetchTicker = (source: MarketSource, signal?: AbortSignal) => {
  return fetchJson<Ticker>(buildTickerRoute(source), signal);
};

export const fetchOrderbook = (source: MarketSource, signal?: AbortSignal) => {
  return fetchJson<Orderbook>(buildOrderbookRoute(source), signal);
};

export const fetchTrades = async (
  source: MarketSource,
  signal?: AbortSignal,
): Promise<Trade[]> => {
  if (source === MARKET_SOURCE.BINANCE) {
    const payload = await fetchJson<BinanceTradeResponse[]>(
      buildTradesRoute({ symbol: "BTCUSDT", limit: 50 }),
      signal,
    );

    return payload.map((trade) => ({
      id: String(trade.id),
      price: Number(trade.price),
      size: Number(trade.qty),
      side: trade.isBuyerMaker ? "sell" : "buy",
      timestamp: trade.time,
    }));
  }

  const payload = await fetchJson<UpbitTradeResponse[]>(
    buildUpbitTradesRoute({ market: "KRW-BTC", count: 50 }),
    signal,
  );

  return payload.map((trade) => ({
    id: String(trade.sequential_id),
    price: trade.trade_price,
    size: trade.trade_volume,
    side: trade.ask_bid === "ASK" ? "sell" : "buy",
    timestamp: trade.trade_timestamp,
  }));
};

export const marketIntervalSeconds = (interval: MarketInterval) => {
  switch (interval) {
    case "1m":
      return 60;
    case "5m":
      return 300;
    case "15m":
      return 900;
    case "1h":
      return 3600;
    default:
      return 60;
  }
};

export const marketIntervalUpbitMinutes = (interval: MarketInterval) => {
  switch (interval) {
    case "1m":
      return 1;
    case "5m":
      return 5;
    case "15m":
      return 15;
    case "1h":
      return 60;
    default:
      return 1;
  }
};

export type KlinesData = {
  candles: CandlestickData[];
  volumes: HistogramData[];
};

export const fetchKlines = async (
  source: MarketSource,
  interval: MarketInterval,
  signal?: AbortSignal,
): Promise<KlinesData> => {
  if (source === MARKET_SOURCE.BINANCE) {
    const route = buildKlinesRoute({
      symbol: "BTCUSDT",
      interval,
      limit: 200,
    });
    const payload = await fetchJson<BinanceKlineResponse[]>(route, signal);

    const candles = payload.map((item) => {
      const [openTime, open, high, low, close] = item;
      return {
        time: Math.floor(openTime / 1000) as UTCTimestamp,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
      };
    });

    const volumes = payload.map((item) => {
      const [openTime, open, , , close, volume] = item;
      return {
        time: Math.floor(openTime / 1000) as UTCTimestamp,
        value: Number(volume),
        color:
          Number(close) >= Number(open)
            ? "var(--color-buy)"
            : "var(--color-sell)",
      };
    });

    return { candles, volumes };
  }

  const payload = await fetchJson<UpbitCandle[]>(
    buildUpbitCandlesRoute({
      market: "KRW-BTC",
      count: 200,
      interval,
    }),
    signal,
  );

  const reversed = [...payload].reverse();
  const candles = reversed.map((item) => ({
    time: Math.floor(item.timestamp / 1000) as UTCTimestamp,
    open: item.opening_price,
    high: item.high_price,
    low: item.low_price,
    close: item.trade_price,
  }));

  const volumes = reversed.map((item) => ({
    time: Math.floor(item.timestamp / 1000) as UTCTimestamp,
    value: item.candle_acc_trade_volume,
    color:
      item.trade_price >= item.opening_price
        ? "var(--color-buy)"
        : "var(--color-sell)",
  }));

  return { candles, volumes };
};
