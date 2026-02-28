"use client";

import { useState } from "react";
import { useRequestWithdrawal } from "@/lib/hooks/useWithdrawals";

const WITHDRAWAL_FEES = {
  BTC: 0.0005,
  USDT: 1.0,
  KRW: 1000,
};

const MIN_WITHDRAWAL = {
  BTC: 0.001,
  USDT: 10,
  KRW: 10000,
};

export function WithdrawalSection() {
  const [asset, setAsset] = useState<"BTC" | "USDT" | "KRW">("BTC");
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const requestWithdrawal = useRequestWithdrawal();

  const fee = WITHDRAWAL_FEES[asset];
  const minAmount = MIN_WITHDRAWAL[asset];
  const total = amount ? Number(amount) + fee : 0;

  const handleWithdraw = async () => {
    if (!amount || Number(amount) < minAmount) {
      alert(`최소 출금액: ${minAmount} ${asset}`);
      return;
    }
    if (!toAddress) {
      alert("출금 주소를 입력하세요");
      return;
    }

    if (
      !confirm(
        `${amount} ${asset}를 출금하시겠습니까?\n수수료: ${fee} ${asset}\n총 ${total} ${asset}`,
      )
    ) {
      return;
    }

    try {
      await requestWithdrawal.mutateAsync({
        asset,
        amount: Number(amount),
        toAddress,
      });
      alert("출금 요청이 제출되었습니다. 승인 대기 중...");
      setAmount("");
      setToAddress("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "출금 요청 실패";
      alert(message);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold mb-4">출금하기</h2>

      <div className="space-y-4">
        {/* 자산 선택 */}
        <div>
          <label className="block text-sm font-medium mb-1">자산</label>
          <select
            value={asset}
            onChange={(e) =>
              setAsset(e.target.value as "BTC" | "USDT" | "KRW")
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="BTC">BTC</option>
            <option value="USDT">USDT</option>
            <option value="KRW">KRW</option>
          </select>
        </div>

        {/* 출금 금액 */}
        <div>
          <label className="block text-sm font-medium mb-1">
            출금 금액 (최소: {minAmount} {asset})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full border rounded px-3 py-2"
            step="0.00000001"
          />
        </div>

        {/* 출금 주소 */}
        <div>
          <label className="block text-sm font-medium mb-1">출금 주소</label>
          <input
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder={
              asset === "BTC"
                ? "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                : asset === "USDT"
                  ? "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                  : "110-123-456789"
            }
            className="w-full border rounded px-3 py-2 font-mono text-sm"
          />
        </div>

        {/* 수수료 및 총액 표시 */}
        {amount && (
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex justify-between text-sm mb-1">
              <span>출금 금액:</span>
              <span>
                {Number(amount).toFixed(8)} {asset}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>수수료:</span>
              <span>
                {fee} {asset}
              </span>
            </div>
            <div className="flex justify-between font-bold border-t pt-1">
              <span>총 차감:</span>
              <span>
                {total.toFixed(8)} {asset}
              </span>
            </div>
          </div>
        )}

        {/* 출금 버튼 */}
        <button
          onClick={handleWithdraw}
          disabled={requestWithdrawal.isPending}
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 disabled:bg-gray-300"
        >
          {requestWithdrawal.isPending ? "처리 중..." : "출금 요청"}
        </button>

        <p className="text-xs text-gray-500">
          ⚠️ 출금 요청은 관리자 승인 후 처리됩니다. 승인까지 최대 24시간이
          소요될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
