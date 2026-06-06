"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { cn } from "@/common/utils/utils";
import { formatDate } from "../lib/format";
import type { PortalVisit, VisitPriority } from "../types/patient-portal.types";
import { ClinicTag, EmptyState } from "./portal-ui";

const PRIORITY_DOT: Record<VisitPriority, string> = {
  normal: "bg-emerald-500",
  urgent: "bg-amber-500",
  emergency: "bg-red-500",
};

/**
 * One row of the visit timeline: a left date rail with a connector line and a
 * card slot on the right. Shared by the completed-visit timeline and the
 * upcoming-visit timeline so both read identically.
 */
export function TimelineItem({
  date,
  isLast,
  children,
}: {
  date: string;
  isLast: boolean;
  children: ReactNode;
}) {
  const locale = useLocale();
  return (
    <li className="flex items-stretch gap-4">
      <div className="flex w-20 flex-none flex-col items-center sm:w-24">
        <span className="whitespace-nowrap text-xs font-medium text-gray-600">
          {formatDate(date, locale)}
        </span>
        {!isLast && (
          <span className="mt-2 w-px flex-1 bg-gray-200" aria-hidden="true" />
        )}
      </div>
      <div className={isLast ? "flex-1" : "flex-1 pb-6"}>{children}</div>
    </li>
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

/** A single completed-visit card body (without the timeline rail). */
function VisitCard({ visit }: { visit: PortalVisit }) {
  const t = useTranslations("patientPortal");
  const priority = visit.priority ?? "normal";
  return (
    <article className="rounded-xl border border-gray-100 p-4">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-700">
            {t(`record.typeLabel.${visit.type ?? "VISIT"}`)}
          </span>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className={cn("size-1.5 rounded-full", PRIORITY_DOT[priority])}
              aria-hidden="true"
            />
            {t(`record.priority.${priority}`)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">
            {visit.doctorName} · {visit.specialty}
          </span>
          <ClinicTag clinic={visit.clinic} org={visit.organizationName} />
        </div>
      </header>

      {visit.diagnosis && (
        <Section title={t("record.diagnosis")}>
          <p className="text-xs text-gray-700">{visit.diagnosis}</p>
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

      {visit.investigations && visit.investigations.length > 0 && (
        <Section title={t("record.investigations")}>
          {visit.investigations.map((inv) => (
            <p key={inv} className="text-xs text-gray-700">
              {inv}
            </p>
          ))}
        </Section>
      )}
    </article>
  );
}

/** Loading placeholder that preserves the timeline shape. */
export function TimelineSkeletonItem({ isLast }: { isLast: boolean }) {
  return (
    <li className="flex items-stretch gap-4">
      <div className="flex w-20 flex-none flex-col items-center sm:w-24">
        <span className="h-3.5 w-16 animate-pulse rounded bg-gray-200" />
        {!isLast && (
          <span className="mt-2 w-px flex-1 bg-gray-200" aria-hidden="true" />
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

/** A centered "Load more" button shared by the timelines. */
export function TimelineLoadMore({
  isLoadingMore,
  loadMore,
}: {
  isLoadingMore: boolean;
  loadMore: () => void;
}) {
  const t = useTranslations("patientPortal");
  return (
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
  );
}

/**
 * Completed-visit timeline. Presentational: the caller supplies paged data from
 * `useVisitHistory`. Rendered both on the Record screen (inside a scroll
 * container via `listClassName`) and on the Visits page (natural height).
 */
export function VisitTimeline({
  entries,
  isLoading,
  hasMore,
  isLoadingMore,
  loadMore,
  listClassName,
}: {
  entries: PortalVisit[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  listClassName?: string;
}) {
  const t = useTranslations("patientPortal");

  return (
    <>
      <ol className={cn("space-y-0", listClassName)}>
        {isLoading ? (
          <>
            <TimelineSkeletonItem isLast={false} />
            <TimelineSkeletonItem isLast={false} />
            <TimelineSkeletonItem isLast={true} />
          </>
        ) : entries.length === 0 ? (
          <li>
            <EmptyState message={t("record.noVisits")} />
          </li>
        ) : (
          entries.map((visit, index) => (
            <TimelineItem
              key={visit.id}
              date={visit.date}
              isLast={index === entries.length - 1 && !hasMore}
            >
              <VisitCard visit={visit} />
            </TimelineItem>
          ))
        )}
      </ol>

      {hasMore && (
        <TimelineLoadMore isLoadingMore={isLoadingMore} loadMore={loadMore} />
      )}
    </>
  );
}
