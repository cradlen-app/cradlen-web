import {
  CLINICAL_JOB_FUNCTIONS,
  JOB_FUNCTION_CODE,
  STAFF_API_ROLE,
  type JobFunctionCode,
  type StaffApiRole,
} from "./auth.constants";
import type { UserProfile } from "@/types/user.types";

function profileApiRoleNames(profile?: UserProfile): Set<string> {
  const names = new Set<string>();
  if (!profile) return names;

  for (const r of profile.roles ?? []) {
    const raw = typeof r === "string" ? r : r.name;
    if (raw) names.add(raw.toUpperCase());
  }
  if (profile.role?.name) names.add(profile.role.name.toUpperCase());

  return names;
}

function profileJobFunctionCodes(profile?: UserProfile): Set<string> {
  const codes = new Set<string>();
  for (const fn of profile?.job_functions ?? []) {
    if (fn.code) codes.add(fn.code.toUpperCase());
  }
  return codes;
}

export function hasApiRole(profile: UserProfile | undefined, role: StaffApiRole): boolean {
  return profileApiRoleNames(profile).has(role);
}

export function hasJobFunction(
  profile: UserProfile | undefined,
  code: JobFunctionCode,
): boolean {
  return profileJobFunctionCodes(profile).has(code);
}

export function hasAnyStaffRole(profile?: UserProfile): boolean {
  const names = profileApiRoleNames(profile);
  for (const r of Object.values(STAFF_API_ROLE)) {
    if (names.has(r)) return true;
  }
  return false;
}

export function isOwner(profile?: UserProfile): boolean {
  return hasApiRole(profile, STAFF_API_ROLE.OWNER);
}

export function isBranchManager(profile?: UserProfile): boolean {
  return hasApiRole(profile, STAFF_API_ROLE.BRANCH_MANAGER);
}

export function isReceptionist(profile?: UserProfile): boolean {
  return hasJobFunction(profile, JOB_FUNCTION_CODE.RECEPTIONIST);
}

/**
 * Has any clinical job function (OBGYN, ANESTHESIOLOGIST, PEDIATRICIAN,
 * OTHER_DOCTOR, NURSE). Authoritative source is the profile's
 * `job_functions[].is_clinical` flag — this helper falls back to the static
 * code list when the flag isn't populated.
 */
export function isClinical(profile?: UserProfile): boolean {
  const codes = profileJobFunctionCodes(profile);
  for (const fn of profile?.job_functions ?? []) {
    if (fn.is_clinical) return true;
  }
  return CLINICAL_JOB_FUNCTIONS.some((c) => codes.has(c));
}

/** Per backend spec §2: OWNER, BRANCH_MANAGER, or RECEPTIONIST may view staff. */
export function canViewStaff(profile?: UserProfile): boolean {
  return isOwner(profile) || isBranchManager(profile) || isReceptionist(profile);
}

/** Only OWNER + BRANCH_MANAGER can create/edit/delete staff or invitations. */
export function canManageStaff(profile?: UserProfile): boolean {
  return isOwner(profile) || isBranchManager(profile);
}

/** Only OWNER may edit role_ids or soft-delete an entire staff profile. */
export function canEditStaffRoles(profile?: UserProfile): boolean {
  return isOwner(profile);
}

/** Only OWNER may delete a staff profile from the organization. */
export function canDeleteStaff(profile?: UserProfile): boolean {
  return isOwner(profile);
}

/** Settings access — every staff member can view their own profile. Owner gates org-level fields inside the page. */
export function canUseSettings(profile?: UserProfile): boolean {
  return hasAnyStaffRole(profile);
}

/** Medicine catalogue is clinical-facing. */
export function canAccessMedicine(profile?: UserProfile): boolean {
  return isOwner(profile) || isBranchManager(profile) || isClinical(profile);
}

/** "My visits" / "assigned to me" semantics — anyone clinical sees a personal visits feed. */
export function showsAssignedVisits(profile?: UserProfile): boolean {
  return isClinical(profile);
}

/** Reception-style aggregate views (branch waiting list, etc). */
export function showsBranchAggregate(profile?: UserProfile): boolean {
  return isOwner(profile) || isBranchManager(profile) || isReceptionist(profile);
}

/** Only the front-desk creates new visits. */
export function canCreateVisit(profile?: UserProfile): boolean {
  return isReceptionist(profile);
}

/** Most staff members can search the patient directory. */
export function canSearchPatients(profile?: UserProfile): boolean {
  return (
    isOwner(profile) ||
    isBranchManager(profile) ||
    isReceptionist(profile) ||
    isClinical(profile)
  );
}
