import {
  canAccessMedicine,
  hasAnyStaffRole,
  isOwner,
} from "@/features/auth/lib/permissions";
import { staffCan } from "@/core/staff/api";
import type { UserProfile } from "@/common/types/user.types";

/**
 * Strips the /orgId/branchId prefix from a locale-stripped pathname.
 * e.g. /org1/branch1/dashboard/calendar → /dashboard/calendar
 */
export function getCanonicalDashboardPath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return pathname;
  return "/" + segments.slice(2).join("/") || "/";
}

/**
 * Route-level gate. The detailed authorization (per-branch scoping, role-edits,
 * etc.) is enforced by the backend; this only decides whether to *display* the
 * page at all so unauthorised users don't see a flash of forbidden content.
 */
export function canAccessRoute(
  profile: UserProfile | undefined,
  canonicalPathname: string,
): boolean {
  if (!hasAnyStaffRole(profile)) return false;
  if (isOwner(profile)) return true;

  // Always-available staff routes.
  if (
    canonicalPathname === "/dashboard" ||
    canonicalPathname === "/dashboard/visits" ||
    canonicalPathname.startsWith("/dashboard/visits/") ||
    canonicalPathname === "/dashboard/calendar" ||
    canonicalPathname.startsWith("/dashboard/calendar/") ||
    canonicalPathname === "/dashboard/patients" ||
    canonicalPathname.startsWith("/dashboard/patients/") ||
    canonicalPathname === "/dashboard/settings" ||
    canonicalPathname.startsWith("/dashboard/settings/")
  ) {
    return true;
  }

  if (
    canonicalPathname === "/dashboard/staff" ||
    canonicalPathname.startsWith("/dashboard/staff/")
  ) {
    return staffCan.read(profile);
  }

  if (
    canonicalPathname === "/dashboard/medicine" ||
    canonicalPathname.startsWith("/dashboard/medicine/")
  ) {
    return canAccessMedicine(profile);
  }

  // Owner-only sections (medical-rep, analytics, etc.) are already guarded by
  // the early `isOwner` short-circuit; deny everything else for safety.
  return false;
}
