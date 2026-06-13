"use client";

import { useQuery } from "@tanstack/react-query";
import { medicationQueryKeys } from "../lib/medications.queryKeys";
import { fetchMedicationFacets } from "../lib/medications.api";

export function useMedicationFacets() {
  return useQuery({
    queryKey: medicationQueryKeys.facets(),
    queryFn: fetchMedicationFacets,
    staleTime: 5 * 60 * 1000,
  });
}
