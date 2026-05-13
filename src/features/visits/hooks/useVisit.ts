// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { getMockVisitById } from "../lib/visits.mock";

export function useVisit(visitId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.visits.byId(visitId ?? ""),
    queryFn: async () => getMockVisitById(visitId!),
    enabled: !!visitId,
    staleTime: Infinity,
  });
}
