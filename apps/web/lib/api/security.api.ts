import { customFetch } from "@/lib/api/fetcher";

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string; // Data URL
}

export interface BackupCodesResponse {
  backupCodes: string[];
}

export interface BackupCode {
  code: string;
  used: boolean;
  usedAt: string | null;
}

type FetchResponse<TData> = {
  data: TData;
  status: number;
  headers: Headers;
};

/**
 * 2FA 설정 시작
 * QR 코드와 시크릿 키를 받아옵니다
 */
export async function setup2FA(token: string): Promise<TwoFactorSetupResponse> {
  const response = await customFetch<FetchResponse<TwoFactorSetupResponse>>(
    "/auth/2fa/setup",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

/**
 * 2FA 활성화
 * TOTP 토큰으로 검증 후 활성화하고 백업 코드를 받습니다
 */
export async function enable2FA(
  token: string,
  tfaToken: string
): Promise<BackupCodesResponse> {
  const response = await customFetch<FetchResponse<BackupCodesResponse>>(
    "/auth/2fa/enable",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: tfaToken }),
    }
  );
  return response.data;
}

/**
 * 2FA 비활성화
 * TOTP 토큰 또는 백업 코드로 검증 후 비활성화합니다
 */
export async function disable2FA(
  token: string,
  tfaToken: string
): Promise<{ success: boolean }> {
  const response = await customFetch<FetchResponse<{ success: boolean }>>(
    "/auth/2fa/disable",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: tfaToken }),
    }
  );
  return response.data;
}

/**
 * 백업 코드 조회
 * 현재 사용자의 백업 코드 목록을 가져옵니다
 */
export async function getBackupCodes(token: string): Promise<BackupCode[]> {
  const response = await customFetch<FetchResponse<BackupCode[]>>(
    "/auth/2fa/backup-codes",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

/**
 * 백업 코드 재생성
 * 기존 백업 코드를 무효화하고 새로운 코드를 생성합니다
 */
export async function regenerateBackupCodes(
  token: string
): Promise<BackupCodesResponse> {
  const response = await customFetch<FetchResponse<BackupCodesResponse>>(
    "/auth/2fa/backup-codes/regenerate",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

/**
 * 이메일 인증 요청
 * 사용자 이메일로 인증 링크를 발송합니다
 */
export async function sendVerificationEmail(
  token: string
): Promise<{ success: boolean; message: string }> {
  const response = await customFetch<
    FetchResponse<{ success: boolean; message: string }>
  >("/auth/email/send-verification", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/**
 * 이메일 인증 확인
 * 이메일로 받은 토큰으로 이메일 주소를 인증합니다
 */
export async function verifyEmail(
  verificationToken: string
): Promise<{ success: boolean; message: string }> {
  const response = await customFetch<
    FetchResponse<{ success: boolean; message: string }>
  >(`/auth/email/verify?token=${verificationToken}`, {
    method: "GET",
  });
  return response.data;
}
