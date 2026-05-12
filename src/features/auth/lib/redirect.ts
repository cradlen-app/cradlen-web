import type { UserRole } from "@/common/types/user.types";
import { buildDashboardUrl } from "@/infrastructure/http/routes";

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
): string {
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
