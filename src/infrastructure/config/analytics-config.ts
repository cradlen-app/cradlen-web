/**
 * PostHog config seam. Mirrors `build-info.ts`: the rest of the app reads these
 * typed values instead of touching `process.env.NEXT_PUBLIC_*` directly.
 *
 * Analytics is a no-op until `NEXT_PUBLIC_POSTHOG_KEY` is set, so this is safe
 * to ship before keys are provisioned (same posture as Sentry).
 */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";

/** US Cloud ingest host by default (region chosen at signup); env-overridable. */
export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

/** First-party path the browser posts to; rewritten to POSTHOG_HOST by next.config. */
export const POSTHOG_PROXY_PATH = "/api/ingest";

export const analyticsConfigured = POSTHOG_KEY.length > 0;
