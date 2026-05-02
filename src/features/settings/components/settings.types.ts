import { Building2, MapPin, ShieldAlert, UserRound } from "lucide-react";

export type SectionKey = "profile" | "organization" | "branches" | "danger";

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

export const SETTINGS_SECTIONS: { key: SectionKey; icon: typeof UserRound }[] =
  [
    { key: "profile", icon: UserRound },
    { key: "organization", icon: Building2 },
    { key: "branches", icon: MapPin },
    { key: "danger", icon: ShieldAlert },
  ];
