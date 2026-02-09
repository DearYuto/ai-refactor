import type { MarketInterval, MarketSource } from "@/lib/api/market.types";

export const marketQueryKeys = {
  ticker: (source: MarketSource) => ["market", "ticker", source] as const,
  orderbook: (source: MarketSource) => ["market", "orderbook", source] as const,
  klines: (source: MarketSource, interval: MarketInterval) =>
    ["market", "klines", source, interval] as const,
  trades: (source: MarketSource) => ["market", "trades", source] as const,
};

export const marketRefresh = {
  tickerMs: 3000,
  orderbookMs: 2000,
  klinesMs: 5000,
  tradesMs: 3000,
  staleTimeMs: 1000,
};

export const marketQueryDefaults = {
  staleTime: marketRefresh.staleTimeMs,
  refetchOnWindowFocus: true,
} as const;
