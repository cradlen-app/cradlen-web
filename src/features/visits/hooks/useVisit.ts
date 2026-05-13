"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchVisit } from "../lib/visits.api";
import { mapApiVisitToVisit } from "../lib/visits.utils";

export function useVisit(visitId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.visits.byId(visitId ?? ""),
    queryFn: async () => {
      const res = await fetchVisit({ visitId: visitId! });
      return mapApiVisitToVisit(res.data);
    },
    enabled: !!visitId,
  });
}