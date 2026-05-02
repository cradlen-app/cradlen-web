"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import LogoIcon from "@/public/Logo-icon.png";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Pill,
  Briefcase,
  BarChart2,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Check,
  Loader2,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useSwitchBranch } from "@/features/auth/hooks/useSwitchBranch";
import {
  getActiveProfile,
  getDefaultBranch,
  getBranchId,
  getProfileAccount,
  getProfileAccountId,
  getProfileBranches,
  getProfilePrimaryRole,
} from "@/features/auth/lib/current-user";
import { useUserStore } from "@/features/auth/store/userStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { queryClient } from "@/lib/queryClient";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { cn } from "@/lib/utils";
import { canUseSettings } from "./sidebar-access";

type NavItem = {
  path: string;
  key: string;
  icon: LucideIcon;
};

const ALL_STAFF_NAV: NavItem[] = [
  { path: "", key: "dashboard", icon: LayoutDashboard },
  { path: "/calendar", key: "calendar", icon: Calendar },
  { path: "/patients", key: "patients", icon: Users },
  { path: "/staff", key: "staff", icon: UserCheck },
  { path: "/medicine", key: "medicine", icon: Pill },
  { path: "/medical-rep", key: "medicalRep", icon: Briefcase },
  { path: "/analytics", key: "analytics", icon: BarChart2 },
];

type StaffRole = "owner" | "doctor" | "reception";

const NAV_BY_ROLE: Record<StaffRole, NavItem[]> = {
  owner: ALL_STAFF_NAV,
  doctor: ALL_STAFF_NAV,
  reception: [
    { path: "", key: "dashboard", icon: LayoutDashboard },
    { path: "/calendar", key: "calendar", icon: Calendar },
    { path: "/staff", key: "staff", icon: UserCheck },
    { path: "/patients", key: "patients", icon: Users },
  ],
};

type NavLinkProps = {
  href: string;
  path: string;
  collapsed: boolean;
  label: string;
  isActive: boolean;
  icon: LucideIcon;
};

function NavLink({
  href,
  collapsed,
  label,
  isActive,
  icon: Icon,
}: NavLinkProps) {
  return (
    <Link
      href={href as Parameters<typeof Link>[0]["href"]}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
          : "text-gray-400 hover:bg-gray-50 hover:text-brand-black",
      )}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [switchingToBranchId, setSwitchingToBranchId] = useState<string | null>(null);
  const branchMenuRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const dashboardPath = useDashboardPath();
  const { data: user } = useCurrentUser();
  const clearUser = useUserStore((s) => s.clearUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearContext = useAuthContextStore((s) => s.clearContext);
  const branchId = useAuthContextStore((s) => s.branchId);
  const profileId = useAuthContextStore((s) => s.profileId);
  const setContext = useAuthContextStore((s) => s.setContext);
  const switchBranch = useSwitchBranch();

  useEffect(() => {
    if (!branchMenuOpen) return;
    function handler(e: MouseEvent) {
      if (!branchMenuRef.current?.contains(e.target as Node))
        setBranchMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [branchMenuOpen]);

  const profile = getActiveProfile(user);
  const rawRole = getProfilePrimaryRole(profile);
  if (rawRole === "patient" || rawRole === "unknown") return null;
  const role = rawRole as StaffRole;
  const navItems = NAV_BY_ROLE[role];

  const account = getProfileAccount(profile);
  const branch = getDefaultBranch(profile, branchId);
  const branches = getProfileBranches(profile);
  const hasMultipleBranches = branches.length > 1;
  const clinicName = account?.name ?? "-";
  const clinicBranch = branch?.city ? `${branch.city} branch` : "-";

  async function handleBranchSwitch(newBranchId: string) {
    if (!profile) return;
    setSwitchingToBranchId(newBranchId);
    try {
      await switchBranch.mutateAsync({ branch_id: newBranchId });
      const orgId = getProfileAccountId(profile);
      if (!orgId) {
        setSwitchingToBranchId(null);
        toast.error(t("switchBranchError"));
        return;
      }
      setContext({
        accountId: orgId,
        branchId: newBranchId,
        profileId: profileId ?? "",
      });
      queryClient.clear();
      const dashboardSegment = pathname.split("/").slice(3).join("/");
      router.replace(`/${orgId}/${newBranchId}/${dashboardSegment}`);
      setBranchMenuOpen(false);
    } catch (error) {
      console.error("[branch-switch]", error);
      setSwitchingToBranchId(null);
      toast.error(t("switchBranchError"));
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // proceed with local logout even if the API call fails
    }
    clearSession();
    clearContext();
    clearUser();
    router.replace("/sign-in");
  }

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
                disabled={switchBranch.isPending}
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
                {switchBranch.isPending ? (
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
                    disabled={switchBranch.isPending}
                    onClick={() => void handleBranchSwitch(bId)}
                    className={cn(
                      "w-full flex items-start gap-2 rounded-lg px-2.5 py-2 text-start transition-colors",
                      isActive
                        ? "bg-brand-primary/10 text-brand-primary"
                        : "text-gray-600 hover:bg-gray-50",
                      switchBranch.isPending && !isLoading && "opacity-40 cursor-not-allowed",
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
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navItems.map((item) => {
          const href = dashboardPath(item.path);
          const isActive =
            item.path === ""
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
          return (
            <NavLink
              key={item.path}
              href={href}
              path={item.path}
              collapsed={collapsed}
              label={t(item.key as Parameters<typeof t>[0])}
              isActive={isActive}
              icon={item.icon}
            />
          );
        })}
      </nav>

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
              pathname === dashboardPath("/settings")
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
          onClick={handleLogout}
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
