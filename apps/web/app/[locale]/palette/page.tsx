"use client";

import { PageShell } from "@/components/layout/page-shell";

const palette = [
  {
    title: "Primary",
    description: "Brand blue tokens",
    swatches: [
      { label: "brand-300", value: "var(--color-brand-300)" },
      { label: "brand-500", value: "var(--color-brand-500)" },
      { label: "brand-700", value: "var(--color-brand-700)" },
    ],
  },
  {
    title: "Surface",
    description: "Background and cards",
    swatches: [
      { label: "bg-main", value: "var(--color-bg-main)" },
      { label: "surface", value: "var(--color-surface)" },
      { label: "surface-muted", value: "var(--color-surface-muted)" },
    ],
  },
  {
    title: "Text",
    description: "Main and muted text",
    swatches: [
      { label: "text-main", value: "var(--color-text-main)" },
      { label: "text-sub", value: "var(--color-text-sub)" },
      { label: "text-muted", value: "var(--color-text-muted)" },
    ],
  },
  {
    title: "Borders",
    description: "Default border tokens",
    swatches: [
      { label: "border-soft", value: "var(--color-border-soft)" },
      { label: "border-strong", value: "var(--color-border-strong)" },
    ],
  },
  {
    title: "Buy / Sell",
    description: "Current action colors",
    swatches: [
      { label: "buy", value: "#10b981" },
      { label: "sell", value: "#f43f5e" },
    ],
  },
  {
    title: "Ring",
    description: "Focus and selection",
    swatches: [
      { label: "brand-100", value: "var(--color-brand-100)" },
      { label: "brand-200", value: "var(--color-brand-200)" },
    ],
  },
];

const SwatchCard = ({
  title,
  description,
  swatches,
}: {
  title: string;
  description: string;
  swatches: { label: string; value: string }[];
}) => {
  return (
    <section className="rounded-3xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text-main)]">
            {title}
          </h2>
          <p className="text-xs text-[var(--color-text-sub)]">{description}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {swatches.map((swatch) => (
          <div
            key={swatch.label}
            className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3"
          >
            <div
              className="h-10 w-10 rounded-xl border border-[var(--color-border-soft)]"
              style={{ background: swatch.value }}
            />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-main)]">
                {swatch.label}
              </p>
              <p className="text-xs text-[var(--color-text-sub)]">
                {swatch.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default function PalettePage() {
  return (
    <PageShell>
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-sub)]">
            Design Tokens
          </p>
          <h1 className="text-3xl font-semibold text-[var(--color-text-main)]">
            Palette Preview
          </h1>
          <p className="text-sm text-[var(--color-text-sub)]">
            Temporary page for validating theme harmony.
          </p>
        </header>

        <div className="mt-10 grid gap-6">
          {palette.map((section) => (
            <SwatchCard key={section.title} {...section} />
          ))}
        </div>
      </main>
    </PageShell>
  );
}
