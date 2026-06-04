"use client";

import { useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { PATIENT_NAV, patientHref } from "./patient-nav";
import { PatientProfileSwitcher } from "./PatientProfileSwitcher";
import { SidebarNav, type SidebarNavItem } from "./SidebarNav";
import { usePatientLogout } from "@/features/auth/hooks/usePatientAuth";

const NAV_ITEMS: SidebarNavItem[] = PATIENT_NAV.map(({ path, key, icon }) => ({
  path,
  key,
  icon,
}));

/**
 * Desktop patient sidebar (hidden on mobile, where the bottom tab bar takes
 * over). Mirrors the staff `Sidebar`: collapse toggle, a header switcher (the
 * profile switcher here, like the branch switcher there), the shared
 * `SidebarNav`, and a logout footer.
 */
export function PatientSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations("patientPortal");
  const logout = usePatientLogout();

  return (
    <aside
      className={cn(
        "relative hidden lg:flex flex-col h-full bg-white border-e border-gray-100 rounded-2xl transition-[width] duration-200 ease-in-out shrink-0",
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

      {/* Header: profile switcher (mirrors the staff branch switcher) */}
      <div className="relative border-b border-gray-100">
        <PatientProfileSwitcher variant="sidebar" collapsed={collapsed} />
      </div>

      {/* Main nav */}
      <SidebarNav
        items={NAV_ITEMS}
        collapsed={collapsed}
        dashboardPath={patientHref}
      />

      {/* Bottom: logout */}
      <div className="px-2 py-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          title={collapsed ? t("shell.logout") : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150 disabled:opacity-50",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-4.5 shrink-0" />
          {!collapsed && <span>{t("shell.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
