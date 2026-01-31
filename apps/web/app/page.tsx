"use client";

import { useEffect, useState } from "react";

import { apiBaseUrl } from "../lib/config";

type BalanceItem = {
  asset: string;
  available: string | number;
};

export default function Home() {
  const [balances, setBalances] = useState<BalanceItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadBalances = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/wallet/balance`);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as BalanceItem[];

        if (isActive) {
          setBalances(data);
          setError(null);
        }
      } catch (caught) {
        if (isActive) {
          const message =
            caught instanceof Error ? caught.message : "Unable to load balance";
          setError(message);
          setBalances(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadBalances();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-sm font-semibold text-zinc-900 shadow-sm dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-50">
              BW
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
                Balance Watch
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Portfolio Overview
              </p>
            </div>
          </div>
          <nav aria-label="Primary" className="flex items-center gap-2">
            <a
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-black/20 hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-white/20"
              href="/market"
            >
              Market
            </a>
            <a
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              href="/login"
            >
              Login
            </a>
          </nav>
        </header>

        <main className="relative mt-12 flex flex-1 flex-col gap-10">
          <div className="pointer-events-none absolute -top-20 right-[-120px] h-64 w-64 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
          <div className="pointer-events-none absolute -bottom-16 left-[-80px] h-72 w-72 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-500/10" />

          <section className="relative z-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex flex-col gap-6">
              <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-400">
                Daily Snapshot
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
                Keep every asset in view, without losing the bigger picture.
              </h1>
              <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
                A calm command center for balances and market context. Track what is
                available now, scan recent movement, and move with confidence.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                  href="/market"
                >
                  Explore market
                </a>
                <a
                  className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-6 text-sm font-semibold text-zinc-800 transition hover:border-black/20 hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-white/20"
                  href="/login"
                >
                  Sign in
                </a>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                    Activity
                  </p>
                  <span className="rounded-full border border-black/10 px-3 py-1 text-xs text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                    {isLoading ? "Syncing" : "Live"}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {isLoading ? "Loading balances" : "Balances refreshed"}
                </p>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Review available funds and see the latest snapshot of each asset.
                </p>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
                <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                  Summary
                </p>
                <div className="mt-4 grid gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4 dark:border-white/10 dark:bg-black">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      Coverage
                    </p>
                    <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      Multi-asset
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Track balances across all markets.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4 dark:border-white/10 dark:bg-black">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      Alerts
                    </p>
                    <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      Subtle signals
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Stay informed without noise.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="relative z-10 rounded-3xl border border-black/10 bg-white px-6 py-6 text-left text-sm text-zinc-700 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.4)] dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-300"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Balance snapshot
              </h2>
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {isLoading ? "Loading" : "Updated"}
              </span>
            </div>
            <div className="mt-5">
              {isLoading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Fetching balances...
                </p>
              ) : error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : balances && balances.length > 0 ? (
                <ul className="divide-y divide-black/5 dark:divide-white/10">
                  {balances.map((balance) => (
                    <li
                      key={balance.asset}
                      className="flex items-center justify-between py-3"
                    >
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {balance.asset}
                      </span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">
                        {balance.available}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No balances available.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
