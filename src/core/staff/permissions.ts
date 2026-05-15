import type {
  AuthContext,
  PermissionPredicate,
} from "@/common/kernel-contracts";
import {
  JOB_FUNCTION_CODE,
  STAFF_API_ROLE,
} from "@/features/auth/lib/auth.constants";
import type { UserProfile } from "@/common/types/user.types";

/**
 * Staff module permissions.
 *
 * Two flavors are exposed:
 *
 * - `staffCan.{read,manage,editRoles,delete}` — pure helpers that take a
 *   `UserProfile` directly. For non-React callers (server route guards,
 *   derived selectors, the `useUserProfileContext` hook).
 *
 * - `staffPermissions` — kernel `PermissionPredicate` map (id → AuthContext
 *   predicate). Registered with the kernel so React components can use
 *   `usePermission('staff.read')` etc.
 *
 * The kernel set adapts the pure helpers by extracting `ctx.profile`.
 *
 * Replaces the now-removed `canViewStaff` / `canManageStaff` /
 * `canEditStaffRoles` / `canDeleteStaff` predicates from
 * `features/auth/lib/permissions.ts`.
 */

type Profile = UserProfile | null | undefined;

function profileApiRoleNames(profile: Profile): Set<string> {
  const names = new Set<string>();
  if (!profile) return names;
  for (const r of profile.roles ?? []) {
    const raw = typeof r === "string" ? r : r.name;
    if (raw) names.add(raw.toUpperCase());
  }
  if (profile.role?.name) names.add(profile.role.name.toUpperCase());
  return names;
}

function profileJobFunctionCodes(profile: Profile): Set<string> {
  const codes = new Set<string>();
  for (const fn of profile?.job_functions ?? []) {
    if (fn.code) codes.add(fn.code.toUpperCase());
  }
  return codes;
}

function isOwner(profile: Profile): boolean {
  return profileApiRoleNames(profile).has(STAFF_API_ROLE.OWNER);
}

function isBranchManager(profile: Profile): boolean {
  return profileApiRoleNames(profile).has(STAFF_API_ROLE.BRANCH_MANAGER);
}

function isReceptionist(profile: Profile): boolean {
  if (profileJobFunctionCodes(profile).has(JOB_FUNCTION_CODE.RECEPTIONIST)) {
    return true;
  }
  return profileApiRoleNames(profile).has("RECEPTION");
}

/** Per backend spec §2: OWNER, BRANCH_MANAGER, or RECEPTIONIST may view staff. */
function _canRead(profile: Profile): boolean {
  return isOwner(profile) || isBranchManager(profile) || isReceptionist(profile);
}

/** Only OWNER + BRANCH_MANAGER can create/edit/delete staff or invitations. */
function _canManage(profile: Profile): boolean {
  return isOwner(profile) || isBranchManager(profile);
}

/** Only OWNER may edit role_ids or soft-delete an entire staff profile. */
function _canEditRoles(profile: Profile): boolean {
  return isOwner(profile);
}

/** Only OWNER may delete a staff profile from the organization. */
function _canDelete(profile: Profile): boolean {
  return isOwner(profile);
}

export const staffCan = {
  read: _canRead,
  manage: _canManage,
  editRoles: _canEditRoles,
  delete: _canDelete,
} as const;

const fromCtx =
  (fn: (profile: Profile) => boolean): PermissionPredicate =>
  (ctx: AuthContext) =>
    fn(ctx.profile as Profile);

export const staffPermissions = {
  "staff.read": fromCtx(_canRead),
  "staff.manage": fromCtx(_canManage),
  "staff.editRoles": fromCtx(_canEditRoles),
  "staff.delete": fromCtx(_canDelete),
} as const;
