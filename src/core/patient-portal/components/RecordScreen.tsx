"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { formatDate } from "../lib/format";
import { useHealthRecord } from "../hooks/usePortalData";
import { ClinicTag, EmptyState, ScreenHeader, SectionCard } from "./portal-ui";

export function RecordScreen() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { data: record, isLoading } = useHealthRecord();

  const latestVitals = record?.vitals.at(-1);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ScreenHeader title={t("record.title")} />

      {/* Vitals */}
      <SectionCard title={t("record.vitalsTrend")}>
        {latestVitals ? (
          <div className="grid grid-cols-3 gap-2">
            <Vital
              label={t("record.bloodPressure")}
              value={
                latestVitals.systolic
                  ? `${latestVitals.systolic}/${latestVitals.diastolic}`
                  : "—"
              }
            />
            <Vital
              label={t("record.weight")}
              value={latestVitals.weightKg ? `${latestVitals.weightKg} kg` : "—"}
            />
            <Vital
              label={t("record.bmi")}
              value={latestVitals.bmi ? `${latestVitals.bmi}` : "—"}
            />
          </div>
        ) : (
          <EmptyState message="—" />
        )}
      </SectionCard>

      {/* Allergies */}
      <SectionCard title={t("record.allergies")}>
        {record && record.allergies.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {record.allergies.map((a) => (
              <li
                key={a.id}
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700"
              >
                {a.substance}
                {a.reaction ? ` · ${a.reaction}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-1 text-sm text-gray-400">{t("record.noAllergies")}</p>
        )}
      </SectionCard>

      {/* Visit timeline */}
      <SectionCard title={t("record.timeline")}>
        {isLoading ? (
          <EmptyState message={t("common.loading")} />
        ) : !record || record.visits.length === 0 ? (
          <EmptyState message={t("record.noVisits")} />
        ) : (
          <ol className="space-y-0">
            {record.visits.map((v, i) => (
              <li key={v.id} className="relative flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="mt-1 size-2.5 rounded-full bg-brand-primary" />
                  {i < record.visits.length - 1 && (
                    <span className="w-px flex-1 bg-gray-200" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-gray-500">
                      {formatDate(v.date, locale)}
                    </span>
                    <ClinicTag clinic={v.clinic} />
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-brand-black">
                    {v.reason ?? v.specialty}
                  </p>
                  {v.diagnosis && (
                    <p className="text-xs text-gray-600">
                      <span className="text-gray-400">
                        {t("record.diagnosis")}:{" "}
                      </span>
                      {v.diagnosis}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">
                    {v.doctorName} · {v.specialty}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </div>
  );
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("rounded-xl bg-gray-50 p-3 text-center")}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-brand-black">{value}</p>
    </div>
  );
}
