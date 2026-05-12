import { UserCheck } from "lucide-react";

import type { NavItem } from "@/common/kernel-contracts";

export const staffNav: readonly NavItem[] = [
  {
    id: "staff",
    path: "/staff",
    labelKey: "staff.nav.label",
    icon: UserCheck,
    requiresPermission: "staff.read",
    order: 50,
  },
];
