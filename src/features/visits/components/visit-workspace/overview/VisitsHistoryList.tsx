"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePatientJourneyTimeline } from "../../../hooks/usePatientJourneyTimeline";
import { VisitDetailsDialog } from "./VisitDetailsDialog";
import { JourneyGroup, SkeletonGroup } from "./visit-history-groups";
import { computeDefaults } from "./visit-history.helpers";

type Props = {
  patientId: string;
  excludeVisitId: string;
};

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
          <div className="space-y-1">
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
