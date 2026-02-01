"use client";

import { BalanceCard } from "@/app/[locale]/(home)/components/BalanceCard";
import { HomeHeader } from "@/app/[locale]/(home)/components/HomeHeader";
import { HomeHero } from "@/app/[locale]/(home)/components/HomeHero";
import { HomeSummary } from "@/app/[locale]/(home)/components/HomeSummary";
import { useBalances } from "@/lib/hooks/useBalances";

export default function Home() {
  const { balances, isLoading, error } = useBalances();

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-main)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:px-12">
        <HomeHeader />

        <main className="relative mt-12 flex flex-1 flex-col gap-10">
          <div className="pointer-events-none absolute -top-24 right-[-140px] h-72 w-72 rounded-full bg-[rgba(111,211,255,0.35)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-[-100px] h-80 w-80 rounded-full bg-[rgba(58,141,255,0.2)] blur-3xl" />

          <section className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <HomeHero />
            <HomeSummary isLoading={isLoading} />
          </section>

          <BalanceCard
            balances={balances}
            isLoading={isLoading}
            error={error}
          />
        </main>
      </div>
    </div>
  );
}
