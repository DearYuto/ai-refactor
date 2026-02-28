"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import {
  setup2FA,
  enable2FA,
  disable2FA,
  getBackupCodes,
  regenerateBackupCodes,
} from "@/lib/api/security.api";

type Step = "disabled" | "setup" | "enabled";

export function TwoFactorSection() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [step, setStep] = useState<Step>(
    user?.twoFactorEnabled ? "enabled" : "disabled"
  );
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [tfaToken, setTfaToken] = useState<string>("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * 2FA 설정 시작
   * QR 코드와 시크릿 키를 받아옵니다
   */
  const handleSetup = async () => {
    setLoading(true);
    try {
      const result = await setup2FA(token!);
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setStep("setup");
    } catch (error: any) {
      alert(error.message || "2FA 설정 실패");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2FA 활성화
   * TOTP 코드로 검증하고 백업 코드를 받습니다
   */
  const handleEnable = async () => {
    if (!tfaToken || tfaToken.length !== 6) {
      alert("6자리 코드를 입력하세요");
      return;
    }

    setLoading(true);
    try {
      const result = await enable2FA(token!, tfaToken);
      setBackupCodes(result.backupCodes);
      setStep("enabled");
      updateUser({ twoFactorEnabled: true });
      alert("2FA가 활성화되었습니다! 백업 코드를 안전하게 보관하세요.");
    } catch (error: any) {
      alert(error.message || "2FA 활성화 실패");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2FA 비활성화
   * 코드 또는 백업 코드로 검증합니다
   */
  const handleDisable = async () => {
    const code = prompt("2FA 코드 또는 백업 코드를 입력하세요:");
    if (!code) return;

    setLoading(true);
    try {
      await disable2FA(token!, code);
      setStep("disabled");
      setQrCode("");
      setSecret("");
      setBackupCodes([]);
      updateUser({ twoFactorEnabled: false });
      alert("2FA가 비활성화되었습니다.");
    } catch (error: any) {
      alert(error.message || "2FA 비활성화 실패");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 백업 코드 다운로드
   * 텍스트 파일로 저장합니다
   */
  const downloadBackupCodes = () => {
    const text = backupCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">2단계 인증 (2FA)</h2>
      <p className="text-gray-600 mb-4">
        Google Authenticator 또는 다른 TOTP 앱을 사용하여 계정을 보호하세요.
      </p>

      {/* 비활성화 상태 */}
      {step === "disabled" && (
        <div>
          <button
            onClick={handleSetup}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? "처리 중..." : "2FA 활성화 시작"}
          </button>
        </div>
      )}

      {/* 설정 중 */}
      {step === "setup" && (
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">1. QR 코드 스캔</h3>
            <p className="text-sm text-gray-600 mb-2">
              Google Authenticator 앱으로 아래 QR 코드를 스캔하세요:
            </p>
            {qrCode && (
              <img src={qrCode} alt="QR Code" className="w-64 h-64 border" />
            )}
          </div>

          <div>
            <h3 className="font-bold mb-2">2. 시크릿 키 (수동 입력용)</h3>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm break-all block">
              {secret}
            </code>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. 인증 코드 입력</h3>
            <p className="text-sm text-gray-600 mb-2">
              앱에 표시된 6자리 코드를 입력하세요:
            </p>
            <input
              type="text"
              value={tfaToken}
              onChange={(e) =>
                setTfaToken(e.target.value.replace(/\D/g, ""))
              }
              maxLength={6}
              placeholder="000000"
              className="border rounded px-3 py-2 w-32 text-center text-xl font-mono"
            />
          </div>

          <button
            onClick={handleEnable}
            disabled={loading || tfaToken.length !== 6}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            {loading ? "처리 중..." : "2FA 활성화 완료"}
          </button>
        </div>
      )}

      {/* 활성화 상태 */}
      {step === "enabled" && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-green-700 font-bold">✅ 2FA가 활성화되었습니다</p>
          </div>

          {backupCodes.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <h3 className="font-bold mb-2">
                ⚠️ 백업 코드 (한 번만 표시됨)
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                2FA 앱을 사용할 수 없을 때 사용할 수 있는 일회용 코드입니다.
                안전하게 보관하세요!
              </p>
              <div className="bg-white p-3 rounded font-mono text-sm grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <div key={i}>{code}</div>
                ))}
              </div>
              <button
                onClick={downloadBackupCodes}
                className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                백업 코드 다운로드
              </button>
            </div>
          )}

          <button
            onClick={handleDisable}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-300"
          >
            {loading ? "처리 중..." : "2FA 비활성화"}
          </button>
        </div>
      )}
    </div>
  );
}
