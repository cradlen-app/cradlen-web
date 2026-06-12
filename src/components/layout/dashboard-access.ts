import type { AuthContext, AuthProfile } from "@/common/kernel-contracts";
import { hasAnyStaffRole, isOwner } from "@/features/auth/lib/permissions";
import { bootModules } from "@/kernel";
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
 * Converts a canonical dashboard path into the dashboard-relative form used by
 * `NavItem.path`: `/dashboard/financial/services` → `/financial/services`,
 * `/dashboard` → `""`.
 */
function toNavRelativePath(canonicalPathname: string): string {
  if (canonicalPathname === "/dashboard") return "";
  if (canonicalPathname.startsWith("/dashboard/")) {
    return canonicalPathname.slice("/dashboard".length);
  }
  return canonicalPathname;
}

/**
 * Route-level gate. The detailed authorization (per-branch scoping, role-edits,
 * etc.) is enforced by the backend; this only decides whether to *display* the
 * page at all so unauthorised users don't see a flash of forbidden content.
 *
 * Access is derived from the kernel nav registry: each route resolves to the
 * nav item that owns it, and that item's `requiresPermission` is the single
 * source of truth — the same value that gates the sidebar entry. Adding or
 * regating a route is therefore a one-line change on its `NavItem`.
 *
 * Two surfaces stay always-on for any staff member regardless of sidebar
 * visibility:
 *  - the dashboard root (`""`), which is the universal fallback redirect target
 *    and must never be denied (denying it would loop the redirect), and
 *  - `/settings`, which has no nav entry.
 * Routes not modeled in the nav at all are reachable by owners only.
 */
export function canAccessRoute(
  profile: UserProfile | undefined,
  canonicalPathname: string,
): boolean {
  if (!hasAnyStaffRole(profile)) return false;

  const rel = toNavRelativePath(canonicalPathname);

  if (rel === "" || rel === "/settings" || rel.startsWith("/settings/")) {
    return true;
  }

  const registry = bootModules();
  const item = registry.nav.matchByPath(rel);
  if (item) {
    if (!item.requiresPermission) return true;
    const ctx: AuthContext = {
      user: null,
      profile: (profile ?? null) as AuthProfile | null,
      orgId: null,
      branchId: null,
    };
    return registry.permissions.check(item.requiresPermission, ctx);
  }

  // Un-modeled routes: owners can reach them; everyone else is denied.
  return isOwner(profile);
}
