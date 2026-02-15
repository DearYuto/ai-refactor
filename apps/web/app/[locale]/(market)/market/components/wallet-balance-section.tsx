import { SurfaceCard } from "@/components/ui/surface-card";
import { useBalances } from "@/lib/hooks/useBalances";
import { formatNumeric } from "@repo/utils";

const formatBalance = (asset: string, value: string | number) => {
  const parsed = Number(value);
  const maximumFractionDigits = asset === "BTC" ? 6 : asset === "USDT" ? 2 : 0;
  const formatted = Number.isFinite(parsed)
    ? formatNumeric(parsed, { maximumFractionDigits })
    : value;

  return `${formatted} ${asset}`;
};

export const WalletBalanceSection = () => {
  const { balances, isLoading, error } = useBalances();

  return (
    <SurfaceCard
      className="grid gap-4 rounded-2xl p-6"
      data-testid="wallet-balance-section"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text-main)]">
          Wallet Balance
        </h2>
        <span className="text-xs text-[var(--color-text-sub)]">
          {isLoading ? "Syncing" : "Available"}
        </span>
      </div>

      {isLoading ? (
        <p
          className="text-sm text-[var(--color-text-sub)]"
          data-testid="wallet-balance-loading"
        >
          Loading balances...
        </p>
      ) : error ? (
        <p className="text-sm text-red-400" data-testid="wallet-balance-error">
          {error}
        </p>
      ) : balances?.length ? (
        <ul className="space-y-3" data-testid="wallet-balance-list">
          {balances.map((balance) => (
            <li
              key={balance.asset}
              className="flex items-center justify-between rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-4 py-3"
              data-testid="wallet-balance-item"
            >
              <span className="text-sm font-medium text-[var(--color-text-main)]">
                {balance.asset}
              </span>
              <span className="text-sm text-[var(--color-text-sub)]">
                {formatBalance(balance.asset, balance.available)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="text-sm text-[var(--color-text-sub)]"
          data-testid="wallet-balance-empty"
        >
          No balances available.
        </p>
      )}
    </SurfaceCard>
  );
};
