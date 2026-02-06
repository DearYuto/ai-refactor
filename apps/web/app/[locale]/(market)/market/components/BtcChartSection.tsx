"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import {
  createChart,
  CandlestickSeries,
  type ISeriesApi,
} from "lightweight-charts";
import { SurfaceCard } from "@/components/SurfaceCard";
import {
  fetchKlines,
  marketRefresh,
  marketQueryKeys,
  type MarketSource,
} from "@/lib/api/market";

type BtcChartSectionProps = {
  source: MarketSource;
  onSourceChange: (source: MarketSource) => void;
};

export const BtcChartSection = ({
  source,
  onSourceChange,
}: BtcChartSectionProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const chartQuery = useQuery({
    queryKey: marketQueryKeys.klines(source),
    queryFn: ({ signal }: QueryFunctionContext) => fetchKlines(source, signal),
    refetchInterval: marketRefresh.klinesMs,
    staleTime: marketRefresh.staleTimeMs,
    refetchOnWindowFocus: true,
  });

  const chartOptions = useMemo(
    () => ({
      layout: {
        background: { color: "transparent" },
        textColor: "#cbd5f5",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.16)" },
        horzLines: { color: "rgba(148, 163, 184, 0.16)" },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.24)",
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.24)",
      },
    }),
    [],
  );

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      ...chartOptions,
      width: containerRef.current.clientWidth,
      height: 320,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#f43f5e",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#f43f5e",
    });

    chartRef.current = chart;
    seriesRef.current = series;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      chart.applyOptions({ width: entry.contentRect.width });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [chartOptions]);

  useEffect(() => {
    if (!seriesRef.current || !chartQuery.data?.length) return;
    seriesRef.current.setData(chartQuery.data);
    chartRef.current?.timeScale().fitContent();
  }, [chartQuery.data]);

  return (
    <SurfaceCard className="grid gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-sub)]">
            Bitcoin
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--color-text-main)]">
            {source === "BINANCE" ? "BTCUSDT Chart" : "KRW-BTC Chart"}
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-1 text-xs">
          <button
            type="button"
            onClick={() => onSourceChange("BINANCE")}
            className={`rounded-full px-3 py-1 transition ${
              source === "BINANCE"
                ? "bg-[var(--color-surface)] text-[var(--color-text-main)] shadow-sm"
                : "text-[var(--color-text-sub)]"
            }`}
          >
            Binance USDT
          </button>
          <button
            type="button"
            onClick={() => onSourceChange("UPBIT")}
            className={`rounded-full px-3 py-1 transition ${
              source === "UPBIT"
                ? "bg-[var(--color-surface)] text-[var(--color-text-main)] shadow-sm"
                : "text-[var(--color-text-sub)]"
            }`}
          >
            Upbit KRW
          </button>
        </div>
      </div>

      {chartQuery.isLoading ? (
        <p className="text-sm text-[var(--color-text-sub)]">Loading chart...</p>
      ) : chartQuery.error ? (
        <p className="text-sm text-red-400">
          {chartQuery.error instanceof Error
            ? chartQuery.error.message
            : "Unable to load chart data"}
        </p>
      ) : null}
      <div
        ref={containerRef}
        className="h-80 w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]"
      />
    </SurfaceCard>
  );
};
