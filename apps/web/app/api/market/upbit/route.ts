import { NextRequest } from "next/server";
import {
  marketIntervalUpbitMinutes,
  type MarketInterval,
} from "@/lib/api/market";

const UPBIT_BASE_URL = "https://api.upbit.com/v1/candles/minutes";
const DEFAULT_MARKET = "KRW-BTC";
const DEFAULT_COUNT = 200;
const DEFAULT_INTERVAL: MarketInterval = "1m";

const parseInterval = (value: string | null): MarketInterval => {
  switch (value) {
    case "1m":
    case "5m":
    case "15m":
    case "1h":
      return value;
    default:
      return DEFAULT_INTERVAL;
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market") ?? DEFAULT_MARKET;
  const countParam = searchParams.get("count");
  const interval = parseInterval(searchParams.get("interval"));
  const parsedCount = countParam ? Number(countParam) : DEFAULT_COUNT;
  const count = Number.isFinite(parsedCount)
    ? Math.min(Math.max(Math.floor(parsedCount), 1), 200)
    : DEFAULT_COUNT;

  const url = new URL(
    `${UPBIT_BASE_URL}/${marketIntervalUpbitMinutes(interval)}`,
  );
  url.searchParams.set("market", market.toUpperCase());
  url.searchParams.set("count", String(count));

  try {
    const response = await fetch(url, {
      next: { revalidate: 5 },
    });

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch market data" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
