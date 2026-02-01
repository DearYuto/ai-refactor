import type { Ticker } from "@/lib/hooks/useMarketData";

const formatValue = (value: string | number) => {
  if (typeof value === "number") {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 8,
    });
  }

  return value;
};

type TickerSectionProps = {
  ticker: Ticker | null;
  isLoading: boolean;
  error: string | null;
};

export const TickerSection = ({
  ticker,
  isLoading,
  error,
}: TickerSectionProps) => (
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
);
