import { NextRequest } from "next/server";
import { UPBIT_ORDERBOOK_BASE_URL } from "@/lib/server/market-endpoints";
const DEFAULT_MARKET = "KRW-BTC";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const market = (searchParams.get("market") ?? DEFAULT_MARKET).toUpperCase();

  const url = new URL(UPBIT_ORDERBOOK_BASE_URL);
  url.searchParams.set("markets", market);

  try {
    const response = await fetch(url, { next: { revalidate: 2 } });

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch orderbook" },
        { status: response.status },
      );
    }

    const payload = (await response.json()) as Array<{
      orderbook_units: Array<{
        ask_price: number;
        ask_size: number;
        bid_price: number;
        bid_size: number;
      }>;
    }>;

    const data = payload[0];
    if (!data) {
      return Response.json({ error: "No data" }, { status: 404 });
    }

    return Response.json({
      bids: data.orderbook_units.map((unit) => ({
        price: unit.bid_price,
        size: unit.bid_size,
      })),
      asks: data.orderbook_units.map((unit) => ({
        price: unit.ask_price,
        size: unit.ask_size,
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
