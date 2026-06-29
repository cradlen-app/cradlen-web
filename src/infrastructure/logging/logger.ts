/**
 * Structured logging seam.
 *
 * The codebase bans stray `console.*`, so this is the single sanctioned place
 * that writes to the console — and the single place a Sentry (or any other)
 * transport is wired in later. Call sites depend on the {@link Logger} API, not
 * on the underlying sink, so swapping the transport is a one-line change in app
 * bootstrap and never touches a feature.
 *
 * Layer rule: `infrastructure → common` only. This module is pure (no React, no
 * Next) so it is safe to import from server routes, client components, and tests.
 *
 * Wiring Sentry later (once a DSN exists), in an app-level bootstrap:
 *   setLogSink((record) => {
 *     consoleSink(record); // keep local visibility
 *     if (record.level === "error") {
 *       const err = record.context?.error;
 *       if (err) Sentry.captureException(err, { tags: { scope: record.scope } });
 *       else Sentry.captureMessage(record.message, "error");
 *     }
 *   });
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

/** Structured fields attached to a log line. Keep PII out — ids and codes only. */
export interface LogContext {
  /** The error being reported, when logging a failure. Carries the stack. */
  error?: unknown;
  [key: string]: unknown;
}

/** A single normalized log event handed to a {@link LogSink}. */
export interface LogRecord {
  level: LogLevel;
  /** Dot-scoped logger name, e.g. `"dashboard.error"`. */
  scope: string;
  message: string;
  context?: LogContext;
}

/** A transport that consumes log records (console today, Sentry tomorrow). */
export type LogSink = (record: LogRecord) => void;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  /** Derive a child logger that prefixes its scope, e.g. `log.child("socket")`. */
  child(scope: string): Logger;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Below this level, records are dropped before reaching the sink. */
const minLevel: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

/**
 * Default transport. Maps each level to its console method and forwards the
 * error object (not just its message) so devtools keep the stack trace.
 */
export const consoleSink: LogSink = (record) => {
  const label = `[${record.scope}] ${record.message}`;
  const { error, ...rest } = record.context ?? {};
  const extras: unknown[] = [];
  if (Object.keys(rest).length > 0) extras.push(rest);
  if (error !== undefined) extras.push(error);

  switch (record.level) {
    case "debug":
      console.debug(label, ...extras);
      break;
    case "info":
      console.info(label, ...extras);
      break;
    case "warn":
      console.warn(label, ...extras);
      break;
    case "error":
      console.error(label, ...extras);
      break;
  }
};

let activeSink: LogSink = consoleSink;

/** Replace the active transport (e.g. add Sentry at app bootstrap, or a spy in tests). */
export function setLogSink(sink: LogSink): void {
  activeSink = sink;
}

/** Restore the default console transport. Primarily for test teardown. */
export function resetLogSink(): void {
  activeSink = consoleSink;
}

function emit(scope: string, level: LogLevel, message: string, context?: LogContext): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[minLevel]) return;
  activeSink({ level, scope, message, context });
}

/** Create a scoped logger. Scopes compose via {@link Logger.child}. */
export function createLogger(scope: string): Logger {
  return {
    debug: (message, context) => emit(scope, "debug", message, context),
    info: (message, context) => emit(scope, "info", message, context),
    warn: (message, context) => emit(scope, "warn", message, context),
    error: (message, context) => emit(scope, "error", message, context),
    child: (childScope) => createLogger(`${scope}.${childScope}`),
  };
}

/** Root application logger. Prefer `createLogger("feature")` at call sites. */
export const logger = createLogger("app");
