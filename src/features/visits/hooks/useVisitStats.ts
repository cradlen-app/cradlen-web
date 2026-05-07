"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVisitStats } from "../lib/visits.api";
import { mapApiStatsToStats } from "../lib/visits.utils";
import { queryKeys } from "@/lib/queryKeys";

type Params = {
  branchId: string | null | undefined;
  date: string;
  assignedToMe?: boolean;
};

export function useVisitStats({ branchId, date, assignedToMe }: Params) {
  return useQuery({
    queryKey: queryKeys.visits.stats(branchId ?? "", date, assignedToMe ?? false),
    queryFn: async () => {
      const res = await fetchVisitStats({ branchId: branchId!, date, assignedToMe });
      return mapApiStatsToStats(res.data);
    },
    enabled: !!branchId,
    staleTime: 60_000,
  });
}
