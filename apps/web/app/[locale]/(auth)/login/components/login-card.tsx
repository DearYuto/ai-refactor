import type { ReactNode } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";

type LoginCardProps = {
  children: ReactNode;
};

export default function LoginCard({ children }: LoginCardProps) {
  return (
    <SurfaceCard className="w-full max-w-md rounded-2xl p-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold text-[var(--color-text-main)]">
          Sign in
        </h1>
        <p className="text-sm text-[var(--color-text-sub)]">
          Use your email and password to continue.
        </p>
      </div>
      {children}
    </SurfaceCard>
  );
}
