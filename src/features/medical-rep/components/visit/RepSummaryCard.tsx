"use client";

import { useTranslations } from "next-intl";

export interface RepOverview {
  full_name: string;
  company_name: string | null;
  phone_number: string | null;
  specialty_focus: string | null;
  last_visit_at: string | null;
  promoted_medications: string[];
}

type Specialty = { code: string; name: string };

type Props = {
  overview: RepOverview;
  specialties?: Specialty[];
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

function handleFromName(fullName?: string) {
  const base = fullName?.trim().replace(/\s+/g, "_").toLowerCase();
  return base ? `@${base}` : "";
}

export function RepSummaryCard({ overview, specialties }: Props) {
  const t = useTranslations("medicalRep.visit.overview");
  const fullName = overview.full_name || "";
  const specialtyName = overview.specialty_focus
    ? (specialties?.find((s) => s.code === overview.specialty_focus)?.name ??
      overview.specialty_focus)
    : "—";

  return (
    <section className="overflow-hidden rounded-xl">
      <div className="h-16 bg-brand-primary" aria-hidden="true" />
      <div className="-mt-8 flex flex-col items-center px-6 pb-6">
        <div
          className="flex size-16 items-center justify-center rounded-full bg-brand-primary text-base font-semibold text-white ring-4 ring-white"
          aria-hidden="true"
        >
          {initials(fullName)}
        </div>
        <h2 className="mt-3 text-base font-semibold text-brand-black">
          {fullName || "—"}
        </h2>
        <p className="text-xs text-gray-400">{handleFromName(fullName)}</p>

        <dl className="mt-5 w-full space-y-3 text-sm">
          <Row label={t("company")} value={overview.company_name ?? "—"} />
          <Row label={t("specialtyFocus")} value={specialtyName} />
          <Row label={t("phone")} value={overview.phone_number ?? "—"} />
        </dl>

        <div className="mt-5 w-full">
          <p className="mb-1.5 text-xs font-medium text-gray-400">
            {t("promoted")}
          </p>
          {overview.promoted_medications.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {overview.promoted_medications.map((m) => (
                <span
                  key={m}
                  className="rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-600"
                >
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-xs font-medium text-brand-black">{value}</dd>
    </div>
  );
}
