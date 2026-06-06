"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { formatDate } from "../../lib/format";
import { useUpcomingVisits } from "../../hooks/usePortalData";
import { ClinicTag, EmptyState, SectionCard } from "../portal-ui";

/** Home highlight: the patient's next upcoming follow-up visit, if any. */
export function NextVisitCard() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { entries, isLoading } = useUpcomingVisits();

  const next = entries[0];

  return (
    <SectionCard
      title={t("home.nextVisit")}
      action={
        <Link
          href="/patient/visits"
          className="text-xs font-semibold text-brand-primary"
        >
          {t("home.viewAll")} ›
        </Link>
      }
    >
      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : !next ? (
        <EmptyState message={t("visits.noUpcoming")} />
      ) : (
        <div className="rounded-xl border border-gray-100 p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary">
              <CalendarDays className="size-4" />
              {formatDate(next.date, locale)}
            </span>
            <ClinicTag clinic={next.clinic} org={next.organizationName} />
          </div>

          <p className="mt-2 text-xs text-gray-500">
            {[next.doctorName, next.specialty].filter(Boolean).join(" · ")}
          </p>

          {next.note && (
            <p className="mt-2 text-xs text-gray-700">{next.note}</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
