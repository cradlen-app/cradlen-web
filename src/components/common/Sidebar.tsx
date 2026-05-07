"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getProfileOrganization,
  getProfilePrimaryRole,
  getBranchId,
} from "@/features/auth/lib/current-user";
import { STAFF_ROLE } from "@/features/auth/lib/auth.constants";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { cn } from "@/lib/utils";
import { canUseSettings } from "./sidebar-access";
import { SidebarNav, type SidebarNavItem } from "./SidebarNav";
import { useSidebarBranchSwitch } from "./hooks/useSidebarBranchSwitch";
import { useLogout } from "./hooks/useLogout";

const OWNER_NAV: SidebarNavItem[] = [
  { path: "", key: "dashboard", icon: LayoutDashboard },
  { path: "/visits", key: "visits", icon: ClipboardList },
  { path: "/calendar", key: "calendar", icon: Calendar },
  { path: "/patients", key: "patients", icon: Users },
  { path: "/staff", key: "staff", icon: UserCheck },
  { path: "/medicine", key: "medicine", icon: Pill },
  { path: "/medical-rep", key: "medicalRep", icon: Briefcase },
  { path: "/analytics", key: "analytics", icon: BarChart2 },
];

type StaffRole = "owner" | "doctor" | "reception";

const NAV_BY_ROLE: Record<StaffRole, SidebarNavItem[]> = {
  owner: OWNER_NAV,
  doctor: [
    { path: "", key: "dashboard", icon: LayoutDashboard },
    { path: "/visits", key: "visits", icon: ClipboardList },
    { path: "/calendar", key: "calendar", icon: Calendar },
    { path: "/patients", key: "patients", icon: Users },
    { path: "/medicine", key: "medicine", icon: Pill },
  ],
  reception: [
    { path: "", key: "dashboard", icon: LayoutDashboard },
    { path: "/visits", key: "visits", icon: ClipboardList },
    { path: "/calendar", key: "calendar", icon: Calendar },
    { path: "/patients", key: "patients", icon: Users },
    { path: "/staff", key: "staff", icon: UserCheck },
  ],
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations("nav");
  const pathname = usePathname();
  const dashboardPath = useDashboardPath();
  const { data: user } = useCurrentUser();

  const profile = getActiveProfile(user);
  const rawRole = getProfilePrimaryRole(profile);

  const {
    branchMenuOpen,
    setBranchMenuOpen,
    branchMenuRef,
    switchingToBranchId,
    isSwitching,
    branch,
    branches,
    branchId,
    hasMultipleBranches,
    handleBranchSwitch,
  } = useSidebarBranchSwitch(profile);

  const { handleLogout } = useLogout();

  if (rawRole === "patient" || rawRole === STAFF_ROLE.UNKNOWN) return null;

  const role = rawRole as StaffRole;
  const navItems = NAV_BY_ROLE[role];
  const organization = getProfileOrganization(profile);
  const clinicName = organization?.name ?? "-";
  const clinicBranch = branch?.city
    ? t("branchLabel", { city: branch.city })
    : "-";

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-white border-e border-gray-100 rounded-2xl  transition-[width] duration-200 ease-in-out shrink-0",
        collapsed ? "w-15" : "w-55",
      )}
    >
      {/* Collapsed button */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          "text-gray-400 hover:text-brand-primary transition-colors shrink-0 rounded-md p-0.5 mr-2 mt-2",
          collapsed ? "mx-auto" : "ms-auto",
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
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

          {!collapsed &&
            (hasMultipleBranches ? (
              <button
                type="button"
                onClick={() => setBranchMenuOpen((o) => !o)}
                disabled={isSwitching}
                className="flex items-center gap-1 flex-1 min-w-0 text-start hover:opacity-70 transition-opacity"
                aria-label={t("switchBranch")}
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

        {branchMenuOpen && !collapsed && (
          <div className="absolute top-full start-0 end-0 z-50 bg-white border border-gray-100 rounded-xl shadow-lg mt-1 mx-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="px-3 pt-2.5 pb-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {t("switchBranch")}
              </span>
            </div>
            <div className="border-t border-gray-100 mb-1" />
            {/* Branch items */}
            <div className="px-1 pb-1 space-y-0.5">
              {branches.map((b) => {
                const bId = getBranchId(b) ?? b.id;
                const isActive = bId === (branchId ?? getBranchId(branch));
                const isLoading = switchingToBranchId === bId;
                const label = b.name || b.city;
                const sublabel = b.name ? b.city : null;
                return (
                  <button
                    key={bId}
                    type="button"
                    disabled={isSwitching}
                    onClick={() => void handleBranchSwitch(bId)}
                    className={cn(
                      "w-full flex items-start gap-2 rounded-lg px-2.5 py-2 text-start transition-colors",
                      isActive
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-gray-600 hover:bg-gray-50",
                      isSwitching && !isLoading && "opacity-40 cursor-not-allowed",
                    )}
                  >
                    <MapPin
                      className={cn(
                        "size-3.5 shrink-0 mt-0.5",
                        isActive ? "text-brand-primary" : "text-gray-400",
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
        )}
      </div>

      {/* Main nav */}
      <SidebarNav
        items={navItems}
        collapsed={collapsed}
        dashboardPath={dashboardPath}
      />

      {/* Bottom nav */}
      <div className="px-2 py-3 space-y-0.5 border-t border-gray-100">
        {canUseSettings(role) && (
          <Link
            href={
              dashboardPath("/settings") as Parameters<typeof Link>[0]["href"]
            }
            title={collapsed ? t("settings") : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
              collapsed && "justify-center px-0",
              pathname === dashboardPath("/settings") ||
              pathname.startsWith(dashboardPath("/settings") + "/")
                ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
                : "text-gray-400 hover:bg-gray-50 hover:text-brand-black",
            )}
          >
            <Settings className="size-4.5 shrink-0" />
            {!collapsed && <span>{t("settings")}</span>}
          </Link>
        )}

        <button
          type="button"
          onClick={() => void handleLogout()}
          title={collapsed ? t("logout") : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-4.5 shrink-0" />
          {!collapsed && <span>{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
