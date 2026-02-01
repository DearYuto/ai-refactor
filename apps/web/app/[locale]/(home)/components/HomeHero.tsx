"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const HomeHero = () => {
  const t = useTranslations("home");

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs uppercase tracking-[0.35em] text-[var(--color-text-sub)]">
        {t("hero.eyebrow")}
      </p>
      <h1 className="text-4xl font-semibold leading-tight text-[var(--color-text-main)] sm:text-5xl">
        {t("hero.title")}
      </h1>
      <p className="max-w-xl text-base leading-7 text-[var(--color-text-sub)]">
        {t("hero.description")}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-700)] px-6 text-sm font-semibold text-white shadow-[0_10px_28px_-14px_rgba(58,141,255,0.8)] transition hover:from-[var(--color-brand-300)] hover:to-[var(--color-brand-500)]"
          href="/market"
        >
          {t("hero.primaryCta")}
        </Link>
        <Link
          className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-6 text-sm font-semibold text-[var(--color-text-main)] transition hover:border-[var(--color-brand-500)]"
          href="/login"
        >
          {t("hero.secondaryCta")}
        </Link>
      </div>
    </div>
  );
};
