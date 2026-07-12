/**
 * PostHog wiring, behind the analytics seam. The only module that imports
 * `posthog-js`. Everything is a guarded no-op until `analyticsConfigured` is
 * true, and capture stays off until the user opts in (consent). PHI never
 * leaves: session replay masks all inputs + all text on non-public routes, and
 * events are typed against the PHI-free taxonomy.
 *
 * Layer: infrastructure → infrastructure(config) + external. No domain imports.
 */
import posthog from "posthog-js";

import {
  POSTHOG_HOST,
  POSTHOG_KEY,
  POSTHOG_PROXY_PATH,
  analyticsConfigured,
} from "@/infrastructure/config/analytics-config";
import type { EventProps } from "./events";
import { isPublicPath, maskText, sanitizeUrl } from "./masking";

let initialized = false;

/** True once init ran and the SDK finished loading in the browser. */
function ready(): boolean {
  return analyticsConfigured && initialized && posthog.__loaded === true;
}

export function initAnalytics(): void {
  if (!analyticsConfigured || initialized) return;
  if (typeof window === "undefined") return;
  initialized = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_PROXY_PATH,
    ui_host: POSTHOG_HOST.replace("i.posthog.com", "posthog.com"),
    // GDPR: load, but capture nothing until the user accepts.
    opt_out_capturing_by_default: true,
    // We fire pageviews manually (next-intl locale-prefixed SPA nav).
    capture_pageview: false,
    // Record metadata, never input values.
    autocapture: { dom_event_allowlist: ["click", "submit", "change"] },
    session_recording: {
      // Inputs are always masked, on every surface.
      maskAllInputs: true,
      // Text is masked on the authenticated dashboard; verbatim on public pages.
      maskTextFn: (text: string) =>
        isPublicPath(window.location.pathname) ? text : maskText(text),
    },
    // Strip query/hash (they can carry ids) from the captured current URL.
    sanitize_properties: (props: Record<string, unknown>) => {
      if (typeof props.$current_url === "string") {
        props.$current_url = sanitizeUrl(props.$current_url);
      }
      if (typeof props.$referrer === "string") {
        props.$referrer = sanitizeUrl(props.$referrer);
      }
      return props;
    },
  });
}

export function capture<K extends keyof EventProps>(
  event: K,
  ...rest: EventProps[K] extends void ? [] : [props: EventProps[K]]
): void {
  if (!ready()) return;
  posthog.capture(event, rest[0] as Record<string, unknown> | undefined);
}

export function capturePageview(pathname: string): void {
  if (!ready()) return;
  posthog.capture("$pageview", { $current_url: sanitizeUrl(pathname) });
}

export function identify(userId: string): void {
  if (!ready()) return;
  posthog.identify(userId);
}

export function group(type: "organization" | "branch", key: string): void {
  if (!ready()) return;
  posthog.group(type, key);
}

export function reset(): void {
  if (!ready()) return;
  posthog.reset();
}
