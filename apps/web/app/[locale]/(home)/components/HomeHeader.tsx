"use client";

import type { ChangeEvent } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

export const HomeHeader = () => {
  const t = useTranslations("home");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;

    if (nextLocale === locale) {
      return;
    }

    router.push(pathname, { locale: nextLocale });
  };

  return (
    <header className="flex items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[0_10px_30px_-20px_rgba(31,94,219,0.35)]">
          <Image
            src="/bito_logo.png"
            alt="Bito"
            fill
            sizes="44px"
            className="object-contain"
          />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-text-sub)]">
            {t("header.brand")}
          </p>
          <p className="text-sm font-semibold text-[var(--color-text-main)]">
            {t("header.subtitle")}
          </p>
        </div>
      </div>
      <nav aria-label="Primary" className="flex items-center gap-2">
        <div className="flex items-center">
          <label className="sr-only" htmlFor="locale-select">
            {t("header.languageLabel")}
          </label>
          <select
            id="locale-select"
            value={locale}
            onChange={handleLocaleChange}
            className="rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text-main)] transition hover:border-[var(--color-brand-500)]"
          >
            <option value="ko">{t("header.languageKorean")}</option>
            <option value="en">{t("header.languageEnglish")}</option>
          </select>
        </div>
        <Link
          className="rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-main)] transition hover:border-[var(--color-brand-500)]"
          href="/market"
        >
          {t("header.market")}
        </Link>
        <Link
          className="rounded-full bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-700)] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_24px_-12px_rgba(58,141,255,0.8)] transition hover:from-[var(--color-brand-300)] hover:to-[var(--color-brand-500)]"
          href="/login"
        >
          {t("header.login")}
        </Link>
      </nav>
    </header>
  );
};
