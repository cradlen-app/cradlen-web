"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { formatDate } from "../lib/format";
import { useMedications } from "../hooks/usePortalData";
import type { PortalMedication } from "../types/patient-portal.types";
import { ClinicTag, EmptyState, ScreenHeader, SectionCard } from "./portal-ui";

export function MedicationsScreen() {
  const t = useTranslations("patientPortal");
  const { data: meds, isLoading } = useMedications();

  const active = useMemo(
    () => (meds ?? []).filter((m) => m.status === "active"),
    [meds],
  );
  const past = useMemo(
    () => (meds ?? []).filter((m) => m.status === "past"),
    [meds],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ScreenHeader title={t("medications.title")} />

      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : (meds?.length ?? 0) === 0 ? (
        <EmptyState message={t("medications.none")} />
      ) : (
        <>
          <SectionCard title={t("medications.active")}>
            {active.length === 0 ? (
              <p className="py-1 text-sm text-gray-400">
                {t("medications.none")}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {active.map((m) => (
                  <MedRow key={m.id} med={m} />
                ))}
              </ul>
            )}
          </SectionCard>

          {past.length > 0 && (
            <SectionCard title={t("medications.past")}>
              <ul className="divide-y divide-gray-100">
                {past.map((m) => (
                  <MedRow key={m.id} med={m} muted />
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}

function MedRow({ med, muted }: { med: PortalMedication; muted?: boolean }) {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  return (
    <li className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-brand-black">
            {med.name}
          </p>
          {muted && (
            <span className="text-[10px] text-gray-400">
              {t("medications.past")}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600">
          {med.dose} · {med.frequency}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {t("medications.prescribedBy")} {med.prescriberName} ·{" "}
          {t("medications.since", { date: formatDate(med.startDate, locale) })}
        </p>
      </div>
      <ClinicTag clinic={med.clinic} />
    </li>
  );
}
