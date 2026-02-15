export const ASSETS = {
  BTC: 'BTC',
  KRW: 'KRW',
  USDT: 'USDT',
} as const;

export const DEFAULT_BASE_ASSET = ASSETS.BTC;

export const QUOTE_ASSET_BY_SOURCE = {
  UPBIT: ASSETS.KRW,
  BINANCE: ASSETS.USDT,
} as const;

export const DEFAULT_BALANCES = [
  { asset: ASSETS.KRW, available: 1_000_000 },
  { asset: ASSETS.BTC, available: 0.5 },
  { asset: ASSETS.USDT, available: 2_000 },
] as const;
