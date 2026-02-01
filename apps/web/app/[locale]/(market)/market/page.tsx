"use client";

import { MarketHeader } from "@/app/[locale]/(market)/market/components/MarketHeader";
import { OrderbookSection } from "@/app/[locale]/(market)/market/components/OrderbookSection";
import { TickerSection } from "@/app/[locale]/(market)/market/components/TickerSection";
import { useMarketData } from "@/lib/hooks/useMarketData";

export default function MarketPage() {
  const { ticker, orderbook, isLoading, error } = useMarketData();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <MarketHeader
          title={ticker?.symbol ?? "Market Overview"}
          isLoading={isLoading}
        />

        <TickerSection ticker={ticker} isLoading={isLoading} error={error} />

        <OrderbookSection
          orderbook={orderbook}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </div>
  );
}
