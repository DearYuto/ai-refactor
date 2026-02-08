import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export const PageShell = ({ children, className }: PageShellProps) => {
  const classes = [
    "min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-main)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
};
