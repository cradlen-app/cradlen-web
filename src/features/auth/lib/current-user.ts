import type { CurrentUser, UserProfile, UserRole } from "@/types/user.types";
import { useAuthContextStore } from "../store/authContextStore";

export function normalizeRoleName(name?: string | null): UserRole {
  const normalized = name?.toLowerCase();

  if (normalized === "owner") return "owner";
  if (normalized === "doctor") return "doctor";
  if (normalized === "reception" || normalized === "receptionist") {
    return "reception";
  }
  if (normalized === "patient") return "patient";
  return "unknown";
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
  const rawNames = profile?.roles?.length
    ? profile.roles.map((r) => (typeof r === "string" ? r : r.name))
    : profile?.role?.name
      ? [profile.role.name]
      : [];

  const normalizedRoles = rawNames.map((name) => normalizeRoleName(name));
  return normalizedRoles.length ? normalizedRoles : ["unknown"];
}

export function getProfilePrimaryRole(profile?: UserProfile): UserRole {
  return getProfileRoles(profile)[0];
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
