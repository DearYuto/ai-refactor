"use client";

import { useEffect, useState } from "react";

import { apiBaseUrl } from "../../lib/config";

type Ticker = {
  symbol: string;
  price: string | number;
  change24h: string | number;
  volume24h: string | number;
};

type OrderbookEntry = {
  price: string | number;
  size: string | number;
};

type Orderbook = {
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
};

const formatValue = (value: string | number) => {
  if (typeof value === "number") {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 8,
    });
  }

  return value;
};

export default function MarketPage() {
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

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Market
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h1 className="text-3xl font-semibold tracking-tight">
              {ticker?.symbol ?? "Market Overview"}
            </h1>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {isLoading ? "Loading" : "Live"}
            </span>
          </div>
        </header>

        <section className="grid gap-6 rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Ticker</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {isLoading ? "Fetching" : "Updated"}
            </span>
          </div>
          {isLoading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading ticker...
            </p>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : ticker ? (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Price
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {formatValue(ticker.price)}
                </p>
              </div>
              <div className="rounded-xl border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  24h Change
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {formatValue(ticker.change24h)}
                </p>
              </div>
              <div className="rounded-xl border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  24h Volume
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {formatValue(ticker.volume24h)}
                </p>
              </div>
              <div className="rounded-xl border border-black/[.08] px-4 py-3 dark:border-white/[.145]">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Symbol
                </p>
                <p className="mt-2 text-lg font-semibold">{ticker.symbol}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No ticker data available.
            </p>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Bids</h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {isLoading ? "Loading" : "Depth"}
              </span>
            </div>
            {isLoading ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading bids...
              </p>
            ) : error ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : orderbook?.bids?.length ? (
              <ul className="mt-4 space-y-3 text-sm">
                {orderbook.bids.map((bid, index) => (
                  <li key={`bid-${index}`} className="flex justify-between">
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {formatValue(bid.price)}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {formatValue(bid.size)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                No bid data available.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-black/[.08] bg-white p-6 shadow-sm dark:border-white/[.145] dark:bg-black">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Asks</h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {isLoading ? "Loading" : "Depth"}
              </span>
            </div>
            {isLoading ? (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading asks...
              </p>
            ) : error ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : orderbook?.asks?.length ? (
              <ul className="mt-4 space-y-3 text-sm">
                {orderbook.asks.map((ask, index) => (
                  <li key={`ask-${index}`} className="flex justify-between">
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {formatValue(ask.price)}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {formatValue(ask.size)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                No ask data available.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
