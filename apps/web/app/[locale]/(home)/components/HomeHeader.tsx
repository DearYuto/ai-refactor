import { Link } from "@/i18n/navigation";

export const HomeHeader = () => (
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
      <Link
        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-black/20 hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-white/20"
        href="/market"
      >
        Market
      </Link>
      <Link
        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        href="/login"
      >
        Login
      </Link>
    </nav>
  </header>
);
