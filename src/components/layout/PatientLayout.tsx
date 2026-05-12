"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import LogoIcon from "@/public/Logo-icon.png";
import {
  LayoutDashboard,
  Pill,
  FlaskConical,
  Calendar,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, Link, useRouter } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveRole } from "@/features/auth/lib/current-user";
import { useUserStore } from "@/features/auth/store/userStore";
import { useAuthStore } from "@/features/auth/store/authStore";
import { cn } from "@/common/utils/utils";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

const PATIENT_NAV: NavItem[] = [
  { href: "/patient/dashboard", labelKey: "home", icon: LayoutDashboard },
  { href: "/patient/medicines", labelKey: "medicines", icon: Pill },
  { href: "/patient/tests", labelKey: "tests", icon: FlaskConical },
  { href: "/patient/calendar", labelKey: "calendar", icon: Calendar },
  { href: "/patient/profile", labelKey: "profile", icon: User },
];

type Props = {
  children: React.ReactNode;
};

export function PatientLayout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations("patientNav");
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const clearUser = useUserStore((s) => s.clearUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const role = getActiveRole(user);

  useEffect(() => {
    if (isLoading || !role) return;
    if (role !== "patient") {
      router.replace("/dashboard");
    }
  }, [isLoading, role, router]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // proceed with local logout even if the API call fails
    }
    clearSession();
    clearUser();
    router.replace("/sign-in");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={cn(
          "flex flex-col h-full bg-white border-e border-gray-100 rounded-2xl transition-[width] duration-200 ease-in-out shrink-0",
          collapsed ? "w-15" : "w-55",
        )}
      >
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

        <div className="flex items-center gap-2.5 px-3 py-4 border-b border-gray-100 min-w-0">
          <div className="size-9 shrink-0 rounded-full overflow-hidden">
            <Image
              src={LogoIcon}
              alt="Cradlen"
              width={36}
              height={36}
              className="object-cover"
              priority
            />
          </div>
          {!collapsed && (
            <span className="text-sm text-gray-500 truncate">Cradlen</span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {PATIENT_NAV.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const label = t(item.labelKey as Parameters<typeof t>[0]);
            return (
              <Link
                key={item.href}
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
          })}
        </nav>

        <div className="px-2 py-3 border-t border-gray-100">
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

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
