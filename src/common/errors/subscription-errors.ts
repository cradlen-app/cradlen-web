import { ApiError } from "@/infrastructure/http/api";

export type SubscriptionLimitResource = "branches" | "organizations" | string;

export type SubscriptionLimitInfo = {
  resource: SubscriptionLimitResource;
  limit: number;
  current: number;
};

export function getSubscriptionLimit(error: unknown): SubscriptionLimitInfo | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null;
  const body = error.body as
    | { code?: string; details?: SubscriptionLimitInfo }
    | null
    | undefined;
  if (body?.code !== "SUBSCRIPTION_LIMIT_REACHED" || !body.details) return null;
  return body.details;
}

/**
 * True when a write was blocked because the org's subscription has lapsed. The
 * backend `SubscriptionGuard` returns 403 with `error.code` SUBSCRIPTION_EXPIRED.
 * The error body is shaped `{ error: { code, message } }` (GlobalExceptionFilter).
 */
export function isSubscriptionExpired(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 403) return false;
  const body = error.body as
    | { code?: string; error?: { code?: string } }
    | null
    | undefined;
  return (
    body?.code === "SUBSCRIPTION_EXPIRED" ||
    body?.error?.code === "SUBSCRIPTION_EXPIRED"
  );
}
