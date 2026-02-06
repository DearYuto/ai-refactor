import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
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
  type Ticker,
} from "@/lib/api/market.types";

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

export const fetchKlines = async (
  source: MarketSource,
  interval: MarketInterval,
  signal?: AbortSignal,
): Promise<CandlestickData[]> => {
  if (source === MARKET_SOURCE.BINANCE) {
    const route = buildKlinesRoute({
      symbol: "BTCUSDT",
      interval,
      limit: 200,
    });
    const payload = await fetchJson<BinanceKlineResponse[]>(route, signal);

    return payload.map((item) => ({
      time: Math.floor(item[0] / 1000) as UTCTimestamp,
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
    }));
  }

  const payload = await fetchJson<UpbitCandle[]>(
    buildUpbitCandlesRoute({
      market: "KRW-BTC",
      count: 200,
      interval,
    }),
    signal,
  );

  return payload
    .map((item) => ({
      time: Math.floor(item.timestamp / 1000) as UTCTimestamp,
      open: item.opening_price,
      high: item.high_price,
      low: item.low_price,
      close: item.trade_price,
    }))
    .reverse();
};
