import { Building2, KeyRound, MapPin, ShieldAlert, UserRound } from "lucide-react";

export type SectionKey =
  | "profile"
  | "account"
  | "organization"
  | "branches"
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
}[] = [
  { key: "profile", icon: UserRound },
  { key: "account", icon: KeyRound },
  { key: "organization", icon: Building2, ownerOnly: true },
  { key: "branches", icon: MapPin, ownerOnly: true },
  { key: "danger", icon: ShieldAlert, ownerOnly: true },
];

export function getVisibleSections(isOwner: boolean) {
  return SETTINGS_SECTIONS.filter((s) => !s.ownerOnly || isOwner);
}
