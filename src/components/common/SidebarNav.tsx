"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";
import type { LucideIcon } from "lucide-react";

export type SidebarNavItem = {
  path: string;
  /** Full i18n key (e.g. "nav.dashboard" or "staff.nav.label"). */
  key: string;
  icon: LucideIcon;
};

type SidebarNavProps = {
  items: SidebarNavItem[];
  collapsed: boolean;
  dashboardPath: (path: string) => string;
};

export function SidebarNav({ items, collapsed, dashboardPath }: SidebarNavProps) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
      {items.map((item) => {
        const href = dashboardPath(item.path);
        const isActive =
          item.path === ""
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
        const Icon = item.icon;
        const label = t(item.key as Parameters<typeof t>[0]);
        return (
          <Link
            key={item.path}
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
      })}
    </nav>
  );
}
