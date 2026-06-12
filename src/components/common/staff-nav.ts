import type { LucideIcon } from "lucide-react";

import type { NavItem } from "@/common/kernel-contracts";
import { usePluginNav } from "@/kernel";
import type { SidebarNavItem } from "./SidebarNav";

/**
 * Maps a kernel `NavItem` to the sidebar's render shape. Permission filtering
 * and display ordering are owned by the kernel's `NavRegistry` —
 * `usePluginNav()` already returns the visible items in order — so this is a
 * pure shape adapter with no role logic.
 */
function toSidebarItem(item: NavItem): SidebarNavItem {
  return {
    path: item.path,
    key: item.labelKey,
    icon: item.icon as LucideIcon,
    group: item.group
      ? {
          id: item.group.id,
          labelKey: item.group.labelKey,
          icon: item.group.icon as LucideIcon,
        }
      : undefined,
  };
}

/**
 * The role-aware, registry-driven staff navigation list shared by the desktop
 * `Sidebar` and the mobile `StaffBottomTabs` / `StaffMoreSheet`.
 *
 * Every item — including the formerly hardcoded dashboard / visits / calendar /
 * patients / medicine / medical-rep entries — is now contributed by
 * a kernel manifest (`@/core/shell`, `@/core/staff`, `@/core/financial`, ...),
 * filtered by permission, and sorted by the `NavRegistry`.
 */
export function useStaffNavItems(): SidebarNavItem[] {
  return usePluginNav().map(toSidebarItem);
}

/** Paths surfaced as primary tabs in the mobile bottom bar. */
export const STAFF_PRIMARY_TAB_PATHS = [
  "/visits",
  "/calendar",
  "/patients",
  "/staff",
] as const;
