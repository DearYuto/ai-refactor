"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiBaseUrl } from "@/lib/config";
import { useAuthStore } from "@/lib/store";

export default function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const requestBody: {
        email: string;
        password: string;
        twoFactorToken?: string;
      } = { email, password };

      // 2FA 토큰이 입력된 경우 추가
      if (twoFactorToken) {
        requestBody.twoFactorToken = twoFactorToken;
      }

      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          (data && (data.message || data.error)) || "Login failed.";
        throw new Error(
          typeof message === "string" ? message : "Login failed.",
        );
      }

      // 2FA가 필요한 경우
      if (data?.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setError("2FA 코드를 입력하세요");
        return;
      }

      const token = data?.accessToken ?? null;
      const user = data?.user ?? null;

      if (!token) {
        throw new Error("Login succeeded but no access token returned.");
      }

      // Zustand store에 저장 (localStorage도 자동으로 저장됨)
      if (user) {
        setAuth(token, user);
      } else {
        // user 정보가 없는 경우 localStorage만 저장
        localStorage.setItem("accessToken", token);
      }

      setSuccess("Logged in successfully.");

      // 로그인 성공 후 마켓 페이지로 이동
      setTimeout(() => {
        router.push("/ko/market");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-4"
      data-testid="login-form"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[var(--color-text-main)]"
          htmlFor="email"
        >
          Email
        </label>
        <input
          data-testid="login-email"
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-main)] shadow-sm outline-none transition focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[var(--color-text-main)]"
          htmlFor="password"
        >
          Password
        </label>
        <input
          data-testid="login-password"
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-main)] shadow-sm outline-none transition focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
        />
      </div>

      {requiresTwoFactor && (
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-[var(--color-text-main)]"
            htmlFor="twoFactorToken"
          >
            2FA 코드 (6자리)
          </label>
          <input
            data-testid="login-2fa-token"
            id="twoFactorToken"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={twoFactorToken}
            onChange={(event) =>
              setTwoFactorToken(event.target.value.replace(/\D/g, ""))
            }
            className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-center text-xl font-mono text-[var(--color-text-main)] shadow-sm outline-none transition focus:border-[var(--color-brand-500)] focus:ring-2 focus:ring-[var(--color-brand-100)]"
          />
          <p className="text-xs text-[var(--color-text-subtle)]">
            Google Authenticator 앱에 표시된 6자리 코드를 입력하세요
          </p>
        </div>
      )}

      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
          data-testid="login-error"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
          data-testid="login-success"
        >
          {success}
        </div>
      ) : null}

      <button
        data-testid="login-submit"
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-700)] px-4 py-2 text-sm font-medium text-white shadow-[0_10px_28px_-14px_rgba(58,141,255,0.8)] transition hover:from-[var(--color-brand-300)] hover:to-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
