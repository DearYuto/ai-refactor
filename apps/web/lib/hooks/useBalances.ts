import { useEffect, useState } from "react";

import { apiBaseUrl } from "@/lib/config";

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

  return { balances, isLoading, error };
};
