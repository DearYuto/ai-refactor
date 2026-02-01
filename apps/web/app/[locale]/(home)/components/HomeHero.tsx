import { Link } from "@/i18n/navigation";

export const HomeHero = () => (
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
      <Link
        className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        href="/market"
      >
        Explore market
      </Link>
      <Link
        className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-6 text-sm font-semibold text-zinc-800 transition hover:border-black/20 hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-white/20"
        href="/login"
      >
        Sign in
      </Link>
    </div>
  </div>
);
