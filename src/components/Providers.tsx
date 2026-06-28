"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/infrastructure/query/queryClient";
import { SilentRefreshProvider } from "@/features/auth/components/SilentRefreshProvider";
import { initAuthSessionBridge } from "@/features/auth/lib/auth-session-bridge";
import { KernelAuthBridge } from "./KernelAuthBridge";

// Wire the auth stores into the infrastructure HTTP transport once, at module
// load, so apiAuthFetch can read the request context / tear down the session
// without infrastructure importing this feature.
initAuthSessionBridge();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Proactively refreshes the staff session before the access token
          expires so an active user stays signed in until explicit logout.
          Renders nothing and idles on anonymous (public) pages. */}
      <SilentRefreshProvider />
      <KernelAuthBridge>{children}</KernelAuthBridge>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
