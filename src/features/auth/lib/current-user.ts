import { STAFF_ROLE } from "./auth.constants";
import type { CurrentUser, UserProfile, UserRole, UserSpecialty } from "@/common/types/user.types";
import { useAuthContextStore } from "../store/authContextStore";

export function getProfileIsClinical(profile?: UserProfile): boolean {
  return profile?.job_function?.is_clinical ?? false;
}

function specialtyName(s: UserSpecialty | string): string {
  return typeof s === "string" ? s : s.name;
}

export function getProfileSpecialtyNames(profile?: UserProfile): string[] {
  const names: string[] = [];
  if (profile?.specialty) names.push(profile.specialty.name);
  if (profile?.subspecialties?.length) {
    names.push(...profile.subspecialties.map((s) => s.name));
  }
  return names;
}

export function getOrganizationSpecialtyNames(profile?: UserProfile): string[] {
  const list = profile?.organization?.specialties ?? profile?.organization?.specialities;
  if (!list?.length) return [];
  return list.map(specialtyName);
}

/** Org specialty CODES (e.g. "OBGYN"); /auth/me returns objects with `code`. */
export function getOrganizationSpecialtyCodes(profile?: UserProfile): string[] {
  const list = profile?.organization?.specialties;
  if (!list?.length) return [];
  return list
    .map((s) => (typeof s === "string" ? s : s.code))
    .filter((c): c is string => !!c);
}

export function normalizeRoleName(name?: string | null): UserRole {
  const normalized = name?.toLowerCase();

  if (normalized === STAFF_ROLE.OWNER) return STAFF_ROLE.OWNER;
  if (normalized === STAFF_ROLE.DOCTOR) return STAFF_ROLE.DOCTOR;
  if (normalized === STAFF_ROLE.RECEPTION || normalized === "receptionist") {
    return STAFF_ROLE.RECEPTION;
  }
  if (normalized === "patient") return "patient";
  return STAFF_ROLE.UNKNOWN;
}

export function getProfileId(profile: UserProfile) {
  return profile.profile_id ?? profile.staff_id;
}

export function getProfileOrganization(profile?: UserProfile) {
  return profile?.organization;
}

export function getProfileOrganizationName(profile?: UserProfile) {
  return profile?.organization_name ?? getProfileOrganization(profile)?.name;
}

export function getProfileOrganizationId(profile?: UserProfile) {
  return getProfileOrganization(profile)?.id ?? profile?.organization_id;
}

export function getBranchId(branch?: UserProfile["branch"]) {
  return branch?.branch_id ?? branch?.id;
}

export function getProfileBranches(profile?: UserProfile) {
  if (profile?.branches?.length) return profile.branches;
  if (profile?.branch) return [profile.branch];
  return [];
}

export function getDefaultBranch(profile?: UserProfile, branchId?: string | null) {
  const branches = getProfileBranches(profile);
  return (
    branches.find((branch) => getBranchId(branch) === branchId) ??
    branches.find((branch) => branch.is_main) ??
    branches[0]
  );
}

export function getProfileRoles(profile?: UserProfile): UserRole[] {
  return [getProfilePrimaryRole(profile)];
}

export function getProfilePrimaryRole(profile?: UserProfile): UserRole {
  const raw = getRawProfileRole(profile);
  return raw ? normalizeRoleName(raw) : STAFF_ROLE.UNKNOWN;
}

export function getActiveProfile(user?: CurrentUser | null): UserProfile | undefined {
  if (!user?.profiles.length) return undefined;

  const selectedProfileId = useAuthContextStore.getState().profileId;
  return (
    user.profiles.find((profile) => getProfileId(profile) === selectedProfileId) ??
    user.profiles[0]
  );
}

export function getActiveRole(user?: CurrentUser | null): UserRole | undefined {
  const activeProfile = getActiveProfile(user);
  return activeProfile ? getProfileRoles(activeProfile)[0] : undefined;
}

export function getRawProfileRole(profile?: UserProfile): string | undefined {
  const r = profile?.role;
  if (!r) return undefined;
  return typeof r === "string" ? r : r.name;
}
