"use client";

import type { DepositRecord } from "@/lib/api/deposits.api";
import type { WithdrawalRecord } from "@/lib/api/withdrawals.api";

interface Props {
  deposits: DepositRecord[];
  withdrawals: WithdrawalRecord[];
  isLoading: boolean;
}

export function TransactionHistory({
  deposits,
  withdrawals,
  isLoading,
}: Props) {
  // 입금과 출금을 합쳐서 시간순 정렬
  const transactions = [
    ...deposits.map((d) => ({ ...d, type: "deposit" as const })),
    ...withdrawals.map((w) => ({ ...w, type: "withdrawal" as const })),
  ].sort((a, b) => {
    const timeA = a.type === "deposit" ? a.createdAt : a.requestedAt;
    const timeB = b.type === "deposit" ? b.createdAt : b.requestedAt;
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">입출금 내역</h2>

      {transactions.length === 0 ? (
        <p className="text-gray-500">입출금 내역이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">구분</th>
                <th className="px-4 py-2 border">자산</th>
                <th className="px-4 py-2 border">금액</th>
                <th className="px-4 py-2 border">상태</th>
                <th className="px-4 py-2 border">시간</th>
                <th className="px-4 py-2 border">상세</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isDeposit = tx.type === "deposit";
                const time = isDeposit
                  ? new Date(tx.createdAt).toLocaleString("ko-KR")
                  : new Date(tx.requestedAt).toLocaleString("ko-KR");

                return (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          isDeposit
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isDeposit ? "입금" : "출금"}
                      </span>
                    </td>
                    <td className="px-4 py-2 border">{tx.asset}</td>
                    <td className="px-4 py-2 border">
                      {tx.amount.toFixed(8)}
                      {!isDeposit && "fee" in tx && tx.fee && (
                        <span className="text-xs text-gray-500 block">
                          수수료: {tx.fee}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 border">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-2 border text-sm">{time}</td>
                    <td className="px-4 py-2 border text-xs">
                      {tx.txHash && (
                        <div className="font-mono truncate max-w-xs">
                          {tx.txHash}
                        </div>
                      )}
                      {!isDeposit && "rejectReason" in tx && tx.rejectReason && (
                        <div className="text-red-500">{tx.rejectReason}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    approved: "bg-blue-100 text-blue-700",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    pending: "대기 중",
    confirmed: "확인됨",
    approved: "승인됨",
    processing: "처리 중",
    completed: "완료",
    rejected: "거부됨",
    failed: "실패",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-sm ${colors[status] || "bg-gray-100 text-gray-700"}`}
    >
      {labels[status] || status}
    </span>
  );
}
