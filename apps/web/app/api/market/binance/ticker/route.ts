import { NextRequest } from "next/server";
import { BINANCE_TICKER_BASE_URL } from "@/lib/server/market-endpoints";
const DEFAULT_SYMBOL = "BTCUSDT";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? DEFAULT_SYMBOL).toUpperCase();

  const url = new URL(BINANCE_TICKER_BASE_URL);
  url.searchParams.set("symbol", symbol);

  try {
    const response = await fetch(url, { next: { revalidate: 2 } });

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch ticker" },
        { status: response.status },
      );
    }

    const data = (await response.json()) as {
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
      quoteVolume: string;
    };

    return Response.json({
      symbol: data.symbol,
      price: data.lastPrice,
      change24h: data.priceChangePercent,
      volume24h: data.quoteVolume,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
