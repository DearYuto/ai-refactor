"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { sendVerificationEmail } from "@/lib/api/security.api";

export function EmailVerificationSection() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);

  /**
   * 이메일 인증 요청
   * 사용자 이메일로 인증 링크를 발송합니다
   */
  const handleSendVerification = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail(token!);
      alert("인증 이메일이 발송되었습니다. 이메일을 확인해주세요.");
    } catch (error: any) {
      alert(error.message || "이메일 발송 실패");
    } finally {
      setLoading(false);
    }
  };

  const isVerified = user?.emailVerified || false;

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">이메일 인증</h2>

      {isVerified ? (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-green-700 font-bold">
            ✅ 이메일이 인증되었습니다
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {user?.email}
          </p>
        </div>
      ) : (
        <div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
            <p className="text-yellow-700">⚠️ 이메일이 인증되지 않았습니다</p>
            <p className="text-sm text-gray-600 mt-1">
              이메일 인증을 완료하면 출금 등의 기능을 사용할 수 있습니다.
            </p>
            {user?.email && (
              <p className="text-sm text-gray-500 mt-2">
                이메일 주소: {user.email}
              </p>
            )}
          </div>
          <button
            onClick={handleSendVerification}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? "발송 중..." : "인증 이메일 발송"}
          </button>
        </div>
      )}
    </div>
  );
}
