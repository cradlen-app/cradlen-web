"use client";

import { useState } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useUserStore } from "@/features/auth/store/userStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { apiAuthFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/user.types";

type NavItem = {
  href: string;
  key: string;
  icon: LucideIcon;
};

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  owner: [
    { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/calendar", key: "calendar", icon: Calendar },
    { href: "/dashboard/patients", key: "patients", icon: Users },
    { href: "/dashboard/staff", key: "staff", icon: UserCheck },
    { href: "/dashboard/medicine", key: "medicine", icon: Pill },
    { href: "/dashboard/medical-rep", key: "medicalRep", icon: Briefcase },
    { href: "/dashboard/analytics", key: "analytics", icon: BarChart2 },
  ],
  receptionist: [
    { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/calendar", key: "calendar", icon: Calendar },
    { href: "/dashboard/patients", key: "patients", icon: Users },
  ],
  doctor: [
    { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
    { href: "/dashboard/calendar", key: "calendar", icon: Calendar },
    { href: "/dashboard/patients", key: "patients", icon: Users },
    { href: "/dashboard/medicine", key: "medicine", icon: Pill },
  ],
};

type NavLinkProps = {
  item: NavItem;
  collapsed: boolean;
  label: string;
  isActive: boolean;
};

function NavLink({ item, collapsed, label, isActive }: NavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href as Parameters<typeof Link>[0]["href"]}
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
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const clearUser = useUserStore((s) => s.clearUser);
  const clearTokens = useAuthStore((s) => s.clearTokens);

  const profile = user?.profiles?.[0];
  const role: UserRole = profile?.role.name ?? "owner";
  const navItems = NAV_BY_ROLE[role];

  const clinicName = profile?.organization.name ?? "-";
  const clinicBranch = profile?.branch?.city
    ? `${profile.branch.city} branch`
    : "-";

  async function handleLogout() {
    try {
      await apiAuthFetch("/auth/logout", { method: "POST" });
    } catch {
      // proceed with local logout even if the API call fails
    }
    clearTokens();
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
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-gray-100 min-w-0">
        <div className="size-9 shrink-0 rounded-full overflow-hidde">
          <Image
            src={LogoIcon}
            alt={clinicName}
            width={36}
            height={36}
            className="object-cover"
            priority
          />
        </div>

        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden flex-1 min-w-0">
            <span className="text-sm  text-gray-500 truncate">
              {clinicName}
            </span>
            <span className="text-[11px] text-gray-400 truncate">
              {clinicBranch}
            </span>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              label={t(item.key as Parameters<typeof t>[0])}
              isActive={isActive}
            />
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 py-3 space-y-0.5 border-t border-gray-100">
        <Link
          href="/dashboard/settings"
          title={collapsed ? t("settings") : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
            collapsed && "justify-center px-0",
            pathname === "/dashboard/settings"
              ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
              : "text-gray-400 hover:bg-gray-50 hover:text-brand-black",
          )}
        >
          <Settings className="size-4.5 shrink-0" />
          {!collapsed && <span>{t("settings")}</span>}
        </Link>

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
