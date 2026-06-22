"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchActiveJourneySummary } from "./active-journey-summary.api";

export function useActiveJourneySummary(patientId: string | null | undefined) {
  return useQuery({
    queryKey: patientId
      ? queryKeys.journeySummary.byPatient(patientId)
      : (["active-journey-summary", "disabled"] as const),
    queryFn: async () => {
      const res = await fetchActiveJourneySummary(patientId!);
      return res.data;
    },
    enabled: !!patientId,
    staleTime: 30_000,
  });
}
