import type { UserRole } from "@/types/user.types";

export function canUseSettings(role: UserRole | undefined) {
  return role === "owner" || role === "doctor";
}
