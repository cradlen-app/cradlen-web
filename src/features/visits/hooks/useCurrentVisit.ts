// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { mockMyCurrentVisit } from "../lib/visits.mock";

export function useMyCurrentVisit(enabled = true) {
  return useQuery({
    queryKey: queryKeys.visits.myCurrent(),
    queryFn: async () => mockMyCurrentVisit,
    enabled,
    staleTime: Infinity,
  });
}
