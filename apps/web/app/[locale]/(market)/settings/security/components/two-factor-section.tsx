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
    const content = `
암호화폐 거래소 2FA 백업 코드
생성 날짜: ${new Date().toLocaleString('ko-KR')}
이메일: ${user?.email || ''}

백업 코드:
${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

⚠️ 이 코드는 안전한 곳에 보관하세요.
⚠️ 타인에게 노출되지 않도록 주의하세요.
⚠️ 각 코드는 한 번만 사용할 수 있습니다.
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * 백업 코드 인쇄
   * 새 창에서 인쇄 대화상자를 엽니다
   */
  const printBackupCodes = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도하세요.');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>2FA 백업 코드</title>
        <style>
          body {
            font-family: 'Malgun Gothic', sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            text-align: center;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .meta {
            text-align: center;
            color: #6b7280;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .codes {
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .code {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            margin: 12px 0;
            padding: 8px;
            background: white;
            border-radius: 4px;
          }
          .warning {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin-top: 30px;
            color: #991b1b;
          }
          .warning-title {
            font-weight: bold;
            margin-bottom: 10px;
          }
          .warning ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .warning li {
            margin: 5px 0;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>🔐 암호화폐 거래소 2FA 백업 코드</h1>
        <div class="meta">
          <p><strong>생성 날짜:</strong> ${new Date().toLocaleString('ko-KR')}</p>
          <p><strong>이메일:</strong> ${user?.email || ''}</p>
        </div>

        <div class="codes">
          <h3 style="margin-top: 0; color: #374151;">백업 코드</h3>
          ${backupCodes.map((code, i) => `
            <div class="code">${i + 1}. ${code}</div>
          `).join('')}
        </div>

        <div class="warning">
          <div class="warning-title">⚠️ 중요 안내사항</div>
          <ul>
            <li>이 코드는 안전한 곳에 보관하세요.</li>
            <li>타인에게 노출되지 않도록 주의하세요.</li>
            <li>각 코드는 한 번만 사용할 수 있습니다.</li>
            <li>2FA 앱을 사용할 수 없을 때 로그인 시 사용할 수 있습니다.</li>
          </ul>
        </div>

        <script>
          window.onload = () => {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
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
              <div className="mt-3 flex gap-2">
                <button
                  onClick={downloadBackupCodes}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  💾 백업 코드 다운로드
                </button>
                <button
                  onClick={printBackupCodes}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                  🖨️ 백업 코드 인쇄
                </button>
              </div>
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
