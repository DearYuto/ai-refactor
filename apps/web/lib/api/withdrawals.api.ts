import { customFetch } from "@/lib/api/fetcher";

/**
 * 출금 기록
 */
export interface WithdrawalRecord {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  fee: number;
  toAddress: string;
  txHash: string | null;
  status:
    | "pending"
    | "approved"
    | "processing"
    | "completed"
    | "rejected";
  rejectReason: string | null;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
}

/**
 * 출금 요청 DTO
 */
export interface CreateWithdrawalDto {
  asset: "BTC" | "USDT" | "KRW";
  amount: number;
  toAddress: string;
}

type FetchResponse<TData> = {
  data: TData;
  status: number;
  headers: Headers;
};

/**
 * 사용자의 모든 출금 내역을 조회합니다
 */
export async function fetchWithdrawals(): Promise<WithdrawalRecord[]> {
  const response = await customFetch<FetchResponse<WithdrawalRecord[]>>(
    "/withdrawals",
    { method: "GET" },
  );
  return response.data;
}

/**
 * 새로운 출금을 요청합니다
 */
export async function requestWithdrawal(
  dto: CreateWithdrawalDto,
): Promise<WithdrawalRecord> {
  const response = await customFetch<FetchResponse<WithdrawalRecord>>(
    "/withdrawals",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    },
  );
  return response.data;
}
