import { formatNumeric } from "@repo/utils";
import { MARKET_SOURCE, type MarketSource } from "@/lib/api/market.types";

const formatValue = (value: string | number, maximumFractionDigits: number) =>
  String(formatNumeric(value, { maximumFractionDigits }));

export const formatPrice = (value: string | number, source: MarketSource) => {
  if (source === MARKET_SOURCE.UPBIT) {
    return `${formatValue(value, 0)} KRW`;
  }

  return `${formatValue(value, 2)} USDT`;
};

export const formatVolume = (value: string | number, source: MarketSource) =>
  source === MARKET_SOURCE.UPBIT
    ? `${formatValue(value, 0)} KRW`
    : `${formatValue(value, 2)} USDT`;

export const formatSize = (value: string | number) => formatValue(value, 6);

export const formatPercent = (value: string | number) =>
  `${formatValue(value, 2)}%`;
