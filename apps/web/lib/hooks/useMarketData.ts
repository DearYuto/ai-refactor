import {
  useMarketControllerGetOrderbook,
  useMarketControllerGetTicker,
} from "@/lib/api/generated";

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

type MarketDataState = {
  ticker: Ticker | null;
  orderbook: Orderbook | null;
  isLoading: boolean;
  error: string | null;
};

export const useMarketData = (): MarketDataState => {
  const tickerQuery = useMarketControllerGetTicker();
  const orderbookQuery = useMarketControllerGetOrderbook();
  const isLoading = tickerQuery.isLoading || orderbookQuery.isLoading;
  const ticker = (tickerQuery.data?.data as Ticker | undefined) ?? null;
  const orderbook =
    (orderbookQuery.data?.data as Orderbook | undefined) ?? null;
  const queryError = tickerQuery.error ?? orderbookQuery.error;
  const message = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Unable to load market"
    : null;

  return { ticker, orderbook, isLoading, error: message };
};
