"use client";

import { useState } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { MARKET_SOURCE, type MarketSource } from "@/lib/api/market.types";
import { useOrders } from "@/lib/hooks/useOrders";
import type { OrderSide } from "@/lib/api/orders.api";
import { formatNumeric } from "@repo/utils";

type OrderEntrySectionProps = {
  source: MarketSource;
};

const formatValue = (value: number, maximumFractionDigits: number) =>
  formatNumeric(value, { maximumFractionDigits });

const formatTime = (timestamp: string) => {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return parsed.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const OrderEntrySection = ({ source }: OrderEntrySectionProps) => {
  const [side, setSide] = useState<OrderSide>("buy");
  const [size, setSize] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const {
    orders,
    isLoading,
    error,
    isSubmitting,
    submitError,
    placeOrder,
    resetSubmission,
  } = useOrders();

  const parsedSize = Number(size);
  const sizeIsValid = Number.isFinite(parsedSize) && parsedSize > 0;
  const isSubmitDisabled = !sizeIsValid || isSubmitting;
  const quoteAsset = source === MARKET_SOURCE.UPBIT ? "KRW" : "USDT";
  const baseAsset = "BTC";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);
    resetSubmission();

    if (!sizeIsValid) {
      return;
    }

    try {
      const order = await placeOrder({
        side,
        size: parsedSize,
        source,
      });
      setSuccess(`Filled ${order.side} ${order.size} ${order.baseAsset}.`);
      setSize("");
    } catch {
      setSuccess(null);
    }
  };

  return (
    <SurfaceCard
      className="grid gap-6 rounded-2xl p-6"
      data-testid="order-entry-section"
    >
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="order-side-buy"
            onClick={() => {
              setSide("buy");
              resetSubmission();
              setSuccess(null);
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              side === "buy"
                ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/50"
                : "bg-[var(--color-surface-muted)] text-[var(--color-text-sub)]"
            }`}
          >
            Buy
          </button>
          <button
            type="button"
            data-testid="order-side-sell"
            onClick={() => {
              setSide("sell");
              resetSubmission();
              setSuccess(null);
            }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
              side === "sell"
                ? "bg-rose-500/20 text-rose-200 ring-1 ring-rose-400/50"
                : "bg-[var(--color-surface-muted)] text-[var(--color-text-sub)]"
            }`}
          >
            Sell
          </button>
        </div>

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
            onChange={(event) => {
              setSize(event.target.value);
              resetSubmission();
              setSuccess(null);
            }}
            placeholder="0.00"
            className="w-full rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-main)] outline-none transition focus:border-[var(--color-brand-500)]"
          />
        </label>

        {!sizeIsValid && size.length ? (
          <p className="text-xs text-amber-300">Enter a valid order size.</p>
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
          className="rounded-lg bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-700)] px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_28px_-14px_rgba(58,141,255,0.8)] transition hover:from-[var(--color-brand-300)] hover:to-[var(--color-brand-500)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Place market order"}
        </button>
      </form>

      <div className="grid gap-3" data-testid="recent-orders-section">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[var(--color-text-sub)]">
          <span>Recent Orders</span>
          <span>{isLoading ? "Syncing" : "Updated"}</span>
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
        ) : orders?.length ? (
          <ul className="space-y-2" data-testid="recent-orders-list">
            {orders.map((order) => (
              <li
                key={order.id}
                className="grid gap-1 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-text-sub)]"
                data-testid="recent-order-item"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      order.side === "buy"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {order.side.toUpperCase()} {order.baseAsset}
                  </span>
                  <span>{formatTime(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    Size: {formatValue(order.size, 6)} {order.baseAsset}
                  </span>
                  <span>
                    Price: {formatValue(order.price, 2)} {order.quoteAsset}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    Notional: {formatValue(order.notional, 2)}{" "}
                    {order.quoteAsset}
                  </span>
                  <span className="text-[var(--color-text-sub)]">
                    {order.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="text-sm text-[var(--color-text-sub)]"
            data-testid="recent-orders-empty"
          >
            No orders yet.
          </p>
        )}
      </div>
    </SurfaceCard>
  );
};
