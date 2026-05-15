"use client";

import Image from "next/image";
import LogoIcon from "@/public/Logo-icon.png";
import {
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Check,
  Loader2,
  MapPin,
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  UserCheck,
  Pill,
  Briefcase,
  BarChart2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import type { NavItem } from "@/common/kernel-contracts";
import { usePluginNav } from "@/kernel";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getProfileOrganization,
  getBranchId,
} from "@/features/auth/lib/current-user";
import {
  canAccessMedicine,
  hasAnyStaffRole,
  isOwner,
  isReceptionist,
} from "@/features/auth/lib/permissions";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { cn } from "@/common/utils/utils";
import { useSidebar } from "@/components/layout/SidebarContext";
import { canUseSettings } from "./sidebar-access";
import { SidebarNav, type SidebarNavItem } from "./SidebarNav";
import { useSidebarBranchSwitch } from "./hooks/useSidebarBranchSwitch";
import { useLogout } from "./hooks/useLogout";

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

import type { UserProfile } from "@/common/types/user.types";
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
  return combined.map(({ order: _o, ...rest }) => rest);
}

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, closeMobile } = useSidebar();
  const effectiveCollapsed = collapsed && !mobileOpen;
  const t = useTranslations("nav");
  const pathname = usePathname();
  const dashboardPath = useDashboardPath();
  const { data: user } = useCurrentUser();

  const profile = getActiveProfile(user);

  const {
    branchMenuOpen,
    setBranchMenuOpen,
    branchMenuRef,
    switchingToBranchId,
    isSwitching,
    branch,
    branchId,
    activeProfileId,
    groups,
    hasMultipleProfiles,
    hasMultipleOptions,
    handleSelect,
  } = useSidebarBranchSwitch(profile);

  const { handleLogout } = useLogout();

  const pluginNav = usePluginNav();

  if (!hasAnyStaffRole(profile)) return null;

  const navItems = mergeNav(buildLegacyNav(profile), pluginNav);
  const organization = getProfileOrganization(profile);
  const clinicName = organization?.name ?? "-";
  const clinicBranch = branch?.city
    ? t("branchLabel", { city: branch.city })
    : "-";

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-white border-e border-gray-100 rounded-2xl transition-[width] duration-200 ease-in-out shrink-0",
        effectiveCollapsed ? "w-15" : "w-55",
      )}
    >
      {/* Mobile close button */}
      <button
        type="button"
        onClick={closeMobile}
        aria-label={t("closeMenu")}
        className="absolute top-2 inset-e-2 size-7 flex items-center justify-center rounded-md text-gray-400 hover:text-brand-primary hover:bg-gray-100 transition-colors lg:hidden"
      >
        <X className="size-4" />
      </button>

      {/* Desktop collapse button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "text-gray-400 hover:text-brand-primary transition-colors shrink-0 rounded-md p-0.5 mr-2 mt-2 hidden lg:block",
          effectiveCollapsed ? "mx-auto" : "ms-auto",
        )}
        aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {effectiveCollapsed ? (
          <PanelLeftOpen className="size-4" />
        ) : (
          <PanelLeftClose className="size-4" />
        )}
      </button>

      {/* Clinic header */}
      <div ref={branchMenuRef} className="relative border-b border-gray-100">
        <div className="flex items-center gap-2.5 px-3 py-4 min-w-0">
          <div className="size-9 shrink-0 rounded-full overflow-hidden">
            <Image
              src={LogoIcon}
              alt={clinicName}
              width={36}
              height={36}
              loading="eager"
              className="object-cover"
              priority
            />
          </div>

          {!effectiveCollapsed &&
            (hasMultipleOptions ? (
              <button
                type="button"
                onClick={() => setBranchMenuOpen((o) => !o)}
                disabled={isSwitching}
                className="flex items-center gap-1 flex-1 min-w-0 text-start hover:opacity-70 transition-opacity"
                aria-label={
                  hasMultipleProfiles
                    ? t("switchWorkspace")
                    : t("switchBranch")
                }
              >
                <div className="flex flex-col leading-tight overflow-hidden flex-1 min-w-0">
                  <span className="text-sm text-gray-500 truncate">
                    {clinicName}
                  </span>
                  <span className="text-[11px] text-gray-400 truncate">
                    {clinicBranch}
                  </span>
                </div>
                {isSwitching ? (
                  <Loader2 className="size-3.5 shrink-0 text-gray-400 animate-spin" />
                ) : (
                  <ChevronDown
                    className={cn(
                      "size-3.5 shrink-0 text-gray-400 transition-transform duration-150",
                      branchMenuOpen && "rotate-180",
                    )}
                  />
                )}
              </button>
            ) : (
              <div className="flex flex-col leading-tight overflow-hidden flex-1 min-w-0">
                <span className="text-sm text-gray-500 truncate">
                  {clinicName}
                </span>
                <span className="text-[11px] text-gray-400 truncate">
                  {clinicBranch}
                </span>
              </div>
            ))}
        </div>

        {branchMenuOpen && !effectiveCollapsed && (
          <div className="absolute top-full inset-s-0 inset-e-0 z-50 bg-white border border-gray-100 rounded-xl shadow-lg mt-1 mx-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-[60vh] overflow-y-auto">
            {/* Header */}
            <div className="px-3 pt-2.5 pb-1.5 sticky top-0 bg-white">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {hasMultipleProfiles
                  ? t("switchWorkspace")
                  : t("switchBranch")}
              </span>
            </div>
            <div className="border-t border-gray-100 mb-1" />
            {/* Grouped items */}
            <div className="pb-1 space-y-1">
              {groups.map((group, groupIndex) => (
                <div key={group.profileId}>
                  {hasMultipleProfiles && (
                    <div
                      className={cn(
                        "px-3 pt-1.5 pb-1",
                        groupIndex > 0 && "border-t border-gray-100 mt-1",
                      )}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 truncate block">
                        {group.organizationName}
                      </span>
                    </div>
                  )}
                  <div className="px-1 space-y-0.5">
                    {group.branches.map((b) => {
                      const bId = getBranchId(b) ?? b.id;
                      const activeBranchId = branchId ?? getBranchId(branch);
                      const isActive =
                        group.profileId === activeProfileId &&
                        bId === activeBranchId;
                      const isLoading =
                        isSwitching && switchingToBranchId === bId;
                      const hasName = Boolean(b.name);
                      const hasCity = Boolean(b.city);
                      const label = hasName ? b.name! : b.city || "—";
                      const sublabel =
                        hasName && hasCity && b.name !== b.city
                          ? `(${b.city})`
                          : null;
                      return (
                        <button
                          key={`${group.profileId}-${bId}`}
                          type="button"
                          disabled={isSwitching}
                          onClick={() =>
                            void handleSelect(group.profileId, bId)
                          }
                          className={cn(
                            "w-full flex items-start gap-2 rounded-lg px-2.5 py-2 text-start transition-colors",
                            isActive
                              ? "bg-brand-primary/10 text-brand-primary"
                              : "text-gray-600 hover:bg-gray-50",
                            isSwitching &&
                              !isLoading &&
                              "opacity-40 cursor-not-allowed",
                          )}
                        >
                          <MapPin
                            className={cn(
                              "size-3.5 shrink-0 mt-0.5",
                              isActive
                                ? "text-brand-primary"
                                : "text-gray-400",
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[13px] font-medium leading-tight">
                                {label}
                              </span>
                              {b.is_main && (
                                <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand-secondary/20 text-brand-secondary leading-none">
                                  main
                                </span>
                              )}
                            </div>
                            {sublabel && (
                              <span className="block truncate text-[11px] text-gray-400 leading-tight mt-0.5">
                                {sublabel}
                              </span>
                            )}
                          </div>
                          {isLoading ? (
                            <Loader2 className="size-3.5 shrink-0 text-brand-primary animate-spin mt-0.5" />
                          ) : isActive ? (
                            <Check className="size-3.5 shrink-0 text-brand-primary mt-0.5" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main nav */}
      <SidebarNav
        items={navItems}
        collapsed={effectiveCollapsed}
        dashboardPath={dashboardPath}
      />

      {/* Bottom nav */}
      <div className="px-2 py-3 space-y-0.5 border-t border-gray-100">
        {canUseSettings(profile) && (
          <Link
            href={
              dashboardPath("/settings") as Parameters<typeof Link>[0]["href"]
            }
            title={effectiveCollapsed ? t("settings") : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
              effectiveCollapsed && "justify-center px-0",
              pathname === dashboardPath("/settings") ||
                pathname.startsWith(dashboardPath("/settings") + "/")
                ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
                : "text-gray-400 hover:bg-gray-50 hover:text-brand-black",
            )}
          >
            <Settings className="size-4.5 shrink-0" />
            {!effectiveCollapsed && <span>{t("settings")}</span>}
          </Link>
        )}

        <button
          type="button"
          onClick={() => void handleLogout()}
          title={effectiveCollapsed ? t("logout") : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150",
            effectiveCollapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-4.5 shrink-0" />
          {!effectiveCollapsed && <span>{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
