import { customFetch } from "@/lib/api/fetcher";
import type { MarketSource } from "@/lib/api/market.types";

export const tradesQueryKeys = {
  all: () => ["trades"] as const,
  recent: (source: MarketSource) => ["trades", "recent", source] as const,
  myTrades: (source?: MarketSource) =>
    source ? ["trades", "my", source] : ["trades", "my"],
};

export type TradeRecord = {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  size: number;
  buyerFee: number;
  sellerFee: number;
  source: MarketSource;
  baseAsset: string;
  quoteAsset: string;
  timestamp: string;
};

export type MyTradeRecord = TradeRecord & {
  side: "buy" | "sell";
  fee: number;
};

type FetchResponse<TData> = {
  data: TData;
  status: number;
  headers: Headers;
};

export const fetchRecentTrades = async (
  source: MarketSource,
  limit = 20,
): Promise<TradeRecord[]> => {
  const response = await customFetch<FetchResponse<TradeRecord[]>>(
    `/trades?source=${source}&limit=${limit}`,
    { method: "GET" },
  );
  return response.data;
};

export const fetchMyTrades = async (
  source?: MarketSource,
): Promise<MyTradeRecord[]> => {
  const url = source ? `/trades/my?source=${source}` : "/trades/my";
  const response = await customFetch<FetchResponse<MyTradeRecord[]>>(url, {
    method: "GET",
  });
  return response.data;
};
