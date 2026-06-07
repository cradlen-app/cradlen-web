import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Pill,
  Briefcase,
  BarChart2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { NavItem } from "@/common/kernel-contracts";
import type { UserProfile } from "@/common/types/user.types";
import { usePluginNav } from "@/kernel";
import {
  canAccessMedicine,
  isOwner,
  isReceptionist,
} from "@/features/auth/lib/permissions";
import type { SidebarNavItem } from "./SidebarNav";

/**
 * Legacy nav items contributed by `features/*` that haven't migrated to
 * the kernel manifest yet. Staff has migrated and is contributed by
 * `@/core/staff/manifest` via `usePluginNav()` (order: 50).
 *
 * Each item carries an `order` used to interleave with plugin nav items
 * at render time. As features migrate, their entries here are deleted
 * and re-declared in their core/<module>/nav.ts.
 */
type OrderedNavItem = SidebarNavItem & { order: number };

const OWNER_LEGACY_NAV: OrderedNavItem[] = [
  { path: "", key: "nav.dashboard", icon: LayoutDashboard, order: 10 },
  { path: "/visits", key: "nav.visits", icon: ClipboardList, order: 20 },
  { path: "/calendar", key: "nav.calendar", icon: Calendar, order: 30 },
  { path: "/patients", key: "nav.patients", icon: Users, order: 40 },
  { path: "/medicine", key: "nav.medicine", icon: Pill, order: 60 },
  { path: "/medical-rep", key: "nav.medicalRep", icon: Briefcase, order: 70 },
  { path: "/analytics", key: "nav.analytics", icon: BarChart2, order: 80 },
];

const BASE_LEGACY_NAV: OrderedNavItem[] = [
  { path: "", key: "nav.dashboard", icon: LayoutDashboard, order: 10 },
  { path: "/visits", key: "nav.visits", icon: ClipboardList, order: 20 },
  { path: "/calendar", key: "nav.calendar", icon: Calendar, order: 30 },
  { path: "/patients", key: "nav.patients", icon: Users, order: 40 },
];

const MEDICINE_LEGACY_NAV: OrderedNavItem = {
  path: "/medicine",
  key: "nav.medicine",
  icon: Pill,
  order: 60,
};

function buildLegacyNav(profile: UserProfile | undefined): OrderedNavItem[] {
  if (isOwner(profile)) return OWNER_LEGACY_NAV;
  const items = [...BASE_LEGACY_NAV];
  if (canAccessMedicine(profile)) items.push(MEDICINE_LEGACY_NAV);
  if (isReceptionist(profile)) {
    return items.filter((item) => item.path !== "");
  }
  return items;
}

function pluginToSidebarItem(item: NavItem): OrderedNavItem {
  return {
    path: item.path,
    key: item.labelKey,
    icon: item.icon as LucideIcon,
    order: item.order ?? 999,
  };
}

function mergeNav(
  legacy: OrderedNavItem[],
  pluginNav: readonly NavItem[],
): SidebarNavItem[] {
  const combined: OrderedNavItem[] = [
    ...legacy,
    ...pluginNav.map(pluginToSidebarItem),
  ];
  combined.sort((a, b) => a.order - b.order);
  return combined.map(({ path, key, icon }) => ({ path, key, icon }));
}

/**
 * The role-aware, plugin-merged staff navigation list shared by the
 * desktop `Sidebar` and the mobile `StaffBottomTabs` / `StaffMoreSheet`.
 */
export function useStaffNavItems(
  profile: UserProfile | undefined,
): SidebarNavItem[] {
  const pluginNav = usePluginNav();
  return mergeNav(buildLegacyNav(profile), pluginNav);
}

/** Paths surfaced as primary tabs in the mobile bottom bar. */
export const STAFF_PRIMARY_TAB_PATHS = [
  "/visits",
  "/calendar",
  "/patients",
  "/staff",
] as const;
