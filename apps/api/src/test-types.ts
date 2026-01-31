import { Order } from "@repo/types";

export const testOrder: Order = {
  id: "2",
  side: "SELL",
  symbol: "ETH/USDT",
  amount: 1,
  price: 3000,
  status: "COMPLETED",
  timestamp: Date.now(),
};
