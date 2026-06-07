"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchMyCurrentVisit } from "../lib/visits.api";
import { mapApiVisitToVisit } from "../lib/visits.utils";

export function useMyCurrentVisit(
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.visits.myCurrent(branchId ?? ""),
    queryFn: async () => {
      const res = await fetchMyCurrentVisit(branchId!);
      return res.data ? mapApiVisitToVisit(res.data) : null;
    },
    enabled: enabled && !!branchId,
  });
}