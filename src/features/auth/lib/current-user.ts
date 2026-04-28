import type { CurrentUser, UserProfile, UserRole } from "@/types/user.types";

export function getActiveProfile(user?: CurrentUser | null): UserProfile | undefined {
  if (!user?.profiles.length) return undefined;

  return (
    user.profiles.find((profile) => profile.role.name === "owner") ??
    user.profiles[0]
  );
}

export function getActiveRole(user?: CurrentUser | null): UserRole | undefined {
  return getActiveProfile(user)?.role.name;
}
