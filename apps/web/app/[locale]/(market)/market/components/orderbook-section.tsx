import type { MarketSource, Orderbook } from "@/lib/api/market.types";
import { formatPrice, formatSize } from "@/lib/format/market";
import { SurfaceCard } from "@/components/surface-card";

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
}: OrderbookSectionProps) => (
  <section className="grid gap-6 lg:grid-cols-2">
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
      ) : orderbook?.bids?.length ? (
        <ul className="mt-4 space-y-3 text-sm">
          {orderbook.bids.map((bid, index) => (
            <li key={`bid-${index}`} className="flex justify-between">
              <span className="text-[var(--color-text-main)]">
                {formatPrice(bid.price, source)}
              </span>
              <span className="text-[var(--color-text-sub)]">
                {formatSize(bid.size)}
              </span>
            </li>
          ))}
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
      ) : orderbook?.asks?.length ? (
        <ul className="mt-4 space-y-3 text-sm">
          {orderbook.asks.map((ask, index) => (
            <li key={`ask-${index}`} className="flex justify-between">
              <span className="text-[var(--color-text-main)]">
                {formatPrice(ask.price, source)}
              </span>
              <span className="text-[var(--color-text-sub)]">
                {formatSize(ask.size)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-text-sub)]">
          No ask data available.
        </p>
      )}
    </SurfaceCard>
  </section>
);
