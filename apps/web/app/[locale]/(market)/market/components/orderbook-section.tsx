"use client";

import type { MarketSource, Orderbook } from "@/lib/api/market.types";
import { formatPrice, formatSize } from "@/lib/format/market";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useMarketOrderStore } from "@/lib/store";

type OrderbookSectionProps = {
  orderbook: Orderbook | null;
  isLoading: boolean;
  error: string | null;
  source: MarketSource;
};

export const OrderbookSection = ({
  orderbook,
  isLoading,
  error,
  source,
}: OrderbookSectionProps) => {
  const setSelectedOrderPrice = useMarketOrderStore(
    (s) => s.setSelectedOrderPrice,
  );
  const bids = orderbook?.bids ?? [];
  const asks = orderbook?.asks ?? [];
  const bidTotals = bids.reduce<number[]>((acc, bid) => {
    const previous = acc[acc.length - 1] ?? 0;
    return [...acc, previous + Number(bid.size)];
  }, []);
  const askTotals = asks.reduce<number[]>((acc, ask) => {
    const previous = acc[acc.length - 1] ?? 0;
    return [...acc, previous + Number(ask.size)];
  }, []);
  const maxDepth = Math.max(
    bidTotals[bidTotals.length - 1] ?? 0,
    askTotals[askTotals.length - 1] ?? 0,
    1,
  );
  const bestBid = bids[0]?.price ? Number(bids[0].price) : null;
  const bestAsk = asks[0]?.price ? Number(asks[0].price) : null;
  const spread =
    bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard className="rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--color-text-main)]">
              Bids
            </h2>
            <span className="text-xs text-[var(--color-text-sub)]">
              {isLoading ? "Loading" : "Depth"}
            </span>
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-[var(--color-text-sub)]">
              Loading bids...
            </p>
          ) : error ? (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          ) : bids.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {bids.map((bid, index) => {
                const depth = bidTotals[index] ?? 0;
                const width = `${Math.min((depth / maxDepth) * 100, 100)}%`;
                const isTop = index === 0;
                return (
                  <li
                    key={`bid-${bid.price}-${bid.size}`}
                    className={`relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl px-3 py-2 transition-opacity hover:opacity-80 ${
                      isTop ? "ring-1 ring-[var(--color-buy-border)]" : ""
                    }`}
                    onClick={() =>
                      setSelectedOrderPrice(Number(bid.price))
                    }
                  >
                    <span
                      className={`absolute inset-y-0 right-0 ${
                        isTop
                          ? "bg-[var(--color-buy-border)]"
                          : "bg-[var(--color-buy-bg)]"
                      }`}
                      style={{ width }}
                    />
                    <span className="relative font-semibold text-[var(--color-buy)]">
                      {formatPrice(bid.price, source)}
                    </span>
                    <span className="relative text-[var(--color-text-sub)]">
                      {formatSize(bid.size)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-text-sub)]">
              No bid data available.
            </p>
          )}
        </SurfaceCard>

        <SurfaceCard className="rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--color-text-main)]">
              Asks
            </h2>
            <span className="text-xs text-[var(--color-text-sub)]">
              {isLoading ? "Loading" : "Depth"}
            </span>
          </div>
          {isLoading ? (
            <p className="mt-4 text-sm text-[var(--color-text-sub)]">
              Loading asks...
            </p>
          ) : error ? (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          ) : asks.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {asks.map((ask, index) => {
                const depth = askTotals[index] ?? 0;
                const width = `${Math.min((depth / maxDepth) * 100, 100)}%`;
                const isTop = index === 0;
                return (
                  <li
                    key={`ask-${ask.price}-${ask.size}`}
                    className={`relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl px-3 py-2 transition-opacity hover:opacity-80 ${
                      isTop ? "ring-1 ring-[var(--color-sell-border)]" : ""
                    }`}
                    onClick={() =>
                      setSelectedOrderPrice(Number(ask.price))
                    }
                  >
                    <span
                      className={`absolute inset-y-0 left-0 ${
                        isTop
                          ? "bg-[var(--color-sell-border)]"
                          : "bg-[var(--color-sell-bg)]"
                      }`}
                      style={{ width }}
                    />
                    <span className="relative font-semibold text-[var(--color-sell)]">
                      {formatPrice(ask.price, source)}
                    </span>
                    <span className="relative text-[var(--color-text-sub)]">
                      {formatSize(ask.size)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--color-text-sub)]">
              No ask data available.
            </p>
          )}
        </SurfaceCard>
      </div>

      <SurfaceCard className="rounded-2xl px-4 py-3">
        <div className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[var(--color-text-sub)]">Spread</span>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[var(--color-text-sub)]">Bid</span>
            <span className="text-[var(--color-buy)]">
              {bestBid !== null ? formatPrice(bestBid, source) : "--"}
            </span>
            <span className="text-[var(--color-text-sub)]">Ask</span>
            <span className="text-[var(--color-sell)]">
              {bestAsk !== null ? formatPrice(bestAsk, source) : "--"}
            </span>
            <span className="text-[var(--color-text-sub)]">Spread</span>
            <span className="text-amber-400">
              {spread !== null ? formatPrice(spread, source) : "--"}
            </span>
          </div>
        </div>
      </SurfaceCard>
    </section>
  );
};
