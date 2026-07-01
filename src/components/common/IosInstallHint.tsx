"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const DISMISS_KEY = "cradlen-ios-install-dismissed";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as desktop Safari; detect via a touch-capable "Mac".
  const iPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in navigator &&
      (navigator as { standalone?: boolean }).standalone === true) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/**
 * iOS never fires `beforeinstallprompt`, so Safari shows no install affordance —
 * a user can only install via Share → "Add to Home Screen". This surfaces a
 * one-time, dismissible hint on iOS Safari when the app isn't already installed.
 * That install is also the prerequisite for Web Push on iOS 16.4+, so the hint
 * is what makes notifications reachable for iPhone/iPad users. Renders nothing
 * itself — it fires a single persistent Sonner toast. Mounted once in
 * `Providers`.
 */
export function IosInstallHint() {
  const t = useTranslations("iosInstall");
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    if (!isIos() || isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    shown.current = true;

    // Persist on either the explicit action or a swipe-away so it stays gone.
    const persistDismissal = () => localStorage.setItem(DISMISS_KEY, "1");

    toast(t("title"), {
      id: "ios-install",
      description: t("description"),
      duration: Infinity, // persists until the user acts on it
      onDismiss: persistDismissal,
      action: {
        label: t("dismiss"),
        onClick: persistDismissal,
      },
    });
  }, [t]);

  return null;
}
