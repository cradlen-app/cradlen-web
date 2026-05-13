"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  fetchBranchWaitingList,
  fetchMyWaitingList,
} from "../lib/visits.api";
import { mapApiVisitToVisit } from "../lib/visits.utils";
import type { WaitingListPage } from "../types/visits.types";

type Params = {
  branchId: string | null | undefined;
  assignedToMe?: boolean;
  page: number;
  limit?: number;
};

export function useWaitingList({
  branchId,
  assignedToMe,
  page,
  limit = 10,
}: Params) {
  const enabled = assignedToMe ? true : !!branchId;
  const queryKey = assignedToMe
    ? queryKeys.visits.myWaitingList({ page, limit })
    : queryKeys.visits.branchWaitingList(branchId ?? "", { page, limit });

  return useQuery({
    queryKey,
    queryFn: async (): Promise<WaitingListPage> => {
      const res = assignedToMe
        ? await fetchMyWaitingList({ page, limit })
        : await fetchBranchWaitingList({
            branchId: branchId!,
            page,
            limit,
          });
      const total = res.meta.total;
      const totalPages =
        res.meta.totalPages ??
        res.meta.total_pages ??
        Math.max(1, Math.ceil(total / Math.max(1, limit)));
      return {
        rows: res.data.map(mapApiVisitToVisit),
        page: res.meta.page,
        total,
        totalPages,
      };
    },
    enabled,
  });
}