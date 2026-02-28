"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Agentation } from "agentation";
import type { ReactNode } from "react";
import { useState } from "react";
import { isRetryableError } from "@/lib/errors/error-messages";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 재시도 로직: 재시도 가능한 에러만 최대 3번 재시도
            retry: (failureCount, error) => {
              // 최대 3번까지만 재시도
              if (failureCount >= 3) return false;

              // 4xx 클라이언트 에러는 재시도 안 함
              // 5xx 서버 에러나 네트워크 에러는 재시도
              return isRetryableError(error);
            },
            // 재시도 지연 시간: 지수 백오프 (1초 → 2초 → 4초, 최대 30초)
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            // 5초 동안 데이터를 fresh로 간주
            staleTime: 5000,
            // 윈도우 포커스 시 자동 리패치
            refetchOnWindowFocus: true,
          },
          mutations: {
            // 뮤테이션은 재시도하지 않음 (데이터 중복 생성 방지)
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <Agentation />}
    </QueryClientProvider>
  );
}
