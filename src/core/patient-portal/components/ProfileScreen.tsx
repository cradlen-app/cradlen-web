"use client";

import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

import { cn } from "@/common/utils/utils";
import { ageFromDob, formatDate } from "../lib/format";
import {
  useActivePatientId,
  usePatientProfiles,
} from "../hooks/usePatientProfiles";
import { usePatientProfileStore } from "../store/patientProfileStore";
import { EmptyState, ScreenHeader, SectionCard } from "./portal-ui";

export function ProfileScreen() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { data: profiles, isLoading } = usePatientProfiles();
  const activeId = useActivePatientId();
  const setActive = usePatientProfileStore((s) => s.setActiveProfile);

  const self = profiles?.find((p) => p.kind === "self");
  const dependents = profiles?.filter((p) => p.kind === "dependent") ?? [];

  return (
    <div className="space-y-4">
      <ScreenHeader title={t("profile.title")} />

      {isLoading || !self ? (
        <EmptyState message={t("common.loading")} />
      ) : (
        <>
          <SectionCard title={t("profile.account")}>
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand-secondary/20 text-2xl">
                {self.avatar ?? "👤"}
              </span>
              <div>
                <p className="text-base font-bold text-brand-black">
                  {self.fullName}
                </p>
                <p className="text-xs text-gray-500">
                  {t("profile.nationalId")}: {self.nationalId}
                </p>
                <p className="text-xs text-gray-500">
                  {t("profile.dateOfBirth")}: {formatDate(self.dateOfBirth, locale)}
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t("profile.dependents")}>
            {dependents.length === 0 ? (
              <p className="py-1 text-sm text-gray-400">—</p>
            ) : (
              <ul className="space-y-1.5">
                {dependents.map((d) => {
                  const isActive = d.id === activeId;
                  const age = ageFromDob(d.dateOfBirth);
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => setActive(d.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-2.5 text-start transition-colors",
                          isActive
                            ? "border-brand-primary bg-brand-primary/5"
                            : "border-gray-100 hover:bg-gray-50",
                        )}
                      >
                        <span className="flex size-9 items-center justify-center rounded-full bg-brand-secondary/20 text-lg">
                          {d.avatar ?? "👤"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-brand-black">
                            {d.fullName}
                          </span>
                          <span className="block text-xs text-gray-400">
                            {d.relation}
                            {age !== undefined ? ` · ${age}` : ""}
                          </span>
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-bold text-brand-primary">
                            {t("profile.viewing")}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 py-3 text-sm font-semibold text-red-600"
          >
            <LogOut className="size-4" />
            {t("shell.logout")}
          </button>
        </>
      )}
    </div>
  );
}
