import type { MarketSource, Ticker } from "@/lib/api/market.types";
import { formatPercent, formatPrice, formatVolume } from "@/lib/format/market";
import { SurfaceCard } from "@/components/surface-card";

type TickerSectionProps = {
  ticker: Ticker | null;
  isLoading: boolean;
  error: string | null;
  source: MarketSource;
};

export const TickerSection = ({
  ticker,
  isLoading,
  error,
  source,
}: TickerSectionProps) => (
  <SurfaceCard className="grid gap-6 p-6">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-[var(--color-text-main)]">
        Ticker
      </h2>
      <span className="text-xs text-[var(--color-text-sub)]">
        {isLoading ? "Fetching" : "Updated"}
      </span>
    </div>
    {isLoading ? (
      <p className="text-sm text-[var(--color-text-sub)]">Loading ticker...</p>
    ) : error ? (
      <p className="text-sm text-red-400">{error}</p>
    ) : ticker ? (
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
            Price
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-text-main)]">
            {formatPrice(ticker.price, source)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
            24h Change
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-text-main)]">
            {formatPercent(ticker.change24h)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
            24h Volume
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-text-main)]">
            {formatVolume(ticker.volume24h, source)}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
            Symbol
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-text-main)]">
            {ticker.symbol}
          </p>
        </div>
      </div>
    ) : (
      <p className="text-sm text-[var(--color-text-sub)]">
        No ticker data available.
      </p>
    )}
  </SurfaceCard>
);
