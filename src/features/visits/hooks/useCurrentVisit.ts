"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchMyCurrentVisit } from "../lib/visits.api";
import { mapApiVisitToVisit } from "../lib/visits.utils";

export function useMyCurrentVisit(enabled = true) {
  return useQuery({
    queryKey: queryKeys.visits.myCurrent(),
    queryFn: async () => {
      const res = await fetchMyCurrentVisit();
      return res.data ? mapApiVisitToVisit(res.data) : null;
    },
    enabled,
  });
}