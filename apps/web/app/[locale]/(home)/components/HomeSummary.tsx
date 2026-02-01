"use client";

import { useTranslations } from "next-intl";

type HomeSummaryProps = {
  isLoading: boolean;
};

export const HomeSummary = ({ isLoading }: HomeSummaryProps) => {
  const t = useTranslations("home");

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 shadow-[0_24px_60px_-45px_rgba(31,94,219,0.35)]">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-sub)]">
            {t("summary.activity")}
          </p>
          <span className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs text-[var(--color-text-sub)]">
            {isLoading ? t("summary.syncing") : t("summary.live")}
          </span>
        </div>
        <p className="mt-4 text-2xl font-semibold text-[var(--color-text-main)]">
          {isLoading ? t("summary.loadingTitle") : t("summary.readyTitle")}
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-sub)]">
          {t("summary.activityDescription")}
        </p>
      </div>
      <div className="rounded-3xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-sub)]">
          {t("summary.sectionTitle")}
        </p>
        <div className="mt-4 grid gap-3 text-sm text-[var(--color-text-sub)] sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-sub)]">
              {t("summary.coverageLabel")}
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text-main)]">
              {t("summary.coverageTitle")}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-sub)]">
              {t("summary.coverageDescription")}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-sub)]">
              {t("summary.alertsLabel")}
            </p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text-main)]">
              {t("summary.alertsTitle")}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-sub)]">
              {t("summary.alertsDescription")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
