"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchVisitStats } from "../lib/visits.api";
import { mapApiStatsToStats } from "../lib/visits.utils";
import { queryKeys } from "@/lib/queryKeys";

type Params = {
  branchId: string;
  date: string;
  assignedToMe?: boolean;
};

export function useVisitStats({ branchId, date, assignedToMe }: Params) {
  return useSuspenseQuery({
    queryKey: queryKeys.visits.stats(branchId, date, assignedToMe ?? false),
    queryFn: async () => {
      const res = await fetchVisitStats({ branchId, date, assignedToMe });
      return mapApiStatsToStats(res.data);
    },
    staleTime: 0,
  });
}
