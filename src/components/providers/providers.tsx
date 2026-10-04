// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "../../app/lib/hooks/useAuth";
import { MobileBottomNav } from "../navigation/MobileBottomNav";

const bypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS === "true";

export function Providers({ children }: { children: React.ReactNode }) {
  const app = (
    <AuthProvider>
      {children}
      <MobileBottomNav />
    </AuthProvider>
  );

  if (!bypassEnabled) {
    return <SessionProvider>{app}</SessionProvider>;
  }

  // Local-only (see .git/info/exclude). Do not commit src/dev-bypass or src/app/dev.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AuthBypassBoot } = require("../../dev-bypass/AuthBypassBoot") as {
    AuthBypassBoot: React.ComponentType<{ children?: React.ReactNode }>;
  };

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <AuthBypassBoot />
      {app}
    </SessionProvider>
  );
}
