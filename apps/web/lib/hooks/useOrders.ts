import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  fetchOrders,
  ordersQueryKeys,
  type CreateOrderPayload,
  type OrderRecord,
} from "@/lib/api/orders.api";
import { getWalletControllerGetBalanceQueryKey } from "@/lib/api/generated";

const extractErrorMessage = (
  error: unknown,
  fallback: string,
): string | null => {
  if (!error) return null;
  return error instanceof Error ? error.message : fallback;
};

type OrdersState = {
  orders: OrderRecord[] | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  placeOrder: (payload: CreateOrderPayload) => Promise<OrderRecord>;
  resetSubmission: () => void;
};

export const useOrders = (): OrdersState => {
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryKey: ordersQueryKeys.all(),
    queryFn: async () => {
      const payload = await fetchOrders();
      return payload.orders;
    },
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });

  const createOrderMutation = useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all() });
      await queryClient.invalidateQueries({
        queryKey: getWalletControllerGetBalanceQueryKey(),
      });
    },
  });

  const message = extractErrorMessage(ordersQuery.error, "Unable to load orders");
  const submitError = extractErrorMessage(
    createOrderMutation.error,
    "Unable to submit order",
  );

  return {
    orders: ordersQuery.data ?? null,
    isLoading: ordersQuery.isLoading,
    error: message,
    isSubmitting: createOrderMutation.isPending,
    submitError,
    placeOrder: async (payload: CreateOrderPayload) => {
      const response = await createOrderMutation.mutateAsync(payload);
      return response.order;
    },
    resetSubmission: () => createOrderMutation.reset(),
  };
};
