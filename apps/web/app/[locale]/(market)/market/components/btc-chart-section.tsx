"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryFunctionContext,
} from "@tanstack/react-query";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type CandlestickData,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  fetchKlines,
  fetchTicker,
  marketIntervalSeconds,
  type KlinesData,
} from "@/lib/api/market.fetchers";
import {
  marketQueryDefaults,
  marketRefresh,
  marketQueryKeys,
} from "@/lib/api/market.query";
import {
  MARKET_INTERVALS,
  MARKET_SOURCE,
  type MarketInterval,
  type MarketSource,
  type Ticker,
} from "@/lib/api/market.types";

type BtcChartSectionProps = {
  source: MarketSource;
  onSourceChange: (source: MarketSource) => void;
};

const getCssVar = (name: string, fallback: string) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const candidate = value || fallback;

  if (!candidate.startsWith("var(")) {
    return candidate;
  }

  const resolver = document.createElement("span");
  resolver.style.color = candidate;
  resolver.style.position = "absolute";
  resolver.style.opacity = "0";
  resolver.style.pointerEvents = "none";
  (document.body ?? document.documentElement).appendChild(resolver);
  const resolved = getComputedStyle(resolver).color.trim();
  resolver.remove();

  return resolved || fallback;
};

const toRgba = (color: string, alpha: number) => {
  if (!color.startsWith("#")) {
    return color;
  }

  let hex = color.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((value) => value + value)
      .join("");
  }

  const parsed = Number.parseInt(hex, 16);
  const red = (parsed >> 16) & 255;
  const green = (parsed >> 8) & 255;
  const blue = parsed & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const BtcChartSection = ({
  source,
  onSourceChange,
}: BtcChartSectionProps) => {
  const [interval, setInterval] = useState<MarketInterval>("1m");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastBarRef = useRef<CandlestickData | null>(null);
  const queryClient = useQueryClient();
  const chartQuery = useQuery<KlinesData>({
    queryKey: marketQueryKeys.klines(source, interval),
    queryFn: ({ signal }: QueryFunctionContext) =>
      fetchKlines(source, interval, signal),
    refetchInterval: marketRefresh.klinesMs,
    ...marketQueryDefaults,
  });
  const tickerQuery = useQuery<Ticker>({
    queryKey: marketQueryKeys.ticker(source),
    queryFn: ({ signal }: QueryFunctionContext) => fetchTicker(source, signal),
    enabled: false,
    initialData: () =>
      queryClient.getQueryData<Ticker>(marketQueryKeys.ticker(source)),
  });

  const chartTheme = useMemo(() => {
    const textPrimary = getCssVar("--color-text-primary", "#e5e7eb");
    const textSecondary = getCssVar("--color-text-secondary", "#9ca3af");
    const borderSecondary = getCssVar("--color-border-secondary", "#2d3748");
    const buy = getCssVar("--color-buy", "#2dd4bf");
    const sell = getCssVar("--color-sell", "#fb7185");

    return {
      textPrimary,
      textSecondary,
      borderSecondary,
      buy,
      sell,
    };
  }, []);

  const chartOptions = useMemo(
    () => ({
      layout: {
        background: { color: "transparent" },
        textColor: chartTheme.textSecondary,
      },
      grid: {
        vertLines: {
          color: toRgba(chartTheme.borderSecondary, 0.16),
        },
        horzLines: {
          color: toRgba(chartTheme.borderSecondary, 0.16),
        },
      },
      timeScale: {
        borderColor: toRgba(chartTheme.borderSecondary, 0.24),
      },
      rightPriceScale: {
        borderColor: toRgba(chartTheme.borderSecondary, 0.24),
      },
    }),
    [chartTheme],
  );

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    const chart = createChart(containerRef.current, {
      ...chartOptions,
      width: containerRef.current.clientWidth,
      height: 320,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: chartTheme.buy,
      downColor: chartTheme.sell,
      borderVisible: false,
      wickUpColor: chartTheme.buy,
      wickDownColor: chartTheme.sell,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = series;
    volumeSeriesRef.current = volumeSeries;
    const resizeObserver = new ResizeObserver((entries) => {
      const [entry] = entries;
      if (!entry) return;
      chart.applyOptions({ width: entry.contentRect.width });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [chartOptions, chartTheme.buy, chartTheme.sell]);

  useEffect(() => {
    if (!seriesRef.current || !chartQuery.data) return;
    seriesRef.current.setData(chartQuery.data.candles);
    const volumes = chartQuery.data.volumes.map((volume) => {
      if (volume.color === "var(--color-buy)") {
        return { ...volume, color: chartTheme.buy };
      }

      if (volume.color === "var(--color-sell)") {
        return { ...volume, color: chartTheme.sell };
      }

      return volume;
    });
    volumeSeriesRef.current?.setData(volumes);
    lastBarRef.current =
      chartQuery.data.candles[chartQuery.data.candles.length - 1] ?? null;
    chartRef.current?.timeScale().fitContent();
  }, [chartQuery.data]);

  useEffect(() => {
    lastBarRef.current = null;
  }, [source, interval]);

  useEffect(() => {
    if (!seriesRef.current || !tickerQuery.data || !lastBarRef.current) return;
    const latestPrice = Number(tickerQuery.data.price);
    if (!Number.isFinite(latestPrice)) return;

    const currentTime = Math.floor(Date.now() / 1000) as UTCTimestamp;
    const intervalSeconds = marketIntervalSeconds(interval);
    const intervalBoundary = (currentTime -
      (currentTime % intervalSeconds)) as UTCTimestamp;
    const lastBarTime = Number(lastBarRef.current.time);
    const shouldStartNewBar = lastBarTime < intervalBoundary;

    const nextBar: CandlestickData = shouldStartNewBar
      ? {
          time: currentTime,
          open: latestPrice,
          high: latestPrice,
          low: latestPrice,
          close: latestPrice,
        }
      : {
          ...lastBarRef.current,
          high: Math.max(lastBarRef.current.high, latestPrice),
          low: Math.min(lastBarRef.current.low, latestPrice),
          close: latestPrice,
        };

    lastBarRef.current = nextBar;
    seriesRef.current.update(nextBar);
  }, [interval, tickerQuery.data]);

  const intervalOptions: MarketInterval[] = [...MARKET_INTERVALS];
  const sourceOptions = [
    { value: MARKET_SOURCE.BINANCE, label: "Binance USDT" },
    { value: MARKET_SOURCE.UPBIT, label: "Upbit KRW" },
  ] as const;
  const chartTitle =
    source === MARKET_SOURCE.BINANCE ? "BTCUSDT Chart" : "KRW-BTC Chart";

  return (
    <SurfaceCard className="grid gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-sub)]">
            Bitcoin
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--color-text-main)]">
            {chartTitle}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-1 text-xs">
            {intervalOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setInterval(option)}
                className={`rounded-full px-3 py-1 transition ${
                  interval === option
                    ? "bg-[var(--color-surface)] text-[var(--color-text-main)] shadow-sm"
                    : "text-[var(--color-text-sub)]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-1 text-xs">
            {sourceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSourceChange(option.value)}
                className={`rounded-full px-3 py-1 transition ${
                  source === option.value
                    ? "bg-[var(--color-surface)] text-[var(--color-text-main)] shadow-sm"
                    : "text-[var(--color-text-sub)]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
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
