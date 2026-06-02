"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchMedicalRepVisitHistory } from "../lib/medical-rep.api";
import { medicalRepQueryKeys } from "../lib/medical-rep.queryKeys";
import type { MedicalRepVisitHistoryItem } from "../types/medical-rep.types";

const PAGE_SIZE = 3;

/** Paginated past-visit timeline for the rep of `visitId` (3 at a time). */
export function useMedicalRepVisitHistory(visitId: string) {
  const query = useInfiniteQuery({
    queryKey: medicalRepQueryKeys.visitHistory(visitId),
    queryFn: ({ pageParam }) =>
      fetchMedicalRepVisitHistory({
        visitId,
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
