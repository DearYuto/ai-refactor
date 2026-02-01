import { useWalletControllerGetBalance } from "@/lib/api/generated";

export type BalanceItem = {
  asset: string;
  available: string | number;
};

type BalancesState = {
  balances: BalanceItem[] | null;
  isLoading: boolean;
  error: string | null;
};

export const useBalances = (): BalancesState => {
  const { data, isLoading, error } = useWalletControllerGetBalance();
  const payload = data?.data as { balances?: BalanceItem[] } | undefined;
  const balances = payload?.balances ?? null;
  const message = error
    ? error instanceof Error
      ? error.message
      : "Unable to load balance"
    : null;

  return { balances, isLoading, error: message };
};
