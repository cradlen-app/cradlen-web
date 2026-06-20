import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Pill,
  Briefcase,
} from "lucide-react";

import type { NavItem } from "@/common/kernel-contracts";
import { PERMISSIONS } from "@/common/kernel-contracts";

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
    requiresPermission: PERMISSIONS.dashboardHome,
    order: 10,
  },
  {
    id: "shell-visits",
    path: "/visits",
    labelKey: "nav.visits",
    icon: ClipboardList,
    requiresPermission: PERMISSIONS.clinicalWorkspaceView,
    order: 20,
  },
  {
    id: "shell-calendar",
    path: "/calendar",
    labelKey: "nav.calendar",
    icon: Calendar,
    requiresPermission: PERMISSIONS.clinicalWorkspaceView,
    order: 30,
  },
  {
    id: "shell-patients",
    path: "/patients",
    labelKey: "nav.patients",
    icon: Users,
    requiresPermission: PERMISSIONS.operationsView,
    order: 40,
  },
  {
    id: "shell-medicine",
    path: "/medicine",
    labelKey: "nav.medicine",
    icon: Pill,
    requiresPermission: PERMISSIONS.medicineRead,
    order: 60,
  },
  {
    id: "shell-medical-rep",
    path: "/medical-rep",
    labelKey: "nav.medicalRep",
    icon: Briefcase,
    requiresPermission: PERMISSIONS.medicalRepView,
    order: 70,
  },
];
