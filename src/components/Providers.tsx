"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/infrastructure/query/queryClient";
import { SilentRefreshProvider } from "@/features/auth/components/SilentRefreshProvider";
import { initAuthSessionBridge } from "@/features/auth/lib/auth-session-bridge";
import { UpdateBanner } from "./common/UpdateBanner";
import { IosInstallHint } from "./common/IosInstallHint";
import { KernelAuthBridge } from "./KernelAuthBridge";
import { PushNotificationProvider } from "@/features/notifications/components/PushNotificationProvider";
import { PostHogProvider } from "@/infrastructure/analytics/PostHogProvider";
import { ConsentBanner } from "@/infrastructure/analytics/ConsentBanner";

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
      {/* Prompts signed-in staff to refresh when a newer deploy goes live.
          Renders nothing and idles on anonymous (public) pages. */}
      <UpdateBanner />
      {/* One-time "Add to Home Screen" hint on iOS Safari (no beforeinstallprompt
          there), which is also the prerequisite for Web Push on iOS 16.4+. */}
      <IosInstallHint />
      {/* Re-syncs an existing push grant after login and refreshes the in-app
          feed when the service worker relays a push. Never prompts. */}
      <PushNotificationProvider />
      <PostHogProvider>
        <KernelAuthBridge>{children}</KernelAuthBridge>
      </PostHogProvider>
      <ConsentBanner />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
