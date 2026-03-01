import { customFetch } from "@/lib/api/fetcher";

/**
 * 입금 기록
 */
export interface DepositRecord {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  txHash: string | null;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  createdAt: string;
  confirmedAt: string | null;
}

/**
 * 입금 생성 DTO
 */
export interface CreateDepositDto {
  asset: "BTC" | "USDT" | "KRW";
  amount: number;
  txHash?: string;
  fromAddress?: string; // 보내는 주소 (선택사항, 백엔드에서 검증)
}

type FetchResponse<TData> = {
  data: TData;
  status: number;
  headers: Headers;
};

/**
 * 사용자의 모든 입금 내역을 조회합니다
 */
export async function fetchDeposits(): Promise<DepositRecord[]> {
  const response = await customFetch<FetchResponse<DepositRecord[]>>(
    "/deposits",
    { method: "GET" },
  );
  return response.data;
}

/**
 * 새로운 입금을 생성합니다 (테스트/시뮬레이션용)
 */
export async function createDeposit(
  dto: CreateDepositDto,
): Promise<DepositRecord> {
  const response = await customFetch<FetchResponse<DepositRecord>>(
    "/deposits",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    },
  );
  return response.data;
}
