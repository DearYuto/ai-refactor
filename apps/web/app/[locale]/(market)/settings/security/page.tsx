"use client";

import { useAuthStore } from "@/lib/store";
import { TwoFactorSection } from "./components/two-factor-section";
import { EmailVerificationSection } from "./components/email-verification-section";

export default function SecuritySettingsPage() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700 font-bold text-lg mb-2">
            🔒 로그인이 필요합니다
          </p>
          <p className="text-gray-600">
            보안 설정을 변경하려면 먼저 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔐 보안 설정</h1>

      <div className="space-y-8">
        {/* 이메일 인증 섹션 */}
        <EmailVerificationSection />

        {/* 2FA 섹션 */}
        <TwoFactorSection />
      </div>

      {/* 도움말 섹션 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold mb-2">💡 보안 팁</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 이메일 인증은 출금 기능 사용에 필수입니다</li>
          <li>• 2FA를 활성화하면 계정 보안이 크게 향상됩니다</li>
          <li>• 백업 코드는 안전한 곳에 보관하세요</li>
          <li>• 2FA 앱을 분실한 경우 백업 코드로 로그인할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
}
