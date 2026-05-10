import { canUseSettings as canUseSettingsPerm } from "@/features/auth/lib/permissions";
import type { UserProfile } from "@/types/user.types";

/** Whether the active profile may see the Settings link in the sidebar. */
export function canUseSettings(profile: UserProfile | undefined) {
  return canUseSettingsPerm(profile);
}
