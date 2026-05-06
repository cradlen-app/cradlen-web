"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWaitingList } from "../lib/visits.api";
import { buildWaitingListQuery, mapApiVisitToVisit } from "../lib/visits.utils";
import type { WaitingListFilter, WaitingListPage } from "../types/visits.types";

type Params = {
  branchId: string | null | undefined;
  filter: WaitingListFilter;
  q: string;
  assignedToMe?: boolean;
  page: number;
  limit?: number;
};

export function useWaitingList({
  branchId,
  filter,
  q,
  assignedToMe,
  page,
  limit = 10,
}: Params) {
  const queryParams = buildWaitingListQuery(filter);
  return useQuery({
    queryKey: [
      "visits",
      branchId,
      "list",
      { filter, q, assignedToMe: assignedToMe ?? false, page, limit },
    ],
    queryFn: async (): Promise<WaitingListPage> => {
      const res = await fetchWaitingList({
        branchId: branchId!,
        ...queryParams,
        status: "waiting,pending",
        assignedToMe,
        q,
        page,
        limit,
      });
      return {
        rows: res.data.map(mapApiVisitToVisit),
        page: res.meta.page,
        totalPages: res.meta.total_pages,
        total: res.meta.total,
      };
    },
    enabled: !!branchId,
    staleTime: 30_000,
  });
}
