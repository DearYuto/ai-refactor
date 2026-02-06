import { NextRequest } from "next/server";
import { BINANCE_ORDERBOOK_BASE_URL } from "@/lib/server/market-endpoints";
const DEFAULT_SYMBOL = "BTCUSDT";
const DEFAULT_LIMIT = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? DEFAULT_SYMBOL).toUpperCase();
  const limitParam = searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : DEFAULT_LIMIT;
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.floor(parsedLimit), 5), 100)
    : DEFAULT_LIMIT;

  const url = new URL(BINANCE_ORDERBOOK_BASE_URL);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("limit", String(limit));

  try {
    const response = await fetch(url, { next: { revalidate: 2 } });

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch orderbook" },
        { status: response.status },
      );
    }

    const data = (await response.json()) as {
      bids: [string, string][];
      asks: [string, string][];
    };

    return Response.json({
      bids: data.bids.map(([price, size]) => ({ price, size })),
      asks: data.asks.map(([price, size]) => ({ price, size })),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
