import { customFetch } from "@/lib/api/fetcher";
import type { MarketSource } from "@/lib/api/market.types";

export const ordersQueryKeys = {
  all: () => ["orders"] as const,
};

export type OrderSide = "buy" | "sell";

export type OrderRecord = {
  id: string;
  side: OrderSide;
  size: number;
  price: number;
  notional: number;
  source: MarketSource;
  baseAsset: string;
  quoteAsset: string;
  status: "filled";
  createdAt: string;
};

export type CreateOrderPayload = {
  side: OrderSide;
  size: number;
  source: MarketSource;
};

type OrdersResponse = {
  orders: OrderRecord[];
};

type OrderResponse = {
  order: OrderRecord;
};

type FetchResponse<TData> = {
  data: TData;
  status: number;
  headers: Headers;
};

export const fetchOrders = async (): Promise<OrdersResponse> => {
  const response = await customFetch<FetchResponse<OrdersResponse>>(
    "/orders",
    { method: "GET" },
  );
  return response.data;
};

export const createOrder = async (
  payload: CreateOrderPayload,
): Promise<OrderResponse> => {
  const response = await customFetch<FetchResponse<OrderResponse>>("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return response.data;
};
