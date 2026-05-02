import type { UserRole } from "@/types/user.types";
import { buildDashboardUrl } from "@/lib/routes";

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
      return buildDashboardUrl(orgId, branchId, "/calendar");
    case "reception":
      return buildDashboardUrl(orgId, branchId, "/patients");
    case "patient":
      return "/patient/dashboard";
    default:
      return buildDashboardUrl(orgId, branchId);
  }
}
