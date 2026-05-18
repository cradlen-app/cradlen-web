import { useQuery } from "@tanstack/react-query";
import { medicationQueryKeys } from "../lib/medications.queryKeys";
import { fetchMedications } from "../lib/medications.api";
import type { MedicationListParams } from "../lib/medications.queryKeys";

export function useMedications(params: MedicationListParams) {
  return useQuery({
    queryKey: medicationQueryKeys.list(params),
    queryFn: () => fetchMedications(params),
  });
}
