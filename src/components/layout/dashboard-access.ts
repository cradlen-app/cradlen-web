import type { AuthContext, AuthProfile } from "@/common/kernel-contracts";
import { PERMISSIONS } from "@/common/kernel-contracts";
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
 * Settings access is split:
 *  - the base `/settings` page stays always-on for any staff member; it
 *    self-gates its sections internally so non-owners only see profile + account
 *    (owner sections are filtered by `getVisibleSections` and rendered behind
 *    `&& isOwner`), and
 *  - deeper settings *routes* (`/settings/subscription/payments/...`) are
 *    drill-downs of the owner-only subscription section, so they're owner-only.
 *
 * The dashboard root (`""`) is the universal fallback redirect target, but it is
 * still gated by `dashboard.home` (reception is excluded). The redirect loop
 * this would otherwise cause is avoided by `DashboardLayout` sending denied
 * users to their role-aware default route (`getDefaultRouteForRole`, e.g.
 * reception → `/visits`) rather than back to the root.
 *
 * Routes not modeled in the nav at all are reachable by owners only.
 */
export function canAccessRoute(
  profile: UserProfile | undefined,
  canonicalPathname: string,
): boolean {
  if (!hasAnyStaffRole(profile)) return false;

  const rel = toNavRelativePath(canonicalPathname);

  const registry = bootModules();
  const ctx: AuthContext = {
    user: null,
    profile: (profile ?? null) as AuthProfile | null,
    orgId: null,
    branchId: null,
  };

  // Route-only gates (no owning nav item) resolve to a catalog permission id, so
  // the rule lives once in the catalog and is covered by the matrix parity test:
  //  - the base `/settings` page self-gates its sections (any staff),
  //  - deeper org-settings drill-downs are owner-only, and
  //  - an individual patient's *detail* workspace is the clinical record
  //    (clinicians only — a non-clinical owner/branch manager sees the table but
  //    not a patient's clinical history).
  if (rel === "/settings")
    return registry.permissions.check(PERMISSIONS.settingsView, ctx);
  if (rel.startsWith("/settings/"))
    return registry.permissions.check(PERMISSIONS.settingsManageOrg, ctx);
  if (rel.startsWith("/patients/"))
    return registry.permissions.check(PERMISSIONS.patientDetailView, ctx);

  // Dashboard root: gated by `dashboard.home` (same id as the sidebar entry).
  // `matchByPath("")` is intentionally undefined (root items are skipped), so we
  // check the permission directly rather than via the nav registry.
  if (rel === "") return registry.permissions.check(PERMISSIONS.dashboardHome, ctx);

  const item = registry.nav.matchByPath(rel);
  if (item) {
    if (!item.requiresPermission) return true;
    return registry.permissions.check(item.requiresPermission, ctx);
  }

  // Un-modeled routes: owners can reach them; everyone else is denied.
  return isOwner(profile);
}
