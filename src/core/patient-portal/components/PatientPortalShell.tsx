"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import LogoIcon from "@/public/Logo-icon.png";
import { cn } from "@/common/utils/utils";
import { Link, usePathname } from "@/i18n/navigation";
import { PORTAL_NAV } from "../shell-nav";
import { ProfileSwitcher } from "./ProfileSwitcher";

/**
 * Responsive hybrid shell: a left sidebar on desktop (md+) and a bottom tab bar
 * on mobile. Same screens render inside `main` on every device. A persistent
 * top bar carries the profile switcher so context is always visible.
 */
export function PatientPortalShell({ children }: { children: ReactNode }) {
  const t = useTranslations("patientPortal");
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/patient") return pathname === "/patient";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const primary = PORTAL_NAV.filter((i) => i.primary);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-e border-gray-100 bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-4">
          <span className="size-9 overflow-hidden rounded-full">
            <Image src={LogoIcon} alt="Cradlen" width={36} height={36} priority />
          </span>
          <span className="text-sm font-semibold text-brand-primary">
            {t("shell.brand")}
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
          {PORTAL_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as Parameters<typeof Link>[0]["href"]}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
                    : "text-gray-500 hover:bg-gray-50 hover:text-brand-black",
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="truncate">
                  {t(item.labelKey as Parameters<typeof t>[0])}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-2 border-b border-gray-100 bg-brand-primary px-3 py-2 md:bg-white">
          <ProfileSwitcher light />
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-full p-2 text-white/90 hover:bg-white/10 md:text-gray-500 md:hover:bg-gray-100"
          >
            <Bell className="size-5" />
          </button>
        </header>

        {/* Scrollable content (extra bottom padding clears the mobile tab bar) */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-6">
          <div className="mx-auto w-full max-w-2xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-gray-100 bg-white px-1 py-1.5 md:hidden">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as Parameters<typeof Link>[0]["href"]}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors",
                active ? "text-brand-primary" : "text-gray-400",
              )}
            >
              <Icon className="size-5" />
              <span className="truncate">
                {t(item.labelKey as Parameters<typeof t>[0])}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
