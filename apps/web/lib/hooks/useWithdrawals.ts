"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchWithdrawals,
  requestWithdrawal,
  CreateWithdrawalDto,
} from "@/lib/api/withdrawals.api";

/**
 * 출금 내역을 조회하는 Hook
 * - 10초마다 자동 갱신하여 실시간 출금 상태 확인
 */
export function useWithdrawals() {
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: fetchWithdrawals,
    refetchInterval: 10000, // 10초마다 자동 갱신 (출금 상태 확인용)
  });
}

/**
 * 출금을 요청하는 Mutation Hook
 * - 성공 시 출금 내역과 지갑 잔고를 자동 갱신
 */
export function useRequestWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateWithdrawalDto) => requestWithdrawal(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
