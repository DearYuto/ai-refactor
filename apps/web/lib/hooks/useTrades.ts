import { useQuery } from "@tanstack/react-query";
import {
  fetchRecentTrades,
  tradesQueryKeys,
  type TradeRecord,
} from "@/lib/api/trades.api";
import type { MarketSource, Trade } from "@/lib/api/market.types";

const convertTradeRecordToTrade = (record: TradeRecord): Trade => ({
  id: record.id,
  price: record.price,
  size: record.size,
  side: "buy",
  timestamp: new Date(record.timestamp).getTime(),
});

export const useTrades = (source: MarketSource, limit = 20) => {
  const { data, isLoading, error } = useQuery({
    queryKey: tradesQueryKeys.recent(source),
    queryFn: () => fetchRecentTrades(source, limit),
    refetchInterval: 5000,
  });

  return {
    trades: data ? data.map(convertTradeRecordToTrade) : [],
    isLoading,
    error: error ? String(error) : null,
  };
};
