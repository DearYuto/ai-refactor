import type { MarketSource, Ticker } from "@/lib/api/market.types";
import { SurfaceCard } from "@/components/surface-card";
import { formatPercent, formatPrice, formatVolume } from "@/lib/format/market";

type LivePriceSectionProps = {
  ticker: Ticker | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  source: MarketSource;
};

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export const LivePriceSection = ({
  ticker,
  isLoading,
  error,
  lastUpdated,
  source,
}: LivePriceSectionProps) => {
  const changeValue = ticker ? Number(ticker.change24h) : null;
  const hasChangeValue = changeValue !== null && !Number.isNaN(changeValue);
  const changeClass = hasChangeValue
    ? changeValue >= 0
      ? "text-emerald-400"
      : "text-rose-400"
    : "text-[var(--color-text-sub)]";

  return (
    <SurfaceCard className="grid gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          <h2 className="text-base font-semibold text-[var(--color-text-main)]">
            Live Price
          </h2>
        </div>
        <span className="text-xs text-[var(--color-text-sub)]">
          {isLoading ? "Fetching" : "Auto-refreshing"}
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-text-sub)]">
          Loading live price...
        </p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : ticker ? (
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-5 py-6">
            <p className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
              {ticker.symbol}
            </p>
            <p className="mt-3 text-4xl font-semibold text-[var(--color-text-main)]">
              {formatPrice(ticker.price, source)}
            </p>
            <p className={`mt-2 text-sm font-medium ${changeClass}`}>
              {formatPercent(ticker.change24h)} 24h
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
                24h Volume
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-text-main)]">
                {formatVolume(ticker.volume24h, source)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
                Last Update
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-text-main)]">
                {lastUpdated ? formatTime(lastUpdated) : "--"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-sub)]">
          No live price data available.
        </p>
      )}
    </SurfaceCard>
  );
};
