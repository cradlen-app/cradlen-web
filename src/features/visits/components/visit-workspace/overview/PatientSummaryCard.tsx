"use client";

import { useTranslations } from "next-intl";
import { usePatient } from "@/features/patients/hooks/usePatient";
import type { ApiPatient } from "@/features/visits/types/visits.api.types";

type Props = {
  patientId: string;
  fallbackFullName?: string;
};

function initials(fullName?: string) {
  if (!fullName) return "?";
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function ageFromDob(dob?: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.2425);
  return Math.floor(years);
}

function handleFromName(fullName?: string, id?: string) {
  const base = fullName?.trim().replace(/\s+/g, "_").toLowerCase();
  if (base) return `@${base}`;
  return id ? `@${id.slice(0, 8)}` : "";
}

export function PatientSummaryCard({ patientId, fallbackFullName }: Props) {
  const t = useTranslations("visits.workspace.patient");
  const { data, isLoading } = usePatient(patientId);
  const patient: ApiPatient | undefined = data?.data;

  const fullName = patient?.full_name ?? fallbackFullName ?? "";
  const age = ageFromDob(patient?.date_of_birth);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-16 bg-brand-primary" aria-hidden="true" />
      <div className="-mt-8 flex flex-col items-center px-6 pb-6">
        <div
          className="flex size-16 items-center justify-center rounded-full bg-brand-primary text-base font-semibold text-white ring-4 ring-white"
          aria-hidden="true"
        >
          {initials(fullName)}
        </div>
        <h2 className="mt-3 text-base font-semibold text-brand-black">
          {fullName || (isLoading ? "…" : t("unknown"))}
        </h2>
        <p className="text-xs text-gray-400">
          {handleFromName(fullName, patient?.id ?? patientId)}
        </p>
        <dl className="mt-5 w-full space-y-3 text-sm">
          <Row label={t("age")} value={age != null ? t("ageValue", { value: age }) : "—"} />
          <Row label={t("phoneNumber")} value={patient?.phone_number ?? "—"} />
          <Row label={t("address")} value={patient?.address ?? "—"} />
          <Row
            label={t("maritalStatus")}
            value={
              patient?.marital_status
                ? t(`maritalStatusValue.${patient.marital_status}`)
                : "—"
            }
          />
          <Row label={t("bloodGroup")} value="—" />
        </dl>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-50 pb-2 last:border-b-0 last:pb-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-xs font-medium text-brand-black">{value}</dd>
    </div>
  );
}
