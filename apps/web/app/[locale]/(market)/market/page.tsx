"use client";

import { useState } from "react";
import { MarketHeader } from "@/app/[locale]/(market)/market/components/market-header";
import { BtcChartSection } from "@/app/[locale]/(market)/market/components/btc-chart-section";
import { LivePriceSection } from "@/app/[locale]/(market)/market/components/live-price-section";
import { OrderbookSection } from "@/app/[locale]/(market)/market/components/orderbook-section";
import { TickerSection } from "@/app/[locale]/(market)/market/components/ticker-section";
import { TradeTapeSection } from "@/app/[locale]/(market)/market/components/trade-tape-section";
import { WalletBalanceSection } from "@/app/[locale]/(market)/market/components/wallet-balance-section";
import { OrderEntrySection } from "@/app/[locale]/(market)/market/components/order-entry-section";
import { PageShell } from "@/components/layout/page-shell";
import { MARKET_SOURCE, type MarketSource } from "@/lib/api/market.types";
import { useMarketData } from "@/lib/hooks/useMarketData";
import { useMarketSocket } from "@/lib/hooks/useMarketSocket";

export default function MarketPage() {
  const [source, setSource] = useState<MarketSource>(MARKET_SOURCE.BINANCE);
  const socketStatus = useMarketSocket(source);
  const enablePolling = socketStatus !== "connected";
  const { ticker, orderbook, trades, isLoading, error, lastUpdated } =
    useMarketData(source, enablePolling);

  return (
    <PageShell>
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <MarketHeader
          title={ticker?.symbol ?? "Market Overview"}
          isLoading={isLoading}
          socketStatus={socketStatus}
        />

        <BtcChartSection source={source} onSourceChange={setSource} />

        <LivePriceSection
          ticker={ticker}
          isLoading={isLoading}
          error={error}
          lastUpdated={lastUpdated}
          source={source}
        />

        <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <WalletBalanceSection />
          <OrderEntrySection source={source} />
        </section>

        <TickerSection
          ticker={ticker}
          isLoading={isLoading}
          error={error}
          source={source}
        />

        <OrderbookSection
          orderbook={orderbook}
          isLoading={isLoading}
          error={error}
          source={source}
        />

        <TradeTapeSection
          trades={trades}
          isLoading={isLoading}
          error={error}
          source={source}
        />
      </main>
    </PageShell>
  );
}
