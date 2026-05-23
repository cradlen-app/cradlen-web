"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchPatientVisitHistory } from "../lib/visits.api";
import type { ApiVisitHistoryEntry } from "../types/visits.api.types";

export function usePatientVisitHistory({
  patientId,
  excludeVisitId,
}: {
  patientId: string;
  excludeVisitId: string;
}) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.visits.patientHistory(patientId, excludeVisitId),
    queryFn: ({ pageParam }) =>
      fetchPatientVisitHistory({
        patientId,
        page: pageParam,
        limit: 3,
        excludeVisitId,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
  });

  const entries: ApiVisitHistoryEntry[] =
    query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    entries,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}