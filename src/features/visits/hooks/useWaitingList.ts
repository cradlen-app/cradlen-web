// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useQuery } from "@tanstack/react-query";
import type { WaitingListPage } from "../types/visits.types";
import { queryKeys } from "@/lib/queryKeys";
import { mockWaitingList } from "../lib/visits.mock";

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
    queryFn: async (): Promise<WaitingListPage> => ({
      ...mockWaitingList,
      page,
    }),
    enabled,
    staleTime: Infinity,
  });
}
