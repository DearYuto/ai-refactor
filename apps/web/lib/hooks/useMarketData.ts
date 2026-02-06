import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import { fetchOrderbook, fetchTicker } from "@/lib/api/market.fetchers";
import { marketQueryDefaults, marketQueryKeys } from "@/lib/api/market.query";
import type { MarketSource, Orderbook, Ticker } from "@/lib/api/market.types";

type MarketDataState = {
  ticker: Ticker | null;
  orderbook: Orderbook | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
};

export const useMarketData = (source: MarketSource): MarketDataState => {
  const tickerQuery = useQuery({
    queryKey: marketQueryKeys.ticker(source),
    queryFn: ({ signal }: QueryFunctionContext) => fetchTicker(source, signal),
    refetchInterval: false,
    ...marketQueryDefaults,
  });
  const orderbookQuery = useQuery({
    queryKey: marketQueryKeys.orderbook(source),
    queryFn: ({ signal }: QueryFunctionContext) =>
      fetchOrderbook(source, signal),
    refetchInterval: false,
    ...marketQueryDefaults,
  });
  const isLoading = tickerQuery.isLoading || orderbookQuery.isLoading;
  const ticker = tickerQuery.data ?? null;
  const orderbook = orderbookQuery.data ?? null;
  const lastUpdated = tickerQuery.dataUpdatedAt
    ? tickerQuery.dataUpdatedAt
    : null;
  const queryError = tickerQuery.error ?? orderbookQuery.error;
  const message = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Unable to load market"
    : null;

  return { ticker, orderbook, isLoading, error: message, lastUpdated };
};
