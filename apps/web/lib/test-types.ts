import { Order } from "@repo/types";

export const testOrder: Order = {
  id: "1",
  side: "buy",
  type: "market",
  size: 0.1,
  price: 50000,
  filledPrice: 50000,
  notional: 5000,
  source: "BINANCE",
  baseAsset: "BTC",
  quoteAsset: "USDT",
  status: "filled",
  createdAt: new Date().toISOString(),
};
