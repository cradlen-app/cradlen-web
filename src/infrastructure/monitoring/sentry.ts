/**
 * Sentry wiring.
 *
 * Sentry is plugged in behind the logging seam rather than sprinkled through the
 * app: {@link installSentryLogSink} swaps the logger's transport so every
 * `logger.error` / `logger.warn` (including the 11 route error boundaries) is
 * forwarded to Sentry with its scope tag — no per-feature Sentry calls.
 *
 * Everything here is a no-op until `NEXT_PUBLIC_SENTRY_DSN` is set, so the code
 * is safe to ship before secrets are provisioned. The runtime-specific entry
 * points (`src/instrumentation.ts` for server/edge, `src/instrumentation-client.ts`
 * for the browser) call {@link initSentry} + {@link installSentryLogSink}.
 *
 * Layer: `infrastructure → infrastructure (logging) + external`. No domain imports.
 */
import * as Sentry from "@sentry/nextjs";

import { consoleSink, setLogSink, type LogRecord } from "@/infrastructure/logging/logger";

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";

/** Sentry only reports when a DSN is configured. */
export const sentryEnabled = SENTRY_DSN.length > 0;

function tracesSampleRate(): number {
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  const parsed = raw ? Number(raw) : Number.NaN;
  if (Number.isFinite(parsed)) return parsed;
  return process.env.NODE_ENV === "production" ? 0.1 : 0;
}

/** Initialize the Sentry SDK for the current runtime (browser, node, or edge). */
export function initSentry(): void {
  if (!sentryEnabled) return;
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: tracesSampleRate(),
    // Tree-shake Sentry's own debug logging.
    debug: false,
  });
}

/**
 * Transport that mirrors records to the console (local visibility) and escalates
 * `error`/`warn` records to Sentry, preserving the structured context.
 */
function sentryLogSink(record: LogRecord): void {
  consoleSink(record);
  if (record.level !== "error" && record.level !== "warn") return;

  const { error, ...extra } = record.context ?? {};
  Sentry.withScope((scope) => {
    scope.setTag("logger.scope", record.scope);
    scope.setLevel(record.level === "error" ? "error" : "warning");
    if (Object.keys(extra).length > 0) scope.setExtras(extra);

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else if (error !== undefined) {
      scope.setExtra("thrown", error);
      Sentry.captureException(new Error(record.message));
    } else {
      Sentry.captureMessage(record.message);
    }
  });
}

/** Route logger output through Sentry. No-op unless a DSN is configured. */
export function installSentryLogSink(): void {
  if (!sentryEnabled) return;
  setLogSink(sentryLogSink);
}
