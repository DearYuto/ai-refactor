export type OrderSide = "buy" | "sell";

export type OrderType = "market" | "limit";

export type OrderStatus = "open" | "filled" | "cancelled";

export interface Order {
  id: string;
  side: OrderSide;
  type: OrderType;
  size: number;
  price: number | null;
  filledPrice: number | null;
  notional: number | null;
  source: string;
  baseAsset: string;
  quoteAsset: string;
  status: OrderStatus;
  createdAt: string;
}
