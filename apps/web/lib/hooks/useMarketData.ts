import { useEffect, useState } from "react";

import { apiBaseUrl } from "@/lib/config";

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
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadMarket = async () => {
      try {
        const [tickerResponse, orderbookResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/market/ticker`),
          fetch(`${apiBaseUrl}/market/orderbook`),
        ]);

        if (!tickerResponse.ok) {
          throw new Error(
            `Ticker request failed with status ${tickerResponse.status}`,
          );
        }

        if (!orderbookResponse.ok) {
          throw new Error(
            `Orderbook request failed with status ${orderbookResponse.status}`,
          );
        }

        const tickerData = (await tickerResponse.json()) as Ticker;
        const orderbookData = (await orderbookResponse.json()) as Orderbook;

        if (isActive) {
          setTicker(tickerData);
          setOrderbook(orderbookData);
          setError(null);
        }
      } catch (caught) {
        if (isActive) {
          const message =
            caught instanceof Error ? caught.message : "Unable to load market";
          setError(message);
          setTicker(null);
          setOrderbook(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadMarket();

    return () => {
      isActive = false;
    };
  }, []);

  return { ticker, orderbook, isLoading, error };
};
