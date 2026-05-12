"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/infrastructure/query/queryClient";
import { KernelAuthBridge } from "./KernelAuthBridge";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <KernelAuthBridge>{children}</KernelAuthBridge>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
