"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "@/lib/api/security.api";
import { useAuthStore } from "@/lib/store";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("인증 토큰이 없습니다");
      return;
    }

    verifyEmail(token)
      .then((result) => {
        setStatus("success");
        setMessage(result.message);
        // 사용자 정보 업데이트
        updateUser({ emailVerified: true });
        // 3초 후 보안 설정 페이지로 이동
        setTimeout(() => {
          router.push("/ko/settings/security");
        }, 3000);
      })
      .catch((error: any) => {
        setStatus("error");
        setMessage(error.message || "이메일 인증 실패");
      });
  }, [searchParams, router, updateUser]);

  return (
    <div className="container mx-auto p-6 max-w-md">
      <div className="border rounded-lg p-8 text-center">
        {status === "loading" && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-medium">이메일 인증 처리 중...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2 text-green-700">
              이메일 인증 완료!
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                이제 출금 등의 기능을 사용할 수 있습니다.
              </p>
            </div>
            <p className="text-sm text-gray-500">
              3초 후 보안 설정 페이지로 이동합니다...
            </p>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2 text-red-700">인증 실패</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700">
                인증 링크가 만료되었거나 잘못되었을 수 있습니다.
              </p>
            </div>
            <button
              onClick={() => router.push("/ko/settings/security")}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              보안 설정으로 이동
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
