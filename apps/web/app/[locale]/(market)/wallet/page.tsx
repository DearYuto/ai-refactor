"use client";

import { useState } from "react";
import { useDeposits } from "@/lib/hooks/useDeposits";
import { useWithdrawals } from "@/lib/hooks/useWithdrawals";
import { DepositSection } from "./components/deposit-section";
import { WithdrawalSection } from "./components/withdrawal-section";
import { TransactionHistory } from "./components/transaction-history";

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<
    "deposit" | "withdraw" | "history"
  >("deposit");
  const { data: deposits, isLoading: depositsLoading } = useDeposits();
  const { data: withdrawals, isLoading: withdrawalsLoading } =
    useWithdrawals();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">지갑</h1>

      {/* 탭 메뉴 */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          className={`pb-2 px-4 ${
            activeTab === "deposit"
              ? "border-b-2 border-blue-500 font-bold"
              : ""
          }`}
          onClick={() => setActiveTab("deposit")}
        >
          입금
        </button>
        <button
          className={`pb-2 px-4 ${
            activeTab === "withdraw"
              ? "border-b-2 border-blue-500 font-bold"
              : ""
          }`}
          onClick={() => setActiveTab("withdraw")}
        >
          출금
        </button>
        <button
          className={`pb-2 px-4 ${
            activeTab === "history"
              ? "border-b-2 border-blue-500 font-bold"
              : ""
          }`}
          onClick={() => setActiveTab("history")}
        >
          입출금 내역
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === "deposit" && <DepositSection />}
      {activeTab === "withdraw" && <WithdrawalSection />}
      {activeTab === "history" && (
        <TransactionHistory
          deposits={deposits || []}
          withdrawals={withdrawals || []}
          isLoading={depositsLoading || withdrawalsLoading}
        />
      )}
    </div>
  );
}
