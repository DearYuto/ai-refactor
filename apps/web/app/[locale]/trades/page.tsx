"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SurfaceCard } from "@/components/ui/surface-card";
import { fetchMyTrades, tradesQueryKeys } from "@/lib/api/trades.api";
import type { MarketSource } from "@/lib/api/market.types";
import { MARKET_SOURCE } from "@/lib/api/market.types";
import { formatNumeric } from "@repo/utils";

const formatValue = (value: number | null, maximumFractionDigits: number) => {
  if (value === null) return "--";
  return formatNumeric(value, { maximumFractionDigits });
};

const formatTime = (timestamp: string) => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export default function TradesPage() {
  const [sourceFilter, setSourceFilter] = useState<MarketSource | "all">("all");

  const { data, isLoading, error } = useQuery({
    queryKey: tradesQueryKeys.myTrades(
      sourceFilter === "all" ? undefined : sourceFilter,
    ),
    queryFn: () =>
      fetchMyTrades(sourceFilter === "all" ? undefined : sourceFilter),
    refetchInterval: 5000,
  });

  const trades = data ?? [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-main)]">
          My Trade History
        </h1>

        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-sub)]">Filter:</span>
          <select
            value={sourceFilter}
            onChange={(e) =>
              setSourceFilter(e.target.value as MarketSource | "all")
            }
            className="rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-1.5 text-sm text-[var(--color-text-main)] outline-none transition focus:border-[var(--color-brand-500)]"
          >
            <option value="all">All Markets</option>
            <option value={MARKET_SOURCE.UPBIT}>Upbit (BTC/KRW)</option>
            <option value={MARKET_SOURCE.BINANCE}>Binance (BTC/USDT)</option>
          </select>
        </div>
      </div>

      <SurfaceCard className="rounded-2xl p-6">
        {isLoading ? (
          <p className="text-center text-sm text-[var(--color-text-sub)]">
            Loading trades...
          </p>
        ) : error ? (
          <p className="text-center text-sm text-red-400">
            {error instanceof Error ? error.message : "Failed to load trades"}
          </p>
        ) : trades.length === 0 ? (
          <p className="text-center text-sm text-[var(--color-text-sub)]">
            No trades found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border-soft)] text-left text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Market</th>
                  <th className="pb-3">Side</th>
                  <th className="pb-3 text-right">Size</th>
                  <th className="pb-3 text-right">Price</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pb-3 text-right">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-soft)]">
                {trades.map((trade) => {
                  const total = trade.size * trade.price;
                  return (
                    <tr
                      key={trade.id}
                      className="text-[var(--color-text-main)] hover:bg-[var(--color-surface-muted)]"
                    >
                      <td className="py-3 text-[var(--color-text-sub)]">
                        {formatTime(trade.timestamp)}
                      </td>
                      <td className="py-3">
                        {trade.baseAsset}/{trade.quoteAsset}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            trade.side === "buy"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {trade.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {formatValue(trade.size, 6)}
                      </td>
                      <td className="py-3 text-right">
                        {formatValue(trade.price, 2)}
                      </td>
                      <td className="py-3 text-right">
                        {formatValue(total, 2)} {trade.quoteAsset}
                      </td>
                      <td className="py-3 text-right text-amber-400">
                        {formatValue(trade.fee, 6)} {trade.baseAsset}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SurfaceCard>

      {trades.length > 0 && (
        <div className="mt-4 text-center text-xs text-[var(--color-text-sub)]">
          Total {trades.length} trade{trades.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}
