"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchMedRepVisit } from "../lib/medical-rep.api";
import { mapApiMedRepVisitToVisit } from "../lib/visits.utils";

export function useMedRepVisit(visitId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.medicalRepVisits.byId(visitId ?? ""),
    queryFn: async () => {
      const res = await fetchMedRepVisit({ visitId: visitId! });
      return mapApiMedRepVisitToVisit(res.data);
    },
    enabled: !!visitId,
  });
}