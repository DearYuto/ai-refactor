type HomeSummaryProps = {
  isLoading: boolean;
};

export const HomeSummary = ({ isLoading }: HomeSummaryProps) => (
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
);
