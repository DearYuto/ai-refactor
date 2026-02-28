"use client";

import { useState } from "react";
import { useCreateDeposit } from "@/lib/hooks/useDeposits";

export function DepositSection() {
  const [asset, setAsset] = useState<"BTC" | "USDT" | "KRW">("BTC");
  const [amount, setAmount] = useState("");
  const createDeposit = useCreateDeposit();

  const handleSimulateDeposit = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("금액을 입력하세요");
      return;
    }

    try {
      await createDeposit.mutateAsync({
        asset,
        amount: Number(amount),
        txHash: `sim-${Date.now()}`, // 시뮬레이션
      });
      alert("입금 요청이 생성되었습니다. 확인 중...");
      setAmount("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "입금 요청 실패";
      alert(message);
    }
  };

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold mb-4">입금하기</h2>

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

        {/* 입금 주소 표시 */}
        <div>
          <label className="block text-sm font-medium mb-1">입금 주소</label>
          <div className="p-3 bg-gray-100 rounded break-all font-mono text-sm">
            {asset === "BTC" && "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"}
            {asset === "USDT" && "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}
            {asset === "KRW" && "110-123-456789 (우리은행)"}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            위 주소로 {asset}를 전송하세요. 확인 후 자동으로 입금됩니다.
          </p>
        </div>

        {/* 시뮬레이션 (테스트용) */}
        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-gray-500 mb-2">
            ⚠️ 테스트: 아래에서 입금을 시뮬레이션할 수 있습니다
          </p>
          <div>
            <label className="block text-sm font-medium mb-1">
              입금할 금액
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
          <button
            onClick={handleSimulateDeposit}
            disabled={createDeposit.isPending}
            className="w-full mt-2 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {createDeposit.isPending ? "처리 중..." : "입금 시뮬레이션"}
          </button>
        </div>
      </div>
    </div>
  );
}
