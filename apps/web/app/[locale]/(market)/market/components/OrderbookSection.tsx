import type { Orderbook } from "@/lib/hooks/useMarketData";

const formatValue = (value: string | number) => {
  if (typeof value === "number") {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 8,
    });
  }

  return value;
};

type OrderbookSectionProps = {
  orderbook: Orderbook | null;
  isLoading: boolean;
  error: string | null;
};

export const OrderbookSection = ({
  orderbook,
  isLoading,
  error,
}: OrderbookSectionProps) => (
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
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
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
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
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
);
