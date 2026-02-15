import type { MarketSource, Trade } from "@/lib/api/market.types";
import { formatPrice, formatSize } from "@/lib/format/market";
import { SurfaceCard } from "@/components/ui/surface-card";

type TradeTapeSectionProps = {
  trades: Trade[] | null;
  isLoading: boolean;
  error: string | null;
  source: MarketSource;
};

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export const TradeTapeSection = ({
  trades,
  isLoading,
  error,
  source,
}: TradeTapeSectionProps) => (
  <SurfaceCard className="rounded-2xl p-6">
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-[var(--color-text-main)]">
        Trades
      </h2>
      <span className="text-xs text-[var(--color-text-sub)]">
        {isLoading ? "Loading" : "Live"}
      </span>
    </div>
    {isLoading ? (
      <p className="mt-4 text-sm text-[var(--color-text-sub)]">
        Loading trades...
      </p>
    ) : error ? (
      <p className="mt-4 text-sm text-red-400">{error}</p>
    ) : trades?.length ? (
      <ul className="mt-4 space-y-2 text-sm">
        {trades.map((trade) => (
          <li
            key={`trade-${trade.id}-${trade.timestamp}-${trade.price}-${trade.size}-${trade.side}`}
            className="flex items-center justify-between"
          >
            <span
              className={
                trade.side === "buy" ? "text-emerald-400" : "text-rose-400"
              }
            >
              {formatPrice(trade.price, source)}
            </span>
            <span className="text-[var(--color-text-sub)]">
              {formatSize(trade.size)}
            </span>
            <span className="text-[var(--color-text-sub)]">
              {formatTime(trade.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-4 text-sm text-[var(--color-text-sub)]">
        No trade data available.
      </p>
    )}
  </SurfaceCard>
);
