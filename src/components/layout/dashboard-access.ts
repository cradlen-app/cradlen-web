import type { AuthContext, AuthProfile } from "@/common/kernel-contracts";
import { hasAnyStaffRole, isDoctor, isOwner } from "@/features/auth/lib/permissions";
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

  // Base settings page self-gates its sections; deeper settings routes are owner-only.
  if (rel === "/settings") return true;
  if (rel.startsWith("/settings/")) return isOwner(profile);

  // The patients *list* (`/patients`) stays at the nav permission (operations.view),
  // but an individual patient's *detail* workspace (`/patients/<id>`) is the clinical
  // record — owners and doctors only. A non-clinical branch manager sees the table
  // but not a patient's clinical history.
  if (rel.startsWith("/patients/")) return isOwner(profile) || isDoctor(profile);

  const registry = bootModules();
  const ctx: AuthContext = {
    user: null,
    profile: (profile ?? null) as AuthProfile | null,
    orgId: null,
    branchId: null,
  };

  // Dashboard root: gated by `dashboard.home` (same id as the sidebar entry).
  // `matchByPath("")` is intentionally undefined (root items are skipped), so we
  // check the permission directly rather than via the nav registry.
  if (rel === "") return registry.permissions.check("dashboard.home", ctx);

  const item = registry.nav.matchByPath(rel);
  if (item) {
    if (!item.requiresPermission) return true;
    return registry.permissions.check(item.requiresPermission, ctx);
  }

  // Un-modeled routes: owners can reach them; everyone else is denied.
  return isOwner(profile);
}
