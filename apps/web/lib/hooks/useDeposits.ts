"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchDeposits,
  createDeposit,
  CreateDepositDto,
} from "@/lib/api/deposits.api";

/**
 * 입금 내역을 조회하는 Hook
 * - 10초마다 자동 갱신하여 실시간 입금 확인
 */
export function useDeposits() {
  return useQuery({
    queryKey: ["deposits"],
    queryFn: fetchDeposits,
    refetchInterval: 10000, // 10초마다 자동 갱신 (입금 확인용)
  });
}

/**
 * 새 입금을 생성하는 Mutation Hook (테스트/시뮬레이션용)
 * - 성공 시 입금 내역과 지갑 잔고를 자동 갱신
 */
export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDepositDto) => createDeposit(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposits"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
