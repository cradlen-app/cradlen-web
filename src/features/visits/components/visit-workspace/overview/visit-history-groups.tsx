"use client";

import { ChevronDown, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/common/utils/utils";
import type {
  ApiJourneyTimelineEntry,
  ApiJourneyTimelineEpisode,
  ApiVisitHistoryEntry,
} from "../../../types/visits.api.types";
import { formatDate, formatDateParts } from "./visit-history.helpers";

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-500",
};

/** Marker + connector primitives shared by the timeline rail. */
const RAIL_LINE =
  "pointer-events-none absolute inset-y-0 start-[10px] w-px bg-gray-200";
const MARKER_SLOT =
  "relative z-10 flex size-[21px] flex-none items-center justify-center";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </h4>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

export function SkeletonGroup() {
  return (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border border-gray-100 p-4">
          <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VisitCard({
  entry,
  locale,
  onView,
  isLast,
}: {
  entry: ApiVisitHistoryEntry;
  locale: string;
  onView: () => void;
  isLast: boolean;
}) {
  const t = useTranslations("visits.workspace.history");
  const medications = entry.medications.map((m) => `${m.name} ${m.dose}`);
  const diagnoses = entry.diagnosis ? [entry.diagnosis] : [];
  const { dayMonth, year } = formatDateParts(entry.completed_at, locale);

  return (
    <li className="flex items-stretch gap-2">
      <div className="flex w-14 flex-none flex-col items-end pt-1.5 text-end sm:w-16">
        <span className="text-xs font-semibold text-gray-700">{dayMonth}</span>
        <span className="text-[11px] text-gray-400">{year}</span>
      </div>
      <div className="relative flex w-3 flex-none justify-center pt-2.5">
        {!isLast && (
          <span
            className="absolute inset-y-0 start-1/2 w-px -translate-x-1/2 bg-gray-200"
            aria-hidden="true"
          />
        )}
        <span
          className="relative z-10 size-2.5 rounded-full bg-emerald-500 ring-4 ring-white"
          aria-hidden="true"
        />
      </div>
      <div className={cn("flex-1", isLast ? "" : "pb-5")}>
        <article className="rounded-xl border border-gray-100 p-4">
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <span className="text-xs font-medium text-gray-700">
              {t(`typeLabel.${entry.appointment_type}`)}
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
              onClick={onView}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:text-brand-primary/80"
            >
              <Eye className="size-3.5" aria-hidden="true" />
              {t("visitDetails")}
            </button>
          </header>

          {diagnoses.length > 0 && (
            <Section title={t("diagnosis")}>
              {diagnoses.map((d) => (
                <p key={d} className="text-xs text-brand-primary">
                  {d}
                </p>
              ))}
            </Section>
          )}

          {medications.length > 0 && (
            <Section title={t("medications")}>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {medications.map((m) => (
                  <span key={m} className="text-xs text-brand-primary">
                    {m}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {entry.investigations.length > 0 && (
            <Section title={t("investigations")}>
              {entry.investigations.map((inv) => (
                <p key={inv} className="text-xs text-brand-primary">
                  {inv}
                </p>
              ))}
            </Section>
          )}
        </article>
      </div>
    </li>
  );
}

function EpisodeGroup({
  episode,
  open,
  onOpenChange,
  locale,
  onViewVisit,
}: {
  episode: ApiJourneyTimelineEpisode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  onViewVisit: (id: string) => void;
}) {
  const t = useTranslations("visits.workspace.history");
  const meta = episode.started_at
    ? `${t("episodeStarted", { date: formatDate(episode.started_at, locale) })} · ${
        episode.ended_at
          ? t("completedOn", { date: formatDate(episode.ended_at, locale) })
          : t("ongoing")
      }`
    : null;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="relative">
      <span className={RAIL_LINE} aria-hidden="true" />
      <CollapsibleTrigger className="group relative flex w-full items-center gap-2 py-2 text-start">
        <span className={MARKER_SLOT}>
          <span
            className="size-3 rounded-full border-2 border-brand-secondary bg-white"
            aria-hidden="true"
          />
        </span>
        <ChevronDown
          className="size-4 flex-none text-gray-400 transition-transform group-data-[state=closed]:-rotate-90"
          aria-hidden="true"
        />
        <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
              {t("episode", { order: episode.order })}
            </span>
            <span className="text-xs font-medium text-brand-black">
              {episode.name}
            </span>
            <span className="text-xs text-gray-400">
              · {t("visitsCount", { count: episode.visits.length })}
            </span>
          </span>
          {meta && (
            <span className="flex-none text-[11px] text-gray-500">{meta}</span>
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ps-7 pt-1">
          {episode.visits.length === 0 ? (
            <p className="py-2 text-xs text-gray-400">
              {t("noVisitsInEpisode")}
            </p>
          ) : (
            <ol>
              {episode.visits.map((visit, i) => (
                <VisitCard
                  key={visit.id}
                  entry={visit}
                  locale={locale}
                  onView={() => onViewVisit(visit.id)}
                  isLast={i === episode.visits.length - 1}
                />
              ))}
            </ol>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function JourneyGroup({
  journey,
  openJourney,
  onJourneyOpenChange,
  openEpisodes,
  onEpisodeOpenChange,
  locale,
  onViewVisit,
}: {
  journey: ApiJourneyTimelineEntry;
  openJourney: boolean;
  onJourneyOpenChange: (open: boolean) => void;
  openEpisodes: Set<string>;
  onEpisodeOpenChange: (id: string, open: boolean) => void;
  locale: string;
  onViewVisit: (id: string) => void;
}) {
  const t = useTranslations("visits.workspace.history");
  const visitsCount = journey.episodes.reduce(
    (n, e) => n + e.visits.length,
    0,
  );
  const meta = `${t("journeyStarted", {
    date: formatDate(journey.started_at, locale),
  })} · ${
    journey.ended_at
      ? t("completedOn", { date: formatDate(journey.ended_at, locale) })
      : t("ongoing")
  }`;

  return (
    <Collapsible
      open={openJourney}
      onOpenChange={onJourneyOpenChange}
      className="relative"
    >
      <span className={RAIL_LINE} aria-hidden="true" />
      <CollapsibleTrigger className="group relative flex w-full items-center gap-2 py-2.5 text-start">
        <span className={MARKER_SLOT}>
          <span
            className="size-3.5 rounded-full bg-brand-primary"
            aria-hidden="true"
          />
        </span>
        <ChevronDown
          className="size-4 flex-none text-brand-primary transition-transform group-data-[state=closed]:-rotate-90"
          aria-hidden="true"
        />
        <div className="flex flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold text-brand-black">
              {journey.name}
            </span>
            <span className="text-xs text-gray-400">
              {t("episodesCount", { count: journey.episodes.length })} ·{" "}
              {t("visitsCount", { count: visitsCount })}
            </span>
          </span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span className="inline-flex flex-none items-center gap-1.5 text-[11px] text-gray-500">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  STATUS_DOT[journey.status] ?? "bg-gray-400",
                )}
                aria-hidden="true"
              />
              {t(`status.${journey.status}`)}
            </span>
            <span className="flex-none text-[11px] text-gray-500">{meta}</span>
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 ps-7 pt-1">
          {journey.episodes.length === 0 ? (
            <p className="px-1 py-2 text-xs text-gray-400">
              {t("noEpisodes")}
            </p>
          ) : (
            journey.episodes.map((episode) => (
              <EpisodeGroup
                key={episode.id}
                episode={episode}
                open={openEpisodes.has(episode.id)}
                onOpenChange={(o) => onEpisodeOpenChange(episode.id, o)}
                locale={locale}
                onViewVisit={onViewVisit}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

