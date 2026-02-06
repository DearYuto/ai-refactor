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

export const MARKET_SOURCE = {
  BINANCE: "BINANCE",
  UPBIT: "UPBIT",
} as const;

export type MarketSource = (typeof MARKET_SOURCE)[keyof typeof MARKET_SOURCE];

export const MARKET_INTERVALS = ["1m", "5m", "15m", "1h"] as const;

export type MarketInterval = (typeof MARKET_INTERVALS)[number];
