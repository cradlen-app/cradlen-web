"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchMedRepMyCurrent } from "../lib/medical-rep.api";
import { mapApiMedRepVisitToVisit } from "../lib/visits.utils";

export function useMedRepMyCurrentVisit(
  branchId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.medicalRepVisits.myCurrent(branchId ?? ""),
    queryFn: async () => {
      const res = await fetchMedRepMyCurrent(branchId!);
      return res.data.map(mapApiMedRepVisitToVisit);
    },
    enabled: enabled && !!branchId,
  });
}