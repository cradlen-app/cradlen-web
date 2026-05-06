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
      const base = {
        branchId: branchId!,
        ...queryParams,
        assignedToMe,
        q,
        page: 1,
        limit: 100,
      };
      const [inProgress, checkedIn, scheduled] = await Promise.all([
        fetchWaitingList({ ...base, status: "IN_PROGRESS" }),
        fetchWaitingList({ ...base, status: "CHECKED_IN" }),
        fetchWaitingList({ ...base, status: "SCHEDULED" }),
      ]);
      const allRows = [
        ...inProgress.data,
        ...checkedIn.data,
        ...scheduled.data,
      ].map(mapApiVisitToVisit);
      const total = allRows.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const start = (page - 1) * limit;
      return {
        rows: allRows.slice(start, start + limit),
        page,
        totalPages,
        total,
      };
    },
    enabled: !!branchId,
    staleTime: 30_000,
  });
}
