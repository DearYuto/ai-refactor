"use client";

import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";
import { NotificationsDropdown } from "@/components/notifications-dropdown";
import { useAuthStore } from "@/lib/store";

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

const statusVariant = {
  connected: "success",
  connecting: "warning",
  disconnected: "danger",
} as const;

export const MarketHeader = ({
  title,
  isLoading,
  socketStatus,
}: MarketHeaderProps) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return (
    <header className="flex flex-col gap-2">
      <Tag>Market</Tag>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text-main)]">
          {title}
        </h1>
        <div className="flex items-center gap-3 text-sm">
          {isLoggedIn && <NotificationsDropdown />}
          <Badge variant="neutral">{isLoading ? "Loading" : "Live"}</Badge>
          <Badge variant={statusVariant[socketStatus]}>
            {statusLabel[socketStatus]}
          </Badge>
        </div>
      </div>
    </header>
  );
};
