"use client";

import { useEffect, useState } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { MARKET_SOURCE, type MarketSource } from "@/lib/api/market.types";
import { useOrders } from "@/lib/hooks/useOrders";
import { useBalances } from "@/lib/hooks/useBalances";
import { useMarketOrderStore } from "@/lib/store";
import type { OrderSide, OrderType, OrderRecord } from "@/lib/api/orders.api";
import { formatNumeric } from "@repo/utils";

type OrderEntrySectionProps = {
  source: MarketSource;
  currentPrice: number | null;
};

const formatValue = (value: number | null, maximumFractionDigits: number) => {
  if (value === null) return "--";
  return formatNumeric(value, { maximumFractionDigits });
};

const formatTime = (timestamp: string) => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const STATUS_BADGE: Record<string, string> = {
  filled: "text-emerald-400",
  open: "text-amber-400",
  cancelled: "text-[var(--color-text-sub)]",
};

const RATIO_STEPS = [25, 50, 75, 100] as const;

type OrderTab = "open" | "history";

export const OrderEntrySection = ({
  source,
  currentPrice,
}: OrderEntrySectionProps) => {
  const [side, setSide] = useState<OrderSide>("buy");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [orderTab, setOrderTab] = useState<OrderTab>("open");

  const { selectedOrderPrice, setSelectedOrderPrice } = useMarketOrderStore();
  const { balances } = useBalances();

  const {
    orders,
    isLoading,
    error,
    isSubmitting,
    submitError,
    placeOrder,
    cancelOrder,
    resetSubmission,
  } = useOrders();

  const quoteAsset = source === MARKET_SOURCE.UPBIT ? "KRW" : "USDT";
  const baseAsset = "BTC";

  const availableQuote =
    Number(balances?.find((b) => b.asset === quoteAsset)?.available ?? 0);
  const availableBase =
    Number(balances?.find((b) => b.asset === baseAsset)?.available ?? 0);

  const parsedSize = Number(size);
  const parsedLimitPrice = Number(limitPrice);
  const effectivePrice =
    orderType === "limit" ? parsedLimitPrice : (currentPrice ?? 0);

  const sizeIsValid = Number.isFinite(parsedSize) && parsedSize > 0;
  const limitPriceIsValid =
    orderType === "market" ||
    (Number.isFinite(parsedLimitPrice) && parsedLimitPrice > 0);

  const estimatedTotal = sizeIsValid ? parsedSize * effectivePrice : 0;

  const insufficientBalance =
    sizeIsValid &&
    (side === "buy"
      ? estimatedTotal > availableQuote
      : parsedSize > availableBase);

  const isSubmitDisabled =
    !sizeIsValid || !limitPriceIsValid || isSubmitting || insufficientBalance;

  // 오더북 클릭 시 가격 자동 입력 + Limit 전환
  useEffect(() => {
    if (selectedOrderPrice !== null) {
      setLimitPrice(String(selectedOrderPrice));
      setOrderType("limit");
      setSelectedOrderPrice(null);
    }
  }, [selectedOrderPrice, setSelectedOrderPrice]);

  const reset = () => {
    setSize("");
    setLimitPrice("");
    setSuccess(null);
    resetSubmission();
  };

  const handleSideChange = (newSide: OrderSide) => {
    setSide(newSide);
    resetSubmission();
    setSuccess(null);
  };

  const handleOrderTypeChange = (newType: OrderType) => {
    setOrderType(newType);
    resetSubmission();
    setSuccess(null);
  };

  const handleRatioClick = (ratio: number) => {
    if (effectivePrice <= 0) return;
    const maxSize =
      side === "buy" ? availableQuote / effectivePrice : availableBase;
    const target = (maxSize * ratio) / 100;
    setSize(String(Math.floor(target * 1e6) / 1e6));
    resetSubmission();
    setSuccess(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    resetSubmission();

    if (!sizeIsValid || !limitPriceIsValid || insufficientBalance) return;

    try {
      const order = await placeOrder({
        side,
        type: orderType,
        size: parsedSize,
        price: orderType === "limit" ? parsedLimitPrice : undefined,
        source,
      });
      const verb = order.status === "filled" ? "Filled" : "Placed";
      setSuccess(`${verb} ${order.type} ${order.side} ${order.size} ${order.baseAsset}.`);
      setSize("");
    } catch {
      setSuccess(null);
    }
  };

  const openOrders = orders?.filter((o) => o.status === "open") ?? [];
  const historyOrders =
    orders?.filter((o) => o.status === "filled" || o.status === "cancelled") ??
    [];

  const displayedOrders: OrderRecord[] =
    orderTab === "open" ? openOrders : historyOrders;

  return (
    <SurfaceCard
      className="grid gap-6 rounded-2xl p-6"
      data-testid="order-entry-section"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text-main)]">
          Order Entry
        </h2>
        <span className="text-xs text-[var(--color-text-sub)]">
          {baseAsset}/{quoteAsset}
        </span>
      </div>

      <form
        className="grid gap-4"
        data-testid="order-entry-form"
        onSubmit={handleSubmit}
      >
        {/* 주문 유형 탭 */}
        <div className="flex items-center gap-1 rounded-lg bg-[var(--color-surface-muted)] p-1">
          {(["market", "limit"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleOrderTypeChange(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                orderType === t
                  ? "bg-[var(--color-border-strong)] text-[var(--color-text-main)]"
                  : "text-[var(--color-text-sub)] hover:text-[var(--color-text-main)]"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Buy / Sell 토글 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="order-side-buy"
            onClick={() => handleSideChange("buy")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              side === "buy"
                ? "bg-[var(--color-buy)] text-[var(--color-surface-1)] ring-1 ring-[var(--color-buy-border)]"
                : "bg-[var(--color-surface-muted)] text-[var(--color-buy)]"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            data-testid="order-side-sell"
            onClick={() => handleSideChange("sell")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              side === "sell"
                ? "bg-[var(--color-sell)] text-[var(--color-surface-1)] ring-1 ring-[var(--color-sell-border)]"
                : "bg-[var(--color-surface-muted)] text-[var(--color-sell)]"
            }`}
          >
            Sell
          </button>
        </div>

        {/* 가격 입력 (Limit only) */}
        {orderType === "limit" && (
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
              Price ({quoteAsset})
            </span>
            <input
              type="number"
              data-testid="order-price-input"
              min="0"
              step="0.01"
              value={limitPrice}
              onChange={(e) => {
                setLimitPrice(e.target.value);
                resetSubmission();
                setSuccess(null);
              }}
              placeholder={currentPrice ? String(currentPrice) : "0.00"}
              className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-main)] outline-none transition focus:border-[var(--color-brand-500)]"
            />
          </label>
        )}

        {/* 수량 입력 */}
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
            Size ({baseAsset})
          </span>
          <input
            type="number"
            data-testid="order-size-input"
            min="0"
            step="0.0001"
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              resetSubmission();
              setSuccess(null);
            }}
            placeholder="0.00"
            className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-main)] outline-none transition focus:border-[var(--color-brand-500)]"
          />
        </label>

        {/* 비율 버튼 */}
        <div className="flex gap-1.5">
          {RATIO_STEPS.map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => handleRatioClick(ratio)}
              className="flex-1 rounded-md bg-[var(--color-surface-muted)] px-2 py-1 text-xs text-[var(--color-text-sub)] transition hover:bg-[var(--color-border-soft)] hover:text-[var(--color-text-main)]"
            >
              {ratio === 100 ? "MAX" : `${ratio}%`}
            </button>
          ))}
        </div>

        {/* 예상 체결금액 */}
        <div className="flex items-center justify-between text-xs text-[var(--color-text-sub)]">
          <span>Est. Total</span>
          <span>
            {sizeIsValid && effectivePrice > 0
              ? `${formatValue(estimatedTotal, 2)} ${quoteAsset}`
              : "--"}
          </span>
        </div>

        {/* 잔고 */}
        <div className="flex items-center justify-between text-xs text-[var(--color-text-sub)]">
          <span>Available</span>
          <span>
            {side === "buy"
              ? `${formatValue(availableQuote, 2)} ${quoteAsset}`
              : `${formatValue(availableBase, 6)} ${baseAsset}`}
          </span>
        </div>

        {/* 유효성 메시지 */}
        {!sizeIsValid && size.length ? (
          <p className="text-xs text-amber-300">Enter a valid order size.</p>
        ) : null}

        {orderType === "limit" && !limitPriceIsValid && limitPrice.length ? (
          <p className="text-xs text-amber-300">Enter a valid limit price.</p>
        ) : null}

        {insufficientBalance ? (
          <p className="text-xs text-red-400">Insufficient balance.</p>
        ) : null}

        {submitError ? (
          <p className="text-sm text-red-400" data-testid="order-submit-error">
            {submitError}
          </p>
        ) : null}

        {success ? (
          <p
            className="text-sm text-emerald-300"
            data-testid="order-submit-success"
          >
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          data-testid="order-submit"
          disabled={isSubmitDisabled}
          className="rounded-lg bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-700)] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_28px_-14px_var(--color-brand-400)] transition hover:from-[var(--color-brand-300)] hover:to-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? "Submitting..."
            : `Place ${orderType} order`}
        </button>
      </form>

      {/* 주문 목록 탭 */}
      <div className="grid gap-3" data-testid="recent-orders-section">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-soft)] pb-2">
          {(["open", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setOrderTab(tab)}
              className={`text-xs font-medium transition ${
                orderTab === tab
                  ? "text-[var(--color-text-main)] underline underline-offset-4"
                  : "text-[var(--color-text-sub)] hover:text-[var(--color-text-main)]"
              }`}
            >
              {tab === "open"
                ? `Open Orders (${openOrders.length})`
                : "History"}
            </button>
          ))}
          <span className="ml-auto text-xs text-[var(--color-text-sub)]">
            {isLoading ? "Syncing..." : ""}
          </span>
        </div>

        {isLoading ? (
          <p
            className="text-sm text-[var(--color-text-sub)]"
            data-testid="recent-orders-loading"
          >
            Loading orders...
          </p>
        ) : error ? (
          <p className="text-sm text-red-400" data-testid="recent-orders-error">
            {error}
          </p>
        ) : displayedOrders.length ? (
          <ul className="space-y-2" data-testid="recent-orders-list">
            {displayedOrders.map((order) => (
              <li
                key={order.id}
                className="grid gap-1.5 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2.5 text-xs text-[var(--color-text-sub)]"
                data-testid="recent-order-item"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        order.side === "buy"
                          ? "text-emerald-300"
                          : "text-rose-300"
                      }`}
                    >
                      {order.side.toUpperCase()}
                    </span>
                    <span className="rounded bg-[var(--color-border-soft)] px-1 py-0.5 text-[10px] uppercase tracking-wide">
                      {order.type}
                    </span>
                    <span
                      className={`text-[10px] font-medium uppercase ${STATUS_BADGE[order.status] ?? ""}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <span>{formatTime(order.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>
                    {formatValue(order.size, 6)} {order.baseAsset}
                  </span>
                  <span>
                    @{" "}
                    {order.filledPrice !== null
                      ? formatValue(order.filledPrice, 2)
                      : order.price !== null
                        ? formatValue(order.price, 2)
                        : "--"}{" "}
                    {order.quoteAsset}
                  </span>
                </div>

                {order.notional !== null && (
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <span>
                      {formatValue(order.notional, 2)} {order.quoteAsset}
                    </span>
                  </div>
                )}

                {order.status === "open" && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await cancelOrder(order.id);
                      } catch {
                        // 에러는 mutation 레벨에서 처리
                      }
                    }}
                    className="mt-0.5 self-end rounded-md border border-[var(--color-sell-border)] px-2 py-1 text-[10px] font-medium text-[var(--color-sell)] transition hover:bg-[var(--color-sell-bg)]"
                  >
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="text-sm text-[var(--color-text-sub)]"
            data-testid="recent-orders-empty"
          >
            {orderTab === "open" ? "No open orders." : "No order history."}
          </p>
        )}
      </div>
    </SurfaceCard>
  );
};
