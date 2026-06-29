"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useVersionCheck } from "@/infrastructure/config/useVersionCheck";

/**
 * Surfaces a non-blocking "a new version is available" prompt when the running
 * tab is older than the live deployment. Renders nothing itself — it fires a
 * single persistent, de-duplicated Sonner toast with a Refresh action.
 *
 * Deliberately never auto-reloads: a doctor mid-visit or reception mid-form must
 * not lose unsaved input, so refreshing is always the user's choice. Only polls
 * while a user is signed in. Mounted once in `Providers`.
 */
export function UpdateBanner() {
  const { data: currentUser } = useCurrentUser();
  const { updateAvailable } = useVersionCheck(Boolean(currentUser));
  const t = useTranslations("appUpdate");
  const shown = useRef(false);

  useEffect(() => {
    if (!updateAvailable || shown.current) return;
    shown.current = true;

    toast(t("title"), {
      id: "app-update", // de-duplicated, like the subscription-expired toast
      description: t("description"),
      duration: Infinity, // persists until the user acts on it
      action: {
        label: t("refresh"),
        onClick: () => window.location.reload(),
      },
    });
  }, [updateAvailable, t]);

  return null;
}
