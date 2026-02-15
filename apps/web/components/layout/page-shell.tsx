import type { ReactNode } from "react";
import type { CSSProperties } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export const PageShell = ({ children, className, style }: PageShellProps) => {
  const classes = [
    "min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-main)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
};
