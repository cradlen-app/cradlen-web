import type { UserProfile, UserRole } from "@/common/types/user.types";
import { buildDashboardUrl } from "@/infrastructure/http/routes";
import { isReceptionist } from "./permissions";

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

  switch (role) {
    case "doctor":
      return buildDashboardUrl(orgId, branchId, "/dashboard");
    case "reception":
      return buildDashboardUrl(orgId, branchId, "/visits");
    case "patient":
      return "/patient/dashboard";
    default:
      return buildDashboardUrl(orgId, branchId);
  }
}
