"use client";

import Image from "next/image";
import { Bell, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

import Logo from "@/public/Logo.png";
import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import { usePatientProfiles } from "@/core/patient-portal/api";
import { PatientProfileSwitcher } from "./PatientProfileSwitcher";

function IconButton({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative size-9 flex items-center justify-center rounded-full text-gray-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all duration-150"
    >
      {children}
      {badge && (
        <span className="absolute top-1.5 inset-e-1.5 size-2 rounded-full bg-brand-primary ring-2 ring-white" />
      )}
    </button>
  );
}

/**
 * Patient portal top bar — mirrors the staff `Navbar`. On desktop the right
 * side shows the account holder (the `self` profile); on mobile it shows the
 * profile switcher (the sidebar, which normally hosts it, is hidden on mobile).
 */
export function PatientNavbar() {
  const t = useTranslations("patientPortal");
  const { data: profiles } = usePatientProfiles();
  const self = profiles?.find((p) => p.kind === "self");

  return (
    <header className="relative h-16 flex items-center justify-between gap-3 px-6 border-b border-gray-100 shrink-0">
      {/* Logo — centered on mobile, start-aligned on desktop */}
      <Link
        href="/patient"
        aria-label="Cradlen home"
        className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 w-30 shrink-0 inline-flex"
      >
        <Image src={Logo} alt="CRADLEN" className="w-auto" priority />
      </Link>

      {/* Right section */}
      <div className="ms-auto flex items-center gap-1">
        <IconButton label="Notifications" badge>
          <Bell className="size-5" />
        </IconButton>
        <IconButton label="Messages">
          <Mail className="size-5" />
        </IconButton>

        {/* Mobile: profile switcher (sidebar is hidden) */}
        <div className="lg:hidden">
          <PatientProfileSwitcher variant="navbar" />
        </div>

        {/* Desktop: account holder */}
        <div className="hidden lg:flex items-center gap-1">
          <div className="w-px h-5 bg-gray-200 mx-1.5" />
          <div className="flex items-center gap-2.5 h-10 ps-1 pe-3.5 rounded-full">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-secondary/30 text-base ring-2 ring-white shadow-sm">
              {self?.avatar ?? "👤"}
            </span>
            <div className="flex flex-col items-start leading-none gap-0.5">
              <span className="text-sm text-brand-black whitespace-nowrap">
                {self?.fullName ?? "—"}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-none whitespace-nowrap text-brand-primary/70",
                )}
              >
                {t("shell.accountRole")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
