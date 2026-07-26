import { ApiError } from "@/common/errors/api-error";

/**
 * True when a clinical write was rejected because the visit is closed
 * (COMPLETED or CANCELLED). The backend's `EncounterMutationGuard` returns 409
 * with code `ENCOUNTER_LOCKED`.
 *
 * In practice this surfaces when the visit is completed in another tab between
 * render and submit — the UI should refresh the visit and re-render read-only
 * rather than showing a generic failure.
 *
 * `GlobalExceptionFilter` wraps bodies as `{ error: { code, ... } }`, but some
 * responses arrive flat; read top-level first, then the nested object — same
 * fallback the subscription-error helpers use.
 */
export function isEncounterLocked(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) return false;
  const body = error.body as
    | { code?: string; error?: { code?: string } }
    | null
    | undefined;
  return (body?.code ?? body?.error?.code) === "ENCOUNTER_LOCKED";
}
