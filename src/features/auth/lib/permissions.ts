import {
  CLINICAL_JOB_FUNCTIONS,
  DOCTOR_JOB_FUNCTIONS,
  JOB_FUNCTION_CODE,
  STAFF_API_ROLE,
  type JobFunctionCode,
  type StaffApiRole,
} from "./auth.constants";
import type { UserProfile } from "@/common/types/user.types";

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

export function isAccountant(profile?: UserProfile): boolean {
  return hasJobFunction(profile, JOB_FUNCTION_CODE.ACCOUNTANT);
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

/** A physician (OBGYN / ANESTHESIOLOGIST / PEDIATRICIAN / OTHER_DOCTOR) — clinical minus nurses/assistants. */
export function isDoctor(profile?: UserProfile): boolean {
  const codes = profileJobFunctionCodes(profile);
  return DOCTOR_JOB_FUNCTIONS.some((c) => codes.has(c));
}

/** Who may open the read-only patient workspace: owners, branch managers, and doctors. */
export function canOpenPatientWorkspace(profile?: UserProfile): boolean {
  return isOwner(profile) || isBranchManager(profile) || isDoctor(profile);
}

/** Who may edit a patient's demographics/profile: owners and branch managers. */
export function canManagePatient(profile?: UserProfile): boolean {
  return isOwner(profile) || isBranchManager(profile);
}

/** Who may open the read-only medical-rep overview page: owners, branch managers, and doctors. */
export function canOpenMedicalRepOverview(profile?: UserProfile): boolean {
  return isOwner(profile) || isBranchManager(profile) || isDoctor(profile);
}

// Staff-area permissions moved to their owning module:
//   `staffCan.{read,manage,editRoles,delete}` (pure helpers) and the
//   `staff.{read,manage,editRoles,delete}` kernel ids from `@/core/staff/api`.

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

/** Billing access — front-desk, accountants, and owners can view and manage invoices/payments. */
export function canAccessBilling(profile?: UserProfile): boolean {
  return isOwner(profile) || isReceptionist(profile) || isAccountant(profile);
}

/** Billing admin — only owners can manage price lists, services, and org-level pricing config. */
export function canManageBillingAdmin(profile?: UserProfile): boolean {
  return isOwner(profile);
}

/** Provider price overrides — clinical staff can manage their own per-service prices. */
export function canManageOwnPrices(profile?: UserProfile): boolean {
  return isClinical(profile);
}
