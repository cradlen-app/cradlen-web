"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { formatDate } from "../lib/format";
import { courseUnit, formUnitKey, MED_FORM_ICON } from "../lib/medications";
import { useMedications } from "../hooks/usePortalData";
import type { PortalMedication } from "../types/patient-portal.types";
import { ClinicTag, EmptyState, ScreenHeader } from "./portal-ui";

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
    <div className="space-y-4">
      <ScreenHeader title={t("medications.title")} />

      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : (meds?.length ?? 0) === 0 ? (
        <EmptyState message={t("medications.none")} />
      ) : (
        <>
          <CollapsibleSection title={t("medications.active")} count={active.length}>
            {active.length === 0 ? (
              <p className="py-1 text-sm text-gray-400">
                {t("medications.none")}
              </p>
            ) : (
              <MedGrid meds={active} />
            )}
          </CollapsibleSection>

          {past.length > 0 && (
            <CollapsibleSection
              title={t("medications.past")}
              count={past.length}
              defaultOpen={false}
            >
              <MedGrid meds={past} muted />
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}

/** Collapsible card matching the portal's `SectionCard` styling, with a chevron. */
function CollapsibleSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {title}
          </h2>
          {count != null && (
            <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-gray-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

function MedGrid({ meds, muted }: { meds: PortalMedication[]; muted?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {meds.map((m) => (
        <MedicationCard key={m.id} med={m} muted={muted} />
      ))}
    </div>
  );
}

function MedicationCard({
  med,
  muted,
}: {
  med: PortalMedication;
  muted?: boolean;
}) {
  const t = useTranslations("patientPortal");
  const locale = useLocale();

  const Icon = MED_FORM_ICON[med.form ?? "other"];
  const dosage = useDosageLine(med);

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-gray-100 bg-white p-3",
        muted && "opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-secondary/10 text-brand-primary">
            <Icon className="size-4" />
          </span>
          <p className="truncate text-sm font-semibold text-brand-black">
            {med.name}
          </p>
        </div>
        {med.drugClass && (
          <span className="shrink-0 text-[11px] text-gray-400">
            {t(`medications.class.${med.drugClass}`)}
          </span>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-gray-600">{dosage}</p>

      {med.instructions && (
        <p className="mt-1 text-center text-[11px] text-gray-400">
          {t("medications.instructions")}: {med.instructions}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
        <span className="truncate text-xs text-gray-500">
          {med.prescriberName}
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-gray-400">
          {formatDate(med.startDate, locale)}
        </span>
      </div>

      <div className="mt-2">
        <ClinicTag clinic={med.clinic} org={med.organizationName} />
      </div>
    </article>
  );
}

/** Builds "1 tab / 8 h · before meals · 1 month", falling back to dose · frequency. */
function useDosageLine(med: PortalMedication): string {
  const t = useTranslations("patientPortal");

  const primaryParts: string[] = [];
  if (med.amountPerDose != null && med.form) {
    primaryParts.push(
      `${med.amountPerDose} ${t(`medications.unit.${formUnitKey(med.form)}`)}`,
    );
  }
  if (med.intervalHours != null) {
    primaryParts.push(t("medications.everyHours", { count: med.intervalHours }));
  }

  const segments: string[] = [];
  if (primaryParts.length > 0) segments.push(primaryParts.join(" / "));
  if (med.foodTiming) segments.push(t(`medications.food.${med.foodTiming}`));
  if (med.courseDays != null) {
    const { key, count } = courseUnit(med.courseDays);
    segments.push(t(`medications.${key}`, { count }));
  }

  // Live (non-structured) path: fall back to the raw prescription fields.
  if (segments.length === 0) {
    return [med.dose, med.frequency, med.route].filter(Boolean).join(" · ");
  }

  // Structured path: append the route as a trailing segment when present.
  if (med.route) segments.push(med.route);
  return segments.join(" · ");
}
