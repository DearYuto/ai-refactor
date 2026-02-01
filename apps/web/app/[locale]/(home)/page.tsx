"use client";

import { BalanceCard } from "@/app/[locale]/(home)/components/BalanceCard";
import { HomeHeader } from "@/app/[locale]/(home)/components/HomeHeader";
import { HomeHero } from "@/app/[locale]/(home)/components/HomeHero";
import { HomeSummary } from "@/app/[locale]/(home)/components/HomeSummary";
import { useBalances } from "@/lib/hooks/useBalances";

export default function Home() {
  const { balances, isLoading, error } = useBalances();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:px-12">
        <HomeHeader />

        <main className="relative mt-12 flex flex-1 flex-col gap-10">
          <div className="pointer-events-none absolute -top-20 right-[-120px] h-64 w-64 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
          <div className="pointer-events-none absolute -bottom-16 left-[-80px] h-72 w-72 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-500/10" />

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
