"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchPatientVitalsTrend } from "../lib/visits.api";

export function usePatientVitalsTrend({
  patientId,
  excludeVisitId,
}: {
  patientId: string;
  excludeVisitId: string;
}) {
  const query = useQuery({
    queryKey: queryKeys.visits.vitalsTrend(patientId, excludeVisitId),
    queryFn: () => fetchPatientVitalsTrend({ patientId, excludeVisitId }),
  });

  return {
    points: query.data?.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
