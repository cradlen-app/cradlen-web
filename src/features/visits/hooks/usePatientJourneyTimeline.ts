"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchPatientJourneyTimeline } from "../lib/visits.api";
import type { ApiJourneyTimelineEntry } from "../types/visits.api.types";

/**
 * Patient journey tree for the Overview timeline. Paginated by journey (not by
 * visit) so a journey/episode group never splits across pages.
 */
export function usePatientJourneyTimeline({
  patientId,
  excludeVisitId,
}: {
  patientId: string;
  excludeVisitId: string;
}) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.visits.journeyTimeline(patientId, excludeVisitId),
    queryFn: ({ pageParam }) =>
      fetchPatientJourneyTimeline({
        patientId,
        page: pageParam,
        limit: 5,
        excludeVisitId,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
  });

  const journeys: ApiJourneyTimelineEntry[] =
    query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    journeys,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}
