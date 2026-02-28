import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelOrder,
  createOrder,
  fetchOrders,
  ordersQueryKeys,
  type CreateOrderPayload,
  type OrderRecord,
} from "@/lib/api/orders.api";
import { getWalletControllerGetBalanceQueryKey } from "@/lib/api/generated";
import { getErrorMessage } from "@/lib/errors/error-messages";

type OrdersState = {
  orders: OrderRecord[] | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  placeOrder: (payload: CreateOrderPayload) => Promise<OrderRecord>;
  cancelOrder: (id: string) => Promise<OrderRecord>;
  resetSubmission: () => void;
};

const invalidateOrdersAndWallet = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await queryClient.invalidateQueries({ queryKey: ordersQueryKeys.all() });
  await queryClient.invalidateQueries({
    queryKey: getWalletControllerGetBalanceQueryKey(),
  });
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
    onSuccess: () => invalidateOrdersAndWallet(queryClient),
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: () => invalidateOrdersAndWallet(queryClient),
  });

  const message = ordersQuery.error ? getErrorMessage(ordersQuery.error) : null;
  const submitError = createOrderMutation.error
    ? getErrorMessage(createOrderMutation.error)
    : null;

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
    cancelOrder: async (id: string) => {
      const response = await cancelOrderMutation.mutateAsync(id);
      return response.order;
    },
    resetSubmission: () => createOrderMutation.reset(),
  };
};
