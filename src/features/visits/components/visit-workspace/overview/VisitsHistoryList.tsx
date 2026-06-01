"use client";

import { useState } from "react";
import { Clock, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePatientVisitHistory } from "../../../hooks/usePatientVisitHistory";
import { VisitDetailsDialog } from "./VisitDetailsDialog";

type Props = {
  patientId: string;
  excludeVisitId: string;
};

function formatDate(iso: string, locale: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const formatLocale = locale.startsWith("en") ? "en-GB" : locale;
  return new Intl.DateTimeFormat(formatLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function SkeletonCard({ isLast }: { isLast: boolean }) {
  return (
    <li className="flex items-stretch gap-4">
      <div className="flex w-24 flex-none flex-col items-center">
        <div className="h-3.5 w-20 animate-pulse rounded bg-gray-200" />
        {!isLast && (
          <div className="mt-2 w-px flex-1 bg-gray-200" aria-hidden="true" />
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold text-brand-primary">{title}</h4>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

export function VisitsHistoryList({ patientId, excludeVisitId }: Props) {
  const t = useTranslations("visits.workspace.history");
  const locale = useLocale();
  const [detailVisitId, setDetailVisitId] = useState<string | null>(null);
  const { entries, isLoading, isLoadingMore, hasMore, loadMore } =
    usePatientVisitHistory({ patientId, excludeVisitId });

  const mapped = entries.map((e) => ({
    id: e.id,
    date: e.completed_at,
    type: e.appointment_type,
    diagnoses: e.diagnosis ? [e.diagnosis] : [],
    medications: e.medications.map((m) => `${m.name} ${m.dose}`),
    investigations: e.investigations,
  }));

  return (
    <section>
      <header className="flex items-center gap-2">
        <Clock className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      <ol className="my-6 space-y-0">
        {isLoading ? (
          <>
            <SkeletonCard isLast={false} />
            <SkeletonCard isLast={false} />
            <SkeletonCard isLast={true} />
          </>
        ) : mapped.length === 0 ? (
          <li className="py-6 text-center text-xs text-gray-500">
            {t("empty")}
          </li>
        ) : (
          mapped.map((entry, index) => {
            const isLast = index === mapped.length - 1 && !hasMore;
            return (
              <li key={entry.id} className="flex items-stretch gap-4">
                <div className="flex w-24 flex-none flex-col items-center">
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-600 whitespace-nowrap">
                    <span>{formatDate(entry.date, locale)}</span>
                  </div>
                  {!isLast && (
                    <div
                      className="mt-2 w-px flex-1 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className={isLast ? "flex-1" : "flex-1 pb-6"}>
                  <article className="rounded-xl border border-gray-100 p-4">
                    <header className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        {t(`typeLabel.${entry.type}`)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                        <span
                          className="size-1.5 rounded-full bg-emerald-500"
                          aria-hidden="true"
                        />
                        {t("statusNormal")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetailVisitId(entry.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary/80"
                      >
                        <Eye className="size-3.5" aria-hidden="true" />
                        {t("visitDetails")}
                      </button>
                    </header>

                    {entry.diagnoses.length > 0 && (
                      <Section title={t("diagnosis")}>
                        {entry.diagnoses.map((d) => (
                          <p key={d} className="text-xs text-gray-700">
                            {d}
                          </p>
                        ))}
                      </Section>
                    )}

                    {entry.medications.length > 0 && (
                      <Section title={t("medications")}>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {entry.medications.map((m) => (
                            <span key={m} className="text-xs text-gray-700">
                              {m}
                            </span>
                          ))}
                        </div>
                      </Section>
                    )}

                    {entry.investigations.length > 0 && (
                      <Section title={t("investigations")}>
                        {entry.investigations.map((inv) => (
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
        <div className="my-6 flex justify-center">
          <button
            type="button"
            onClick={() => loadMore()}
            disabled={isLoadingMore}
            className="inline-flex h-9 items-center justify-center rounded-full bg-brand-primary px-6 text-xs font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-60"
          >
            {isLoadingMore ? t("loading") : t("loadMore")}
          </button>
        </div>
      )}

      <VisitDetailsDialog
        open={detailVisitId !== null}
        onOpenChange={(o) => !o && setDetailVisitId(null)}
        visitId={detailVisitId}
      />
    </section>
  );
}
