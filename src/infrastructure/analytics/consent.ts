/**
 * Analytics consent (GDPR). PostHog loads opted-out; nothing is captured until
 * the user accepts. The choice is persisted so the banner appears once.
 */
import posthog from "posthog-js";

import { analyticsConfigured } from "@/infrastructure/config/analytics-config";

export type ConsentChoice = "granted" | "denied";
const STORAGE_KEY = "cradlen-analytics-consent";

export function getConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "granted" || v === "denied" ? v : null;
}

export function setConsent(choice: ConsentChoice): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, choice);
  }
  applyConsent(choice);
}

/** Push the (persisted or given) choice into PostHog. Safe when unconfigured. */
export function applyConsent(choice: ConsentChoice | null = getConsent()): void {
  if (!analyticsConfigured || posthog.__loaded !== true || !choice) return;
  if (choice === "granted") posthog.opt_in_capturing();
  else posthog.opt_out_capturing();
}
