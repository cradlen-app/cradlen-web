import {
  Building2,
  KeyRound,
  MapPin,
  Receipt,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import type { UserProfile } from "@/common/types/user.types";
import {
  canManageBillingAdmin,
  canManageOwnPrices,
} from "@/features/auth/lib/permissions";

export type SectionKey =
  | "profile"
  | "account"
  | "organization"
  | "branches"
  | "billing"
  | "danger";

export type DrawerKey =
  | "profile"
  | "organizationEdit"
  | "branchCreate"
  | "branchEdit"
  | null;

export type SoftDeleteKey =
  | { type: "organization" }
  | { type: "branch"; branchId: string }
  | null;

export const SETTINGS_SECTIONS: {
  key: SectionKey;
  icon: typeof UserRound;
  ownerOnly?: boolean;
  /** When true the section is visible only to users who can manage billing admin OR manage own prices */
  billingOnly?: boolean;
}[] = [
  { key: "profile", icon: UserRound },
  { key: "account", icon: KeyRound },
  { key: "organization", icon: Building2, ownerOnly: true },
  { key: "branches", icon: MapPin, ownerOnly: true },
  { key: "billing", icon: Receipt, billingOnly: true },
  { key: "danger", icon: ShieldAlert, ownerOnly: true },
];

export function getVisibleSections(
  isOwner: boolean,
  profile?: UserProfile,
) {
  return SETTINGS_SECTIONS.filter((s) => {
    if (s.ownerOnly && !isOwner) return false;
    if (
      s.billingOnly &&
      !canManageBillingAdmin(profile) &&
      !canManageOwnPrices(profile)
    ) {
      return false;
    }
    return true;
  });
}
