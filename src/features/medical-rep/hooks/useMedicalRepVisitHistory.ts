"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import {
  fetchMedicalRepVisitHistory,
  fetchMedicalRepVisitHistoryByRep,
} from "../lib/medical-rep.api";
import { medicalRepQueryKeys } from "../lib/medical-rep.queryKeys";
import type { MedicalRepVisitHistoryItem } from "../types/medical-rep.types";

const PAGE_SIZE = 3;

/** Either a single visit's "other visits" history, or a whole rep's history. */
export type VisitHistorySource = { visitId: string } | { repId: string };

/** Paginated past-visit timeline for a visit or a rep (3 at a time). */
export function useMedicalRepVisitHistory(source: VisitHistorySource) {
  const byVisit = "visitId" in source;
  const query = useInfiniteQuery({
    queryKey: byVisit
      ? medicalRepQueryKeys.visitHistory(source.visitId)
      : medicalRepQueryKeys.visitHistoryByRep(source.repId),
    queryFn: ({ pageParam }) =>
      byVisit
        ? fetchMedicalRepVisitHistory({
            visitId: source.visitId,
            page: pageParam,
            limit: PAGE_SIZE,
          })
        : fetchMedicalRepVisitHistoryByRep({
            repId: source.repId,
            page: pageParam,
            limit: PAGE_SIZE,
          }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
  });

  const entries: MedicalRepVisitHistoryItem[] =
    query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    entries,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
}
