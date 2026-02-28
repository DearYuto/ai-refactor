/**
 * 에러 코드별 한국어 메시지 매핑
 * 백엔드 에러 응답 형식과 동기화되어야 합니다
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // 인증/권한 에러
  UNAUTHORIZED: "로그인이 필요합니다",
  FORBIDDEN: "권한이 없습니다",

  // 주문 관련 에러
  INSUFFICIENT_BALANCE: "잔고가 부족합니다",
  INVALID_ORDER: "잘못된 주문입니다",
  ORDER_NOT_FOUND: "주문을 찾을 수 없습니다",

  // 시스템 에러
  RATE_LIMIT_EXCEEDED: "요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요",
  INTERNAL_SERVER_ERROR: "서버 오류가 발생했습니다",
  BAD_REQUEST: "잘못된 요청입니다",
  NOT_FOUND: "요청한 리소스를 찾을 수 없습니다",

  // 네트워크 에러
  NETWORK_ERROR: "네트워크 연결을 확인해주세요",
  TIMEOUT_ERROR: "요청 시간이 초과되었습니다",
};

/**
 * 에러 객체에서 사용자 친화적인 메시지를 추출합니다
 *
 * @param error - API 에러 객체 또는 Error 인스턴스
 * @returns 한국어 에러 메시지
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return "알 수 없는 오류가 발생했습니다";

  // Error 인스턴스인 경우
  if (error instanceof Error) {
    // 메시지에서 에러 코드 추출 시도
    const message = error.message;

    // 메시지가 에러 코드와 일치하는지 확인
    if (ERROR_MESSAGES[message]) {
      return ERROR_MESSAGES[message];
    }

    // 원본 메시지 반환
    return message || "알 수 없는 오류가 발생했습니다";
  }

  // Axios/Fetch 에러 형식 처리
  const apiError = error as any;

  // 응답에서 에러 코드 추출
  const errorCode =
    apiError?.response?.data?.error ||
    apiError?.response?.data?.code ||
    apiError?.code;

  if (errorCode && ERROR_MESSAGES[errorCode]) {
    return ERROR_MESSAGES[errorCode];
  }

  // 응답에서 메시지 추출
  const errorMessage =
    apiError?.response?.data?.message ||
    apiError?.message;

  if (errorMessage && typeof errorMessage === 'string') {
    return errorMessage;
  }

  // HTTP 상태 코드별 기본 메시지
  const status = apiError?.response?.status;
  if (status) {
    if (status === 401) return ERROR_MESSAGES.UNAUTHORIZED;
    if (status === 403) return ERROR_MESSAGES.FORBIDDEN;
    if (status === 404) return ERROR_MESSAGES.NOT_FOUND;
    if (status === 429) return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    if (status >= 500) return ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
    if (status >= 400) return ERROR_MESSAGES.BAD_REQUEST;
  }

  return "알 수 없는 오류가 발생했습니다";
}

/**
 * 에러가 네트워크 에러인지 확인합니다
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('network') ||
           error.message.includes('timeout') ||
           error.message.includes('fetch failed');
  }
  return false;
}

/**
 * 에러가 재시도 가능한지 확인합니다
 * 4xx 클라이언트 에러는 재시도하지 않습니다
 */
export function isRetryableError(error: unknown): boolean {
  const apiError = error as any;
  const status = apiError?.response?.status;

  // 4xx 에러는 재시도 불가
  if (status && status >= 400 && status < 500) {
    return false;
  }

  // 네트워크 에러나 5xx 서버 에러는 재시도 가능
  return isNetworkError(error) || (status && status >= 500);
}
