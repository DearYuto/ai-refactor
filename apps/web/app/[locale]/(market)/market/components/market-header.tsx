type MarketHeaderProps = {
  title: string;
  isLoading: boolean;
  socketStatus: "connected" | "disconnected" | "connecting";
};

const statusLabel = {
  connected: "Connected",
  connecting: "Connecting",
  disconnected: "Offline",
} as const;

const statusClasses = {
  connected: "text-emerald-400",
  connecting: "text-amber-400",
  disconnected: "text-rose-400",
} as const;

export const MarketHeader = ({
  title,
  isLoading,
  socketStatus,
}: MarketHeaderProps) => (
  <header className="flex flex-col gap-2">
    <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-sub)]">
      Market
    </p>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
        {title}
      </h1>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-[var(--color-text-sub)]">
          {isLoading ? "Loading" : "Live"}
        </span>
        <span className={`font-medium ${statusClasses[socketStatus]}`}>
          {statusLabel[socketStatus]}
        </span>
      </div>
    </div>
  </header>
);
