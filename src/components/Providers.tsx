"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/infrastructure/query/queryClient";
import { SilentRefreshProvider } from "@/features/auth/components/SilentRefreshProvider";
import { KernelAuthBridge } from "./KernelAuthBridge";

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
