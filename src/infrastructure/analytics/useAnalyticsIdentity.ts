"use client";

import { useEffect, useRef } from "react";

import type { AuthContext } from "@/common/kernel-contracts";
import { group, identify, reset } from "./posthog";

/**
 * Syncs PostHog person + group identity with the auth context. Sends opaque IDs
 * only — never email/name/PHI. Resets the PostHog session on logout so a shared
 * device does not blend two staff sessions.
 */
export function useAnalyticsIdentity(authContext: AuthContext): void {
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const userId = authContext.user?.id ?? null;

    if (userId) {
      if (userId !== lastUserId.current) identify(userId);
      if (authContext.orgId) group("organization", authContext.orgId);
      if (authContext.branchId) group("branch", authContext.branchId);
    } else if (lastUserId.current) {
      reset();
    }

    lastUserId.current = userId;
  }, [authContext.user?.id, authContext.orgId, authContext.branchId]);
}
