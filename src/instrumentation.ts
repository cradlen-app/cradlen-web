// Server/edge instrumentation entry (Next.js `register`/`onRequestError`).
// Boots Sentry for the Node and Edge runtimes and forwards structured logs to it.
// No-op until NEXT_PUBLIC_SENTRY_DSN is configured.
import * as Sentry from "@sentry/nextjs";

import { initSentry, installSentryLogSink } from "@/infrastructure/monitoring/sentry";

export function register(): void {
  initSentry();
  installSentryLogSink();
}

// Reports uncaught server errors (Server Components, Route Handlers, Actions) to Sentry.
export const onRequestError = Sentry.captureRequestError;
