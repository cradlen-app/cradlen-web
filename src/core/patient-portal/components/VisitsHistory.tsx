"use client";

import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cn } from "@/common/utils/utils";
import { formatDate } from "../lib/format";
import { useVisitHistory } from "../hooks/usePortalData";
import type { VisitPriority } from "../types/patient-portal.types";
import { ClinicTag, EmptyState } from "./portal-ui";

const PRIORITY_DOT: Record<VisitPriority, string> = {
  normal: "bg-emerald-500",
  urgent: "bg-amber-500",
  emergency: "bg-red-500",
};

/**
 * Visit history timeline for the patient portal Record screen. Mirrors the
 * staff-side `VisitsHistoryList`: a paginated left date rail with a connector
 * line and per-visit cards showing visit type, a priority pill, the doctor, the
 * originating clinic, and labeled Diagnosis / Medications / Investigations.
 */
export function VisitsHistory() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { entries, isLoading, isLoadingMore, hasMore, loadMore } =
    useVisitHistory();

  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <header className="mb-4 flex items-center gap-2">
        <Clock className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">
          {t("record.historyTitle")}
        </h2>
      </header>

      <ol className="min-h-0 flex-1 space-y-0 overflow-y-auto">
        {isLoading ? (
          <>
            <SkeletonCard isLast={false} />
            <SkeletonCard isLast={false} />
            <SkeletonCard isLast={true} />
          </>
        ) : entries.length === 0 ? (
          <li>
            <EmptyState message={t("record.noVisits")} />
          </li>
        ) : (
          entries.map((visit, index) => {
            const isLast = index === entries.length - 1 && !hasMore;
            const priority = visit.priority ?? "normal";
            return (
              <li key={visit.id} className="flex items-stretch gap-4">
                <div className="flex w-20 flex-none flex-col items-center sm:w-24">
                  <span className="whitespace-nowrap text-xs font-medium text-gray-600">
                    {formatDate(visit.date, locale)}
                  </span>
                  {!isLast && (
                    <span
                      className="mt-2 w-px flex-1 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className={isLast ? "flex-1" : "flex-1 pb-6"}>
                  <article className="rounded-xl border border-gray-100 p-4">
                    <header className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        {t(`record.typeLabel.${visit.type ?? "VISIT"}`)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            PRIORITY_DOT[priority],
                          )}
                          aria-hidden="true"
                        />
                        {t(`record.priority.${priority}`)}
                      </span>
                    </header>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">
                        {visit.doctorName} · {visit.specialty}
                      </span>
                      <ClinicTag
                        clinic={visit.clinic}
                        org={visit.organizationName}
                      />
                    </div>

                    {visit.diagnosis && (
                      <Section title={t("record.diagnosis")}>
                        <p className="text-xs text-gray-700">
                          {visit.diagnosis}
                        </p>
                      </Section>
                    )}

                    {visit.medications && visit.medications.length > 0 && (
                      <Section title={t("record.medications")}>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {visit.medications.map((m) => (
                            <span key={m} className="text-xs text-gray-700">
                              {m}
                            </span>
                          ))}
                        </div>
                      </Section>
                    )}

                    {visit.investigations &&
                      visit.investigations.length > 0 && (
                        <Section title={t("record.investigations")}>
                          {visit.investigations.map((inv) => (
                            <p key={inv} className="text-xs text-gray-700">
                              {inv}
                            </p>
                          ))}
                        </Section>
                      )}
                  </article>
                </div>
              </li>
            );
          })
        )}
      </ol>

      {hasMore && (
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => loadMore()}
            disabled={isLoadingMore}
            className="inline-flex h-9 items-center justify-center rounded-full bg-brand-primary px-6 text-xs font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {isLoadingMore ? t("record.loading") : t("record.loadMore")}
          </button>
        </div>
      )}
    </section>
  );
}

/** A labeled section inside a visit card (Diagnosis / Medications / …). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold text-brand-primary">{title}</h4>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

/** Loading placeholder that preserves the timeline shape. */
function SkeletonCard({ isLast }: { isLast: boolean }) {
  return (
    <li className="flex items-stretch gap-4">
      <div className="flex w-20 flex-none flex-col items-center sm:w-24">
        <span className="h-3.5 w-16 animate-pulse rounded bg-gray-200" />
        {!isLast && (
          <span
            className="mt-2 w-px flex-1 bg-gray-200"
            aria-hidden="true"
          />
        )}
      </div>
      <div className={isLast ? "flex-1" : "flex-1 pb-6"}>
        <div className="space-y-3 rounded-xl border border-gray-100 p-4">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </li>
  );
}
