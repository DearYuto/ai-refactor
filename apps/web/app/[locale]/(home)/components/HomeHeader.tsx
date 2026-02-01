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
        <span className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950">
          <Image
            src="/bito_logo.png"
            alt="Bito"
            fill
            sizes="44px"
            className="object-contain"
          />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            {t("header.brand")}
          </p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
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
            className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-black/20 hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-white/20"
          >
            <option value="ko">{t("header.languageKorean")}</option>
            <option value="en">{t("header.languageEnglish")}</option>
          </select>
        </div>
        <Link
          className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-black/20 hover:text-zinc-900 dark:border-white/10 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-white/20"
          href="/market"
        >
          {t("header.market")}
        </Link>
        <Link
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          href="/login"
        >
          {t("header.login")}
        </Link>
      </nav>
    </header>
  );
};
