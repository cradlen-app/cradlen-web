"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBranchWaitingList, fetchMyWaitingList } from "../lib/visits.api";
import { mapApiVisitToVisit } from "../lib/visits.utils";
import type { WaitingListPage } from "../types/visits.types";
import { queryKeys } from "@/lib/queryKeys";

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
        : await fetchBranchWaitingList({ branchId: branchId!, page, limit });
      const meta = res.meta;
      return {
        rows: res.data.map(mapApiVisitToVisit),
        page: meta?.page ?? page,
        totalPages: meta?.totalPages ?? meta?.total_pages ?? 1,
        total: meta?.total ?? res.data.length,
      };
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
