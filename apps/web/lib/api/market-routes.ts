import type { MarketInterval, MarketSource } from "@/lib/api/market.types";

const MARKET_API_BASE = "/api/market";

type KlinesRouteParams = {
  symbol?: string;
  interval: MarketInterval;
  limit?: number;
};

type UpbitCandlesRouteParams = {
  market?: string;
  count?: number;
  interval: MarketInterval;
};

export const buildTickerRoute = (source: MarketSource) =>
  source === "BINANCE"
    ? `${MARKET_API_BASE}/binance/ticker`
    : `${MARKET_API_BASE}/upbit/ticker`;

export const buildOrderbookRoute = (source: MarketSource) =>
  source === "BINANCE"
    ? `${MARKET_API_BASE}/binance/orderbook`
    : `${MARKET_API_BASE}/upbit/orderbook`;

export const buildKlinesRoute = ({
  symbol = "BTCUSDT",
  interval,
  limit = 200,
}: KlinesRouteParams) => {
  const params = new URLSearchParams({
    symbol,
    interval,
    limit: String(limit),
  });

  return `${MARKET_API_BASE}/klines?${params.toString()}`;
};

export const buildUpbitCandlesRoute = ({
  market = "KRW-BTC",
  count = 200,
  interval,
}: UpbitCandlesRouteParams) => {
  const params = new URLSearchParams({
    market,
    count: String(count),
    interval,
  });

  return `${MARKET_API_BASE}/upbit?${params.toString()}`;
};
