import { ApiError } from "@/lib/api";

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
