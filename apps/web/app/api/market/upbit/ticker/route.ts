import { NextRequest } from "next/server";
import { UPBIT_TICKER_BASE_URL } from "@/lib/server/market-endpoints";
const DEFAULT_MARKET = "KRW-BTC";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const market = (searchParams.get("market") ?? DEFAULT_MARKET).toUpperCase();

  const url = new URL(UPBIT_TICKER_BASE_URL);
  url.searchParams.set("markets", market);

  try {
    const response = await fetch(url, { next: { revalidate: 2 } });

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch ticker" },
        { status: response.status },
      );
    }

    const payload = (await response.json()) as Array<{
      market: string;
      trade_price: number;
      signed_change_rate: number;
      acc_trade_price_24h: number;
    }>;

    const data = payload[0];
    if (!data) {
      return Response.json({ error: "No data" }, { status: 404 });
    }

    return Response.json({
      symbol: data.market,
      price: data.trade_price,
      change24h: (data.signed_change_rate * 100).toFixed(2),
      volume24h: data.acc_trade_price_24h,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
