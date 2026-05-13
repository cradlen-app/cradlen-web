"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchMedRepMyCurrent } from "../lib/medical-rep.api";
import { mapApiMedRepVisitToVisit } from "../lib/visits.utils";

export function useMedRepMyCurrentVisit(enabled = true) {
  return useQuery({
    queryKey: queryKeys.medicalRepVisits.myCurrent(),
    queryFn: async () => {
      const res = await fetchMedRepMyCurrent();
      return res.data ? mapApiMedRepVisitToVisit(res.data) : null;
    },
    enabled,
  });
}