import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import {
  fetchOrderbook,
  fetchTicker,
  fetchTrades,
} from "@/lib/api/market.fetchers";
import {
  marketQueryDefaults,
  marketQueryKeys,
  marketRefresh,
} from "@/lib/api/market.query";
import type {
  MarketSource,
  Orderbook,
  Ticker,
  Trade,
} from "@/lib/api/market.types";

type MarketDataState = {
  ticker: Ticker | null;
  orderbook: Orderbook | null;
  trades: Trade[] | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
};

export const useMarketData = (
  source: MarketSource,
  enablePolling: boolean,
): MarketDataState => {
  const tickerQuery = useQuery({
    queryKey: marketQueryKeys.ticker(source),
    queryFn: ({ signal }: QueryFunctionContext) => fetchTicker(source, signal),
    refetchInterval: enablePolling ? marketRefresh.tickerMs : false,
    ...marketQueryDefaults,
  });
  const orderbookQuery = useQuery({
    queryKey: marketQueryKeys.orderbook(source),
    queryFn: ({ signal }: QueryFunctionContext) =>
      fetchOrderbook(source, signal),
    refetchInterval: enablePolling ? marketRefresh.orderbookMs : false,
    ...marketQueryDefaults,
  });
  const tradesQuery = useQuery({
    queryKey: marketQueryKeys.trades(source),
    queryFn: ({ signal }: QueryFunctionContext) => fetchTrades(source, signal),
    refetchInterval: marketRefresh.tradesMs,
    ...marketQueryDefaults,
  });
  const isLoading = tickerQuery.isLoading || orderbookQuery.isLoading;
  const ticker = tickerQuery.data ?? null;
  const orderbook = orderbookQuery.data ?? null;
  const trades = tradesQuery.data ?? null;
  const lastUpdated = tickerQuery.dataUpdatedAt
    ? tickerQuery.dataUpdatedAt
    : null;
  const queryError =
    tickerQuery.error ?? orderbookQuery.error ?? tradesQuery.error;
  const message = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Unable to load market"
    : null;

  return { ticker, orderbook, trades, isLoading, error: message, lastUpdated };
};
