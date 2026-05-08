"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMyCurrentVisit } from "../lib/visits.api";
import { mapApiVisitToVisit } from "../lib/visits.utils";
import { queryKeys } from "@/lib/queryKeys";

export function useMyCurrentVisit(enabled = true) {
  return useQuery({
    queryKey: queryKeys.visits.myCurrent(),
    queryFn: async () => {
      const res = await fetchMyCurrentVisit();
      return res.data ? mapApiVisitToVisit(res.data) : null;
    },
    enabled,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
