import type { ReactNode } from "react";

type LoginCardProps = {
  children: ReactNode;
};

export default function LoginCard({ children }: LoginCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Use your email and password to continue.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
