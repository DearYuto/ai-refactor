import type { ReactNode } from "react";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export const SurfaceCard = ({ children, className }: SurfaceCardProps) => {
  const classes = [
    "rounded-3xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[0_20px_46px_-32px_rgba(31,94,219,0.4)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
};
