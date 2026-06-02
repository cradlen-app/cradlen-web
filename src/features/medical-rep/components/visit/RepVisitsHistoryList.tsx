"use client";

import { useState } from "react";
import { Clock, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMedicalRepVisitHistory } from "../../hooks/useMedicalRepVisitHistory";
import type { MedicalRepVisitHistoryItem } from "../../types/medical-rep.types";
import { RepVisitDetailsDialog } from "./RepVisitDetailsDialog";

type Props = {
  visitId: string;
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

export function RepVisitsHistoryList({ visitId }: Props) {
  const t = useTranslations("medicalRep.visit.history");
  const locale = useLocale();
  const [detail, setDetail] = useState<MedicalRepVisitHistoryItem | null>(null);
  const { entries, isLoading, isLoadingMore, hasMore, loadMore } =
    useMedicalRepVisitHistory(visitId);

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
        ) : entries.length === 0 ? (
          <li className="py-6 text-center text-xs text-gray-500">
            {t("empty")}
          </li>
        ) : (
          entries.map((entry, index) => {
            const isLast = index === entries.length - 1 && !hasMore;
            return (
              <RepHistoryCard
                key={entry.id}
                entry={entry}
                isLast={isLast}
                date={formatDate(entry.scheduled_at, locale)}
                onOpenDetails={() => setDetail(entry)}
              />
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

      <RepVisitDetailsDialog
        item={detail}
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
      />
    </section>
  );
}

function RepHistoryCard({
  entry,
  isLast,
  date,
  onOpenDetails,
}: {
  entry: MedicalRepVisitHistoryItem;
  isLast: boolean;
  date: string;
  onOpenDetails: () => void;
}) {
  const t = useTranslations("medicalRep.visit.history");
  const locale = useLocale();
  const purpose = entry.purpose ? t(`purposeValue.${entry.purpose}`) : "—";
  const outcome = entry.outcome ? t(`outcomeValue.${entry.outcome}`) : "—";

  return (
    <li className="flex items-stretch gap-4">
      <div className="flex w-24 flex-none flex-col items-center">
        <div className="flex items-center gap-1 text-xs font-medium text-gray-600 whitespace-nowrap">
          <span>{date}</span>
        </div>
        {!isLast && (
          <div className="mt-2 w-px flex-1 bg-gray-200" aria-hidden="true" />
        )}
      </div>

      <div className={isLast ? "flex-1" : "flex-1 pb-6"}>
        <article className="rounded-xl border border-gray-100 p-4">
          <header className="flex items-center justify-end">
            <button
              type="button"
              onClick={onOpenDetails}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary/80"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              {t("visitDetails")}
            </button>
          </header>

          <Section title={t("purpose")}>
            <p className="text-xs text-gray-700">{purpose}</p>
          </Section>

          <Section title={t("samples")}>
            <p className="text-xs text-gray-700">
              {entry.samples_received ? t("samplesYes") : t("samplesNo")}
            </p>
            {entry.follow_up_date && (
              <p className="text-xs text-gray-500">
                {t("followUp")}: {formatDate(entry.follow_up_date, locale)}
              </p>
            )}
          </Section>

          <Section title={t("outcome")}>
            <p className="text-xs text-gray-700">{outcome}</p>
          </Section>

          <Section title={t("notes")}>
            {entry.notes ? (
              <p className="whitespace-pre-wrap text-xs text-gray-700">
                {entry.notes}
              </p>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </Section>

          <Section title={t("products")}>
            {entry.products.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {entry.products.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-md border border-gray-200 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">—</p>
            )}
          </Section>
        </article>
      </div>
    </li>
  );
}
