"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { queryKeys } from "@/lib/queryKeys";
import { usePushSubscription } from "../hooks/usePushSubscription";

/**
 * Headless. Mounted once in `Providers` (inside the authenticated tree). Two jobs:
 *
 *  1. Keep the in-app notification feed fresh when a push arrives while a tab is
 *     open: the service worker postMessages `cradlen:notification`, and we
 *     invalidate the notifications query so the bell badge updates without a poll.
 *  2. Silently re-register an already-granted push subscription with the backend
 *     after (re)login, so a returning user keeps receiving pushes. Never prompts —
 *     enabling notifications is always an explicit user action (see Settings).
 */
export function PushNotificationProvider() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { resync } = usePushSubscription();
  const authed = Boolean(user);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "cradlen:notification") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.all(),
        });
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  }, [queryClient]);

  useEffect(() => {
    if (authed) void resync();
  }, [authed, resync]);

  return null;
}
