"use client";

import { useState } from "react";
import { ChevronDown, Clock, Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/common/utils/utils";
import { usePatientJourneyTimeline } from "../../../hooks/usePatientJourneyTimeline";
import type {
  ApiJourneyTimelineEntry,
  ApiJourneyTimelineEpisode,
  ApiVisitHistoryEntry,
} from "../../../types/visits.api.types";
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

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  COMPLETED: "bg-gray-400",
  CANCELLED: "bg-red-500",
};

/** Seed the default expanded state: active (or newest) journey + its latest episode. */
function computeDefaults(journeys: ApiJourneyTimelineEntry[]) {
  const openJourneys = new Set<string>();
  const openEpisodes = new Set<string>();
  const focus = journeys.find((j) => j.status === "ACTIVE") ?? journeys[0];
  if (focus) {
    openJourneys.add(focus.id);
    const latest =
      focus.episodes.find((e) => e.status === "ACTIVE") ??
      [...focus.episodes].sort((a, b) => b.order - a.order)[0];
    if (latest) openEpisodes.add(latest.id);
  }
  return { openJourneys, openEpisodes };
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

function SkeletonGroup() {
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
}: {
  entry: ApiVisitHistoryEntry;
  locale: string;
  onView: () => void;
}) {
  const t = useTranslations("visits.workspace.history");
  const medications = entry.medications.map((m) => `${m.name} ${m.dose}`);
  const diagnoses = entry.diagnosis ? [entry.diagnosis] : [];

  return (
    <li>
      <article className="rounded-xl border border-gray-100 p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs">
            <span className="font-medium text-gray-700">
              {formatDate(entry.completed_at, locale)}
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-600">
              {t(`typeLabel.${entry.appointment_type}`)}
            </span>
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
              <p key={d} className="text-xs text-gray-700">
                {d}
              </p>
            ))}
          </Section>
        )}

        {medications.length > 0 && (
          <Section title={t("medications")}>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {medications.map((m) => (
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

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-lg border border-gray-100 bg-gray-50/50"
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2.5 text-start">
        <ChevronDown
          className="size-4 flex-none text-gray-400 transition-transform group-data-[state=closed]:-rotate-90"
          aria-hidden="true"
        />
        <span className="flex-1 truncate text-xs font-semibold text-brand-black">
          {episode.name}
          <span className="ms-2 font-normal text-gray-400">
            {t("episode", { order: episode.order })}
          </span>
        </span>
        {episode.started_at && (
          <span className="flex-none text-[11px] text-gray-500">
            {t("episodeStarted", {
              date: formatDate(episode.started_at, locale),
            })}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3">
          {episode.visits.length === 0 ? (
            <p className="py-2 text-xs text-gray-400">
              {t("noVisitsInEpisode")}
            </p>
          ) : (
            <ol className="space-y-2">
              {episode.visits.map((visit) => (
                <VisitCard
                  key={visit.id}
                  entry={visit}
                  locale={locale}
                  onView={() => onViewVisit(visit.id)}
                />
              ))}
            </ol>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function JourneyGroup({
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

  return (
    <Collapsible
      open={openJourney}
      onOpenChange={onJourneyOpenChange}
      className="rounded-xl border border-gray-200"
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 text-start">
        <ChevronDown
          className="size-4 flex-none text-brand-primary transition-transform group-data-[state=closed]:-rotate-90"
          aria-hidden="true"
        />
        <span className="flex-1 truncate text-sm font-semibold text-brand-primary">
          {journey.name}
        </span>
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
        <span className="flex-none text-[11px] text-gray-500">
          {t("journeyStarted", { date: formatDate(journey.started_at, locale) })}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 px-3 pb-3">
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

export function VisitsHistoryList({ patientId, excludeVisitId }: Props) {
  const t = useTranslations("visits.workspace.history");
  const locale = useLocale();
  const [detailVisitId, setDetailVisitId] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [openJourneys, setOpenJourneys] = useState<Set<string>>(new Set());
  const [openEpisodes, setOpenEpisodes] = useState<Set<string>>(new Set());
  const { journeys, isLoading, isLoadingMore, hasMore, loadMore } =
    usePatientJourneyTimeline({ patientId, excludeVisitId });

  // Seed default expanded state once, on first non-empty load — done during
  // render (React's sanctioned pattern) rather than in an effect. Journeys
  // pulled in later via "load more" stay collapsed (not added to the sets).
  if (!seeded && journeys.length > 0) {
    const defaults = computeDefaults(journeys);
    setOpenJourneys(defaults.openJourneys);
    setOpenEpisodes(defaults.openEpisodes);
    setSeeded(true);
  }

  const toggleJourney = (id: string, open: boolean) =>
    setOpenJourneys((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleEpisode = (id: string, open: boolean) =>
    setOpenEpisodes((prev) => {
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });

  return (
    <section>
      <header className="flex items-center gap-2">
        <Clock className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      <div className="my-6">
        {isLoading ? (
          <SkeletonGroup />
        ) : journeys.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-500">{t("empty")}</p>
        ) : (
          <div className="space-y-3">
            {journeys.map((journey) => (
              <JourneyGroup
                key={journey.id}
                journey={journey}
                openJourney={openJourneys.has(journey.id)}
                onJourneyOpenChange={(o) => toggleJourney(journey.id, o)}
                openEpisodes={openEpisodes}
                onEpisodeOpenChange={toggleEpisode}
                locale={locale}
                onViewVisit={setDetailVisitId}
              />
            ))}
          </div>
        )}
      </div>

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
