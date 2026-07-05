import type { CurrentUser, UserProfile, UserRole } from "@/common/types/user.types";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { buildDashboardUrl } from "@/infrastructure/http/routes";
import type { ApiResponse } from "@/common/types/api.types";
import { isAccountant, isReceptionist } from "./permissions";
import { getProfileRoles } from "./current-user";

export function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export function getDefaultRouteForRole(
  role: UserRole | undefined,
  orgId: string,
  branchId: string,
  profile?: UserProfile,
): string {
  if (isReceptionist(profile)) {
    return buildDashboardUrl(orgId, branchId, "/visits");
  }

  // The back-office accountant's workspace is the financial section only.
  if (isAccountant(profile)) {
    return buildDashboardUrl(orgId, branchId, "/financial/invoices");
  }

  switch (role) {
    case "doctor":
      return buildDashboardUrl(orgId, branchId);
    case "reception":
      return buildDashboardUrl(orgId, branchId, "/visits");
    default:
      return buildDashboardUrl(orgId, branchId);
  }
}

/**
 * The login/select-profile responses don't include `job_functions`, so
 * receptionists (job function, not role) can't be detected from that payload
 * alone. Fetch `/auth/me` once tokens are set so we can route them to /visits
 * by default. Falls back to the role-based default if the call fails.
 */
export async function resolveDefaultRouteAfterAuth(
  orgId: string,
  branchId: string,
  fallbackProfile?: UserProfile,
): Promise<string> {
  try {
    const res = await apiAuthFetch<ApiResponse<CurrentUser>>("/auth/me");
    const profile = res.data?.profiles?.[0];
    const role = getProfileRoles(profile)[0];
    return getDefaultRouteForRole(role, orgId, branchId, profile);
  } catch {
    const role = getProfileRoles(fallbackProfile)[0];
    return getDefaultRouteForRole(role, orgId, branchId, fallbackProfile);
  }
}
