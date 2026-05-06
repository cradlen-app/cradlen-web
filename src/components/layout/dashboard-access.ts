import type { UserRole } from "@/types/user.types";

type StaffRole = "owner" | "doctor" | "reception";

const ALLOWED_DASHBOARD_ROUTES: Record<StaffRole, string[]> = {
  owner: ["/dashboard"],
  reception: [
    "/dashboard",
    "/dashboard/visits",
    "/dashboard/calendar",
    "/dashboard/patients",
    "/dashboard/staff",
  ],
  doctor: [
    "/dashboard",
    "/dashboard/visits",
    "/dashboard/calendar",
    "/dashboard/patients",
    "/dashboard/medicine",
    "/dashboard/settings",
  ],
};

/**
 * Strips the /orgId/branchId prefix from a locale-stripped pathname.
 * e.g. /org1/branch1/dashboard/calendar → /dashboard/calendar
 */
export function getCanonicalDashboardPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return pathname;
  return "/" + segments.slice(2).join("/") || "/";
}

export function canAccessRoute(role: UserRole, canonicalPathname: string) {
  if (role === "patient" || role === "unknown") return false;
  if (role === "owner") return true;

  return ALLOWED_DASHBOARD_ROUTES[role as StaffRole].some(
    (route) =>
      route === "/dashboard"
        ? canonicalPathname === route
        : canonicalPathname === route || canonicalPathname.startsWith(`${route}/`),
  );
}
