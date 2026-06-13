import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type { PrescriptionPrint } from "../types/visits.api.types";

/**
 * Printable prescription aggregate + resolved layout template for a visit.
 * Returns 404 when the visit was completed without any medications — callers
 * treat that as "nothing to print".
 */
export function fetchPrescriptionPrint(
  visitId: string,
): Promise<ApiResponse<PrescriptionPrint>> {
  return apiAuthFetch<ApiResponse<PrescriptionPrint>>(
    `/visits/${visitId}/prescription/print`,
  );
}
