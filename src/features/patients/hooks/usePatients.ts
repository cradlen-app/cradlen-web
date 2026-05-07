"use client";

import { useQuery } from "@tanstack/react-query";
import { mapApiPatientListItemToPatient } from "@/features/visits/lib/visits.utils";
import type { ApiJourneyStatus } from "@/features/visits/types/visits.api.types";
import { fetchBranchPatients } from "../lib/patients.api";
import { queryKeys } from "@/lib/queryKeys";

type UsePatientsParams = {
  search?: string;
  journeyStatus?: ApiJourneyStatus;
};

export function usePatients(branchId: string | undefined, params: UsePatientsParams = {}) {
  return useQuery({
    queryKey: queryKeys.patients.list(branchId ?? "", {
      search: params.search,
      journeyStatus: params.journeyStatus,
    }),
    queryFn: async () => {
      const res = await fetchBranchPatients(branchId!, {
        search: params.search || undefined,
        journey_status: params.journeyStatus,
        limit: 50,
      });
      return {
        patients: res.data.map(mapApiPatientListItemToPatient),
        total: res.meta.total,
      };
    },
    enabled: !!branchId,
    staleTime: 30_000,
  });
}
