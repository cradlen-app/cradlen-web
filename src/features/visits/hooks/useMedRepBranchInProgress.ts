"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchMedRepBranchInProgress } from "../lib/medical-rep.api";
import { mapApiMedRepVisitToVisit } from "../lib/visits.utils";

export function useMedRepBranchInProgress(branchId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.medicalRepVisits.branchInProgress(branchId ?? ""),
    queryFn: async () => {
      const res = await fetchMedRepBranchInProgress({
        branchId: branchId!,
        page: 1,
        limit: 100,
      });
      return res.data.map(mapApiMedRepVisitToVisit);
    },
    enabled: !!branchId,
  });
}