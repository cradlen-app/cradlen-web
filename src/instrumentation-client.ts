// Browser instrumentation entry. Runs before React hydration, so Sentry is ready
// to capture the earliest client errors. No-op until NEXT_PUBLIC_SENTRY_DSN is set.
import * as Sentry from "@sentry/nextjs";

import { initSentry, installSentryLogSink } from "@/infrastructure/monitoring/sentry";

initSentry();
installSentryLogSink();

// Instruments App Router client navigations for Sentry tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
