"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { applyConsent } from "./consent";
import { capturePageview, initAnalytics } from "./posthog";

/**
 * Mounts PostHog once (opted-out until consent), replays any persisted consent
 * choice, and fires a manual pageview on every locale-prefixed route change.
 * A no-op when analytics is unconfigured (the seam guards internally).
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
    applyConsent();
  }, []);

  useEffect(() => {
    if (pathname) capturePageview(pathname);
  }, [pathname]);

  return <>{children}</>;
}
