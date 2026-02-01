import type { BalanceItem } from "@/lib/hooks/useBalances";

type BalanceCardProps = {
  balances: BalanceItem[] | null;
  isLoading: boolean;
  error: string | null;
};

export const BalanceCard = ({
  balances,
  isLoading,
  error,
}: BalanceCardProps) => (
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
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
);
