import type { CandlestickData, UTCTimestamp } from "lightweight-charts";

export type Ticker = {
  symbol: string;
  price: string | number;
  change24h: string | number;
  volume24h: string | number;
};

export type OrderbookEntry = {
  price: string | number;
  size: string | number;
};

export type Orderbook = {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
};

export type MarketSource = "BINANCE" | "UPBIT";

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

export const marketQueryKeys = {
  ticker: (source: MarketSource) => ["market", "ticker", source] as const,
  orderbook: (source: MarketSource) => ["market", "orderbook", source] as const,
  klines: (source: MarketSource) => ["market", "klines", source] as const,
};

export const marketRefresh = {
  tickerMs: 3000,
  orderbookMs: 2000,
  klinesMs: 5000,
  staleTimeMs: 1000,
};

export const fetchTicker = (source: MarketSource, signal?: AbortSignal) => {
  const route =
    source === "BINANCE"
      ? "/api/market/binance/ticker"
      : "/api/market/upbit/ticker";
  return fetchJson<Ticker>(route, signal);
};

export const fetchOrderbook = (source: MarketSource, signal?: AbortSignal) => {
  const route =
    source === "BINANCE"
      ? "/api/market/binance/orderbook"
      : "/api/market/upbit/orderbook";
  return fetchJson<Orderbook>(route, signal);
};

export const fetchKlines = async (
  source: MarketSource,
  signal?: AbortSignal,
): Promise<CandlestickData[]> => {
  if (source === "BINANCE") {
    const payload = await fetchJson<BinanceKlineResponse[]>(
      "/api/market/klines?symbol=BTCUSDT&interval=1m&limit=200",
      signal,
    );

    return payload.map((item) => ({
      time: Math.floor(item[0] / 1000) as UTCTimestamp,
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
    }));
  }

  const payload = await fetchJson<UpbitCandle[]>(
    "/api/market/upbit?market=KRW-BTC&count=200",
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
