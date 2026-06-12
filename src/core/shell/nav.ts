import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Pill,
  Briefcase,
} from "lucide-react";

import type { NavItem } from "@/common/kernel-contracts";

/**
 * Transitional "shell" nav — the top-level operational surfaces that haven't
 * migrated to their own core module yet (dashboard home, visits, calendar,
 * patients, medicine, medical-rep).
 *
 * Each item reuses the existing global `nav.*` message keys, so no translation
 * changes are needed. Visibility is driven entirely by `requiresPermission`
 * (filtered by the kernel's `NavRegistry`); ungated items are visible to every
 * staff member. As a feature migrates to `src/core/<module>`, move its NavItem
 * (and any permission) out of here into that module's `nav.ts`; once this list
 * is empty the shell module is deleted.
 */
export const shellNav: readonly NavItem[] = [
  {
    id: "shell-dashboard",
    path: "",
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    requiresPermission: "dashboard.home",
    order: 10,
  },
  {
    id: "shell-visits",
    path: "/visits",
    labelKey: "nav.visits",
    icon: ClipboardList,
    order: 20,
  },
  {
    id: "shell-calendar",
    path: "/calendar",
    labelKey: "nav.calendar",
    icon: Calendar,
    order: 30,
  },
  {
    id: "shell-patients",
    path: "/patients",
    labelKey: "nav.patients",
    icon: Users,
    order: 40,
  },
  {
    id: "shell-medicine",
    path: "/medicine",
    labelKey: "nav.medicine",
    icon: Pill,
    requiresPermission: "medicine.read",
    order: 60,
  },
  {
    id: "shell-medical-rep",
    path: "/medical-rep",
    labelKey: "nav.medicalRep",
    icon: Briefcase,
    requiresPermission: "medicalRep.view",
    order: 70,
  },
];
