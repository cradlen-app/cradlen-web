import { STAFF_ROLE } from "@/features/auth/lib/auth.constants";
import type { UserRole } from "@/types/user.types";

export function canUseSettings(role: UserRole | undefined) {
  return role === STAFF_ROLE.OWNER || role === STAFF_ROLE.DOCTOR;
}
