import { apiBaseUrl } from "@/lib/config";

type OrvalResponse<TData> = {
  data: TData;
  status: number;
  headers: Headers;
};

export const customFetch = async <TResponse extends OrvalResponse<unknown>>(
  url: string,
  options: RequestInit = {},
): Promise<TResponse> => {
  const headers = new Headers(options.headers ?? {});
  const hasAuthorization =
    headers.has("Authorization") || headers.has("authorization");

  if (!hasAuthorization && typeof window !== "undefined") {
    const token = window.localStorage.getItem("accessToken");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${apiBaseUrl}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let message = `Request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed.message === "string") message = parsed.message;
    } catch {
      // use default message
    }
    throw new Error(message);
  }

  const body = [204, 205, 304].includes(response.status)
    ? null
    : await response.text();
  const data = body
    ? (JSON.parse(body) as TResponse["data"])
    : ({} as TResponse["data"]);

  return {
    data,
    status: response.status,
    headers: response.headers,
  } as TResponse;
};
