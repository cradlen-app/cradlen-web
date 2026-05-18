"use client";

import { useQuery } from "@tanstack/react-query";
import { medicalRepQueryKeys } from "../lib/medical-rep.queryKeys";
import { fetchMedicalReps } from "../lib/medical-rep.api";
import type { MedicalRepListParams } from "../lib/medical-rep.queryKeys";

export function useMedicalReps(params: MedicalRepListParams) {
  return useQuery({
    queryKey: medicalRepQueryKeys.list(params),
    queryFn: () => fetchMedicalReps(params),
    staleTime: 30_000,
  });
}
