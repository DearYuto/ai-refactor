import { useQuery } from "@tanstack/react-query";
import { fetchRecentTrades, tradesQueryKeys } from "@/lib/api/trades.api";
import type { MarketSource } from "@/lib/api/market.types";

export const useTrades = (source: MarketSource, limit = 20) => {
  const { data, isLoading, error } = useQuery({
    queryKey: tradesQueryKeys.recent(source),
    queryFn: () => fetchRecentTrades(source, limit),
    refetchInterval: 5000,
  });

  return {
    trades: data ?? [],
    isLoading,
    error: error ? String(error) : null,
  };
};
