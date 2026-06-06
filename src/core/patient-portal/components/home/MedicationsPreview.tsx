"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { formatDate } from "../../lib/format";
import { useMedications } from "../../hooks/usePortalData";
import { EmptyState, SectionCard } from "../portal-ui";

export function MedicationsPreview() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { data: meds, isLoading } = useMedications();

  const active = useMemo(
    () => (meds ?? []).filter((m) => m.status === "active").slice(0, 3),
    [meds],
  );

  return (
    <SectionCard
      title={t("home.medications")}
      action={
        <Link
          href="/patient/medications"
          className="text-xs font-semibold text-brand-primary"
        >
          {t("home.viewAll")} ›
        </Link>
      }
    >
      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : active.length === 0 ? (
        <EmptyState message={t("medications.none")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {active.map((m) => (
            <div key={m.id} className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <CalendarDays className="size-3.5" />
                {formatDate(m.startDate, locale)}
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold text-brand-primary">
                {m.name}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-gray-500">
                <span>
                  {m.daysLeft != null
                    ? t("home.daysLeft", { count: m.daysLeft })
                    : ""}
                </span>
                <span className="truncate">{m.frequency}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
