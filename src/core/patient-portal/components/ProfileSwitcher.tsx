"use client";

import { useState } from "react";
import { ChevronDown, Check, FileUp, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import {
  useActivePatientId,
  usePatientProfiles,
} from "../hooks/usePatientProfiles";
import { usePatientProfileStore } from "../store/patientProfileStore";

/**
 * Always-visible switcher between the account holder and dependents, so the
 * "whose record am I viewing" context is never ambiguous.
 */
export function ProfileSwitcher({ light = false }: { light?: boolean }) {
  const t = useTranslations("patientPortal");
  const [open, setOpen] = useState(false);
  const { data: profiles } = usePatientProfiles();
  const activeId = useActivePatientId();
  const setActive = usePatientProfileStore((s) => s.setActiveProfile);

  const active = profiles?.find((p) => p.id === activeId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold transition-colors",
          light
            ? "text-white hover:bg-white/10"
            : "text-brand-black hover:bg-gray-100",
        )}
      >
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-base",
            light ? "bg-white/20" : "bg-brand-secondary/30",
          )}
        >
          {active?.avatar ?? "👤"}
        </span>
        <span className="max-w-28 truncate">
          {active?.kind === "self" ? t("shell.you") : active?.fullName}
        </span>
        <ChevronDown className="size-4 opacity-70" />
      </button>

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
            className="absolute z-50 mt-2 w-60 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg ltr:left-0 rtl:right-0"
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
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-secondary/20 text-lg">
                    {p.avatar ?? "👤"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-brand-black">
                      {p.fullName}
                    </span>
                    <span className="block truncate text-xs text-gray-400">
                      {p.kind === "self" ? t("shell.you") : p.relation}
                    </span>
                  </span>
                  {isActive && (
                    <Check className="size-4 shrink-0 text-brand-primary" />
                  )}
                </button>
              );
            })}

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
          </div>
        </>
      )}
    </div>
  );
}
