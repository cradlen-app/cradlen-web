"use client";

import { useState } from "react";
import { ChevronDown, Check, FileUp, LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import { usePatientLogout } from "@/features/auth/hooks/usePatientAuth";
import {
  useActivePatientId,
  usePatientProfiles,
  usePatientProfileStore,
} from "@/core/patient-portal/api";
import { PatientAvatar } from "./PatientAvatar";

type Variant = "sidebar" | "navbar";

/**
 * Switches the active patient profile (self + dependents). Two presentations:
 * - `sidebar` — mirrors the staff branch switcher in the sidebar header
 *   (logo + active profile name + chevron, dropdown below).
 * - `navbar` — compact trigger for the mobile top bar; its menu also carries
 *   Documents/Profile links (those screens aren't in the mobile tab bar).
 */
export function PatientProfileSwitcher({
  variant,
  collapsed = false,
}: {
  variant: Variant;
  collapsed?: boolean;
}) {
  const t = useTranslations("patientPortal");
  const [open, setOpen] = useState(false);
  const { data: profiles } = usePatientProfiles();
  const activeId = useActivePatientId();
  const setActive = usePatientProfileStore((s) => s.setActiveProfile);
  const logout = usePatientLogout();

  // `profiles` already carries the real signed-in identity (sourced from
  // /patient-auth/me); dependents use a generic label until per-relation
  // labelling lands.
  const active = profiles?.find((p) => p.id === activeId);
  const activeLabel =
    active?.kind === "self" ? t("shell.you") : (active?.fullName ?? "");

  // Collapsed sidebar: just the brand logo, no switching affordance.
  if (variant === "sidebar" && collapsed) {
    return (
      <div className="flex justify-center py-4">
        <PatientAvatar
          imageUrl={active?.imageUrl}
          alt={active?.fullName ?? ""}
          className="size-9"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      {variant === "sidebar" ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 px-3 py-4 text-start transition-opacity hover:opacity-70"
        >
          <PatientAvatar
            imageUrl={active?.imageUrl}
            alt={active?.fullName ?? ""}
            className="size-9"
          />
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm text-brand-black">
              {active?.fullName}
            </span>
            <span className="truncate text-[11px] text-gray-400">
              {active?.kind === "self" ? t("shell.you") : t("shell.dependent")}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 shrink-0 text-gray-400 transition-transform duration-150",
              open && "rotate-180",
            )}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-brand-black transition-colors hover:bg-gray-100"
        >
          <PatientAvatar
            imageUrl={active?.imageUrl}
            alt={active?.fullName ?? ""}
            className="size-8"
          />
          <span className="max-w-28 truncate">{activeLabel}</span>
          <ChevronDown className="size-4 opacity-70" />
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            aria-label="close"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className={cn(
              "absolute z-50 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg",
              variant === "sidebar"
                ? "top-full mx-2 mt-1 inset-s-0"
                : "mt-2 ltr:right-0 rtl:left-0",
            )}
          >
            <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {t("shell.switchProfile")}
            </p>
            {profiles?.map((p) => {
              const isActive = p.id === activeId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isActive}
                  onClick={() => {
                    setActive(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm transition-colors hover:bg-gray-50",
                    isActive && "bg-brand-primary/5",
                  )}
                >
                  <PatientAvatar
                    imageUrl={p.imageUrl}
                    alt={p.fullName}
                    className="size-8"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-brand-black">
                      {p.fullName}
                    </span>
                    <span className="block truncate text-xs text-gray-400">
                      {p.kind === "self" ? t("shell.you") : t("shell.dependent")}
                    </span>
                  </span>
                  {isActive && (
                    <Check className="size-4 shrink-0 text-brand-primary" />
                  )}
                </button>
              );
            })}

            {variant === "navbar" && (
              <div className="mt-1 border-t border-gray-100 pt-1">
                <Link
                  href="/patient/documents"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <FileUp className="size-4 shrink-0" />
                  {t("nav.documents")}
                </Link>
                <Link
                  href="/patient/profile"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <User className="size-4 shrink-0" />
                  {t("nav.profile")}
                </Link>
              </div>
            )}

            {/* Logout only in the navbar (mobile) menu — on desktop the sidebar
                footer owns logout; the sidebar is hidden on mobile. */}
            {variant === "navbar" && (
              <div className="mt-1 border-t border-gray-100 pt-1">
                <button
                  type="button"
                  role="menuitem"
                  disabled={logout.isPending}
                  onClick={() => {
                    setOpen(false);
                    logout.mutate();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <LogOut className="size-4 shrink-0" />
                  {t("shell.logout")}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
