// TEMP: API integration disabled during kernel refactor. Restore from git history when re-integrating.
"use client";

import { useQuery } from "@tanstack/react-query";
import type { Visit } from "../types/visits.types";
import { queryKeys } from "@/lib/queryKeys";
import { mockInProgressByDoctor } from "../lib/visits.mock";

export type DoctorGroup = {
  doctorId: string;
  doctorName: string;
  specialty?: string;
  visits: Visit[];
};

export function useBranchInProgress(branchId: string | null | undefined) {
  const query = useQuery({
    queryKey: queryKeys.visits.branchInProgress(branchId ?? ""),
    queryFn: async (): Promise<DoctorGroup[]> => mockInProgressByDoctor,
    enabled: !!branchId,
    staleTime: Infinity,
  });

  return { ...query, groups: query.data ?? [] };
}
