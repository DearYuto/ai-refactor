import { NextRequest } from "next/server";
import { BINANCE_KLINES_BASE_URL } from "@/lib/server/market-endpoints";
const DEFAULT_SYMBOL = "BTCUSDT";
const DEFAULT_INTERVAL = "1m";
const DEFAULT_LIMIT = 200;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? DEFAULT_SYMBOL;
  const interval = searchParams.get("interval") ?? DEFAULT_INTERVAL;
  const limitParam = searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.floor(parsedLimit), 1), 1000)
    : DEFAULT_LIMIT;

  const url = new URL(BINANCE_KLINES_BASE_URL);
  url.searchParams.set("symbol", symbol.toUpperCase());
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));

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
