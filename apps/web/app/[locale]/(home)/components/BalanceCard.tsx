"use client";

import { useTranslations } from "next-intl";
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
}: BalanceCardProps) => {
  const t = useTranslations("home");

  return (
    <section
      className="relative z-10 rounded-3xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 py-6 text-left text-sm text-[var(--color-text-sub)] shadow-[0_20px_46px_-32px_rgba(31,94,219,0.4)]"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--color-text-main)]">
          {t("balance.title")}
        </h2>
        <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-sub)]">
          {isLoading ? t("balance.loadingStatus") : t("balance.updatedStatus")}
        </span>
      </div>
      <div className="mt-5">
        {isLoading ? (
          <p className="text-sm text-[var(--color-text-sub)]">
            {t("balance.loadingMessage")}
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : balances && balances.length > 0 ? (
          <ul className="divide-y divide-[var(--color-border-soft)]">
            {balances.map((balance) => (
              <li
                key={balance.asset}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm font-medium text-[var(--color-text-main)]">
                  {balance.asset}
                </span>
                <span className="text-sm text-[var(--color-text-sub)]">
                  {balance.available}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-text-sub)]">
            {t("balance.emptyMessage")}
          </p>
        )}
      </div>
    </section>
  );
};
