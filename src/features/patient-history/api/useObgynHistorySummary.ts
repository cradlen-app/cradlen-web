"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchObgynHistorySummary } from "./obgyn-history-summary.api";

export function useObgynHistorySummary(patientId: string | null | undefined) {
  return useQuery({
    queryKey: patientId
      ? queryKeys.obgynSummary.byPatient(patientId)
      : (["obgyn-history-summary", "disabled"] as const),
    queryFn: async () => {
      const res = await fetchObgynHistorySummary(patientId!);
      return res.data;
    },
    enabled: !!patientId,
    staleTime: 30_000,
  });
}
