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
  return profile.profile_id ?? profile.id ?? profile.staff_id;
}

export function getProfileAccount(profile?: UserProfile) {
  return profile?.account ?? profile?.organization;
}

export function getProfileAccountName(profile?: UserProfile) {
  return profile?.account_name ?? getProfileAccount(profile)?.name;
}

export function getProfileAccountId(profile?: UserProfile) {
  return profile?.account_id ?? getProfileAccount(profile)?.id;
}

export function getBranchId(branch?: UserProfile["branch"]) {
  return branch?.branch_id ?? branch?.id;
}

export function getProfileBranches(profile?: UserProfile) {
  const branches = profile?.branches?.length
    ? profile.branches
    : profile?.branch
      ? [profile.branch]
      : [];

  return branches;
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
  const roles = profile?.roles?.length
    ? profile.roles
    : profile?.role?.name
      ? [profile.role.name]
      : [];

  const normalizedRoles = roles.map((role) => normalizeRoleName(role));
  return normalizedRoles.length ? normalizedRoles : ["unknown"];
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
