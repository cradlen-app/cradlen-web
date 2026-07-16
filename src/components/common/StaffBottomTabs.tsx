"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link, usePathname } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { hasAnyStaffRole } from "@/features/auth/lib/permissions";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { useStaffNavItems, STAFF_PRIMARY_TAB_PATHS } from "./staff-nav";
import { StaffMoreSheet } from "./StaffMoreSheet";

export function StaffBottomTabs() {
  const t = useTranslations();
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const dashboardPath = useDashboardPath();
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: user } = useCurrentUser();
  const profile = getActiveProfile(user);
  const navItems = useStaffNavItems();

  if (!hasAnyStaffRole(profile)) return null;

  const primaryItems = (STAFF_PRIMARY_TAB_PATHS as readonly string[])
    .map((path) => navItems.find((item) => item.path === path))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <>
      {/* Static flex item (not a fixed overlay) so the layout column reserves
          real space for it — page content can never render underneath. Keeps
          z-50 to paint above the fixed StaffMoreSheet overlay (z-40). */}
      <nav className="relative z-50 flex h-[calc(4rem+env(safe-area-inset-bottom))] shrink-0 items-center justify-around border-t border-gray-100 bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primaryItems.map((item) => {
          const href = dashboardPath(item.path);
          const active =
            item.path === ""
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={href as Parameters<typeof Link>[0]["href"]}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors",
                active ? "text-brand-primary" : "text-gray-400",
              )}
            >
              <Icon className="size-5" />
              <span className="truncate">
                {t(item.key as Parameters<typeof t>[0])}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 rounded-lg text-[10px] font-medium transition-colors",
            moreOpen ? "text-brand-primary" : "text-gray-400",
          )}
        >
          <MoreHorizontal className="size-5" />
          <span className="truncate">{tNav("more")}</span>
        </button>
      </nav>

      <StaffMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
