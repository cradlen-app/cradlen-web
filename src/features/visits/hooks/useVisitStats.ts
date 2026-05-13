// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { mockStats } from "../lib/visits.mock";

type Params = {
  branchId: string;
  date: string;
  assignedToMe?: boolean;
};

export function useVisitStats({ branchId, date, assignedToMe }: Params) {
  return useSuspenseQuery({
    queryKey: queryKeys.visits.stats(branchId, date, assignedToMe ?? false),
    queryFn: async () => mockStats,
    staleTime: Infinity,
  });
}
